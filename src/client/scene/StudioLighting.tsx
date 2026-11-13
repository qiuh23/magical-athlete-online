import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/** Subtle grounding survives the economy tier without another render pass. */
export function PawnContact() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!, gradient = ctx.createRadialGradient(32, 32, 12, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(26,65,52,.26)'); gradient.addColorStop(1, 'rgba(26,65,52,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
    const value = new THREE.CanvasTexture(canvas); value.colorSpace = THREE.SRGBColorSpace; return value;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[.035, .009, -.025]}>
    <planeGeometry args={[.9, .9]} /><meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
  </mesh>;
}

/** Read-only frame-cost telemetry. Demand frames measure time between requested
 * renders (including the 20 Hz day/night clock), not GPU frame throughput.
 * Quality and content are controlled only by the user's explicit setting. */
export function AdaptiveQuality({ lowQuality, root }: { lowQuality: boolean; root: React.RefObject<HTMLElement | null> }) {
  const sample = useRef({ frames: 0, slow: 0, elapsed: 0 });
  const { gl } = useThree();
  useFrame((state, delta) => {
    if (root.current) {
      root.current.dataset.quality = lowQuality ? 'economy' : 'studio';
      root.current.dataset.pixelRatio = gl.getPixelRatio().toFixed(2);
    }
    const s = sample.current;
    if (state.frameloop !== 'always' || lowQuality || !Number.isFinite(delta) || delta <= 0 || delta > .2) {
      s.frames = 0; s.slow = 0; s.elapsed = 0;
      return;
    }
    s.frames++; s.elapsed += delta; if (delta > .038) s.slow++;
    if (s.frames >= 90) {
      if (root.current) {
        root.current.dataset.sampleFrameMs = (s.elapsed * 1000 / s.frames).toFixed(1);
        root.current.dataset.adaptiveReason = s.slow > 60 ? 'sustained-frame-cost-observed' : 'continuous-frames';
      }
      s.frames = 0; s.slow = 0; s.elapsed = 0;
    }
  });
  return null;
}
