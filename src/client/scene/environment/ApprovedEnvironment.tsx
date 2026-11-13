import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, Matrix4, SRGBColorSpace } from 'three';
import type { TrackId } from '../../../shared/tracks.js';
import { activeMechanismLayout } from '../mechanisms/layout.js';
import { COMMON_ASSETS, environmentUrl, mapEnvironmentAssets } from './layout.js';
import { buildEnvironmentGeometry, setEnvironmentTreeVisibility, type EnvironmentGeometry, type EnvironmentModels } from './runtime.js';
import { environmentTreeVisibility } from './visibility.js';

type Props = { track: TrackId; compact: boolean; lowQuality: boolean; reversed?:boolean; onFailure: () => void; onReady: () => void };
const COMMON_URLS = COMMON_ASSETS.map(environmentUrl);
export function clearEnvironmentCache(track: TrackId) {
  // useGLTF(array) is one cache entry, not one entry for each URL.
  useGLTF.clear(COMMON_URLS); useGLTF.clear(mapEnvironmentAssets(track).map(environmentUrl));
}
class EnvironmentBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}
/** No preloading or hidden mount while candidate is off. The gameplay route is
 * outside this boundary, so load failures keep the old scene and all rules. */
export function ApprovedEnvironment(props: Props) {
  return <EnvironmentBoundary onFailure={props.onFailure}><Suspense fallback={null}><EnvironmentAssets {...props} /></Suspense></EnvironmentBoundary>;
}
function EnvironmentAssets({ track, compact, lowQuality, reversed=false, onReady, onFailure }: Props) {
  const names = useMemo(() => mapEnvironmentAssets(track), [track]);
  // Two fixed hooks: common resources survive map switches, map assets are lazy.
  const common = useGLTF(COMMON_URLS), mapParts = useGLTF(names.map(environmentUrl));
  const models = useMemo(() => Object.fromEntries([...COMMON_ASSETS.map((name, i) => [name, common[i]!.scene]), ...names.map((name, i) => [name, mapParts[i]!.scene])]) as EnvironmentModels, [common, mapParts, names]);
  const { scale, lift } = activeMechanismLayout(track), { camera, invalidate } = useThree();
  const options = useMemo(() => ({ scale, lift, lowQuality, reversed }), [scale, lift, lowQuality, reversed]);
  const [kit, setKit] = useState<EnvironmentGeometry>();
  // Build inside the effect: StrictMode cleanup releases exactly its own kit,
  // and its second setup builds a fresh kit instead of reusing disposed buffers.
  useEffect(() => {
    let built: EnvironmentGeometry;
    try { built = buildEnvironmentGeometry(track, models, options); }
    catch { setKit(undefined); onFailure(); return; }
    setKit(built); onReady(); invalidate();
    return () => built.dispose();
  }, [track, models, options, onReady, onFailure, invalidate]);
  useEffect(()=>{
    if(!kit)return;
    const textures=kit.signs.map(({mesh,finish})=>{
      const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
      const context=canvas.getContext('2d')!;context.fillStyle=finish?'#973f31':'#285e55';context.fillRect(0,0,1024,128);context.fillStyle='#fff5df';context.textAlign='center';context.textBaseline='middle';context.font='bold 80px sans-serif';context.fillText(finish?'FINISH':'START',512,66);
      const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;mesh.material.map=texture;mesh.material.needsUpdate=true;return texture;
    });invalidate();return()=>textures.forEach(texture=>texture.dispose());
  },[kit,invalidate]);
  const visibility = useMemo(() => environmentTreeVisibility(track, options, compact), [track, options, compact]);
  const previousCamera = useRef<Matrix4 | undefined>(undefined), previousKit = useRef<EnvironmentGeometry | undefined>(undefined);
  useEffect(() => { previousCamera.current = undefined; }, [visibility]);
  useFrame(() => {
    if (!kit || (previousKit.current === kit && previousCamera.current?.equals(camera.matrixWorld))) return;
    previousKit.current = kit; previousCamera.current = camera.matrixWorld.clone();
    setEnvironmentTreeVisibility(kit, visibility(camera, kit.trees));
  });
  // The five approved light templates are not recovered. Keep existing unified
  // day/night lighting; no floating replacement fixtures or new permanent RAF.
  return kit ? <group rotation={[0, compact ? -Math.PI / 2 : 0, 0]} name="rebuilt-environment-root"><primitive object={kit.root} dispose={null} /></group> : null;
}
