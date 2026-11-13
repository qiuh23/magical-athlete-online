import { Suspense, useEffect, useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Group as GroupObject, InstancedMesh, Matrix4, Mesh, Object3D, type Group } from 'three';
import { instantiateStadiumModel, STADIUM_ASSET_NAMES, STADIUM_URLS, type StadiumModels, type StadiumAssetName, STADIUM_PLACEMENTS, stadiumDecorPosition, TALL_DECOR } from './models.js';

function LoadedAssets({ children, fallback }: { children: (models: StadiumModels) => ReactNode; fallback: ReactNode }) {
  let sources: ReturnType<typeof useGLTF>[];
  try { sources = useGLTF(STADIUM_URLS); }
  catch (error) {
    if (error && typeof (error as { then?: unknown }).then === 'function') throw error;
    // A missing decorative model must never remove the playable track.
    return fallback;
  }
  const models = Object.fromEntries(STADIUM_ASSET_NAMES.map((name, index) => [name, sources[index]!.scene])) as StadiumModels;
  return <group name="stadium-v9-models">{children(models)}</group>;
}
export function StadiumAssets(props: { children: (models: StadiumModels) => ReactNode; fallback: ReactNode }) {
  return <Suspense fallback={props.fallback}><LoadedAssets {...props} /></Suspense>;
}

export function StadiumModel({ source, position = [0, 0, 0], rotationY = 0, surfaceColor, triggered = false, gateReversed = false }: {
  source: Group; position?: [number, number, number]; rotationY?: number; surfaceColor?: string; triggered?: boolean; gateReversed?: boolean;
}) {
  const model = useMemo(() => instantiateStadiumModel(source, surfaceColor, gateReversed), [source, surfaceColor, gateReversed]);
  useEffect(() => () => model.dispose(), [model]);
  // Consume already-requested frames only. No new animation or invalidate loop.
  useFrame(({ clock }) => { for (const material of model.owned) if (material.name.startsWith('tile_surface_')) material.emissiveIntensity = triggered ? .16 + Math.sin(clock.elapsedTime * 8) * .09 : 0; });
  return <primitive object={model.object} position={position} rotation={[0, rotationY, 0]} dispose={null} />;
}

/** Repeated rails/flags share draws by source primitive, not one draw per prop. */
export function StadiumDecor({ models, showTallDecor, infieldOnly=false }: { models: StadiumModels; showTallDecor: boolean; infieldOnly?:boolean }) {
  return <>{decorGroups.filter(([name])=>!infieldOnly||!['athlete_rail_corner','athlete_rail_straight','athlete_pennant'].includes(name)).map(([name, placements]) => TALL_DECOR.has(name) && !showTallDecor ? null
    : <InstancedDecor key={name} source={models[name]} placements={placements} mechanismCandidate={infieldOnly}/>)}</>;
}
const byAsset = new Map<StadiumAssetName, typeof STADIUM_PLACEMENTS>();
for (const placement of STADIUM_PLACEMENTS) {
  const name = placement.asset.replace('.glb', '') as StadiumAssetName;
  const placements = byAsset.get(name) ?? []; placements.push(placement); byAsset.set(name, placements);
}
const decorGroups = [...byAsset];
function InstancedDecor({ source, placements,mechanismCandidate=false }: { source: Group; placements: typeof STADIUM_PLACEMENTS;mechanismCandidate?:boolean }) {
  const group = useMemo(() => {
    const result = new GroupObject(); result.name = placements[0]!.asset.replace('.glb', '');
    source.updateMatrixWorld(true);
    const placement = new Object3D(), matrix = new Matrix4();
    source.traverse(node => {
      if (!(node instanceof Mesh)) return;
      const instances = new InstancedMesh(node.geometry, node.material, placements.length);
      instances.name = node.name;
      instances.castShadow = instances.receiveShadow = true;
      instances.raycast = () => {};
      placements.forEach((entry, index) => {
        placement.position.fromArray(stadiumDecorPosition(entry,mechanismCandidate)); placement.rotation.set(0, entry.rotationY, 0); placement.updateMatrix();
        matrix.multiplyMatrices(placement.matrix, node.matrixWorld); instances.setMatrixAt(index, matrix);
      });
      instances.instanceMatrix.needsUpdate = true;
      instances.computeBoundingSphere();
      result.add(instances);
    });
    return result;
  }, [source, placements,mechanismCandidate]);
  useEffect(() => () => { group.traverse(node => { if (node instanceof InstancedMesh) node.dispose(); }); }, [group]);
  return <primitive object={group} dispose={null} />;
}
