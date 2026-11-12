/** Athlete V7 candidate: replace only the StudioLighting invocation.
 * Keep the original PawnContact and AdaptiveQuality exports and Canvas policy.
 * API checked against the project's r186 / R3F 9.8 source; run repository tests before use.
 */
import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createSkyEnvironment, SKY_SOURCE_DIRECTIONS } from './sky-environment.mjs';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type AthleteLightMode = 'day' | 'dusk' | 'night';
export const ATHLETE_LIGHT_PRESETS = {
  day: { exposure: 1.25, sky: '#c9e3ff', ground: '#739576', hemi: .60, ambient: .08, env: .18, key: '#fff2dd', keyPower: 4.1, fill: '#b8d8ff', fillPower: .30, keyPosition: [-8, 20, 12] as [number, number, number], shadow: .78 },
  dusk: { exposure: 1.0, sky: '#abbde4', ground: '#5d715d', hemi: .35, ambient: .06, env: .12, key: '#ffc090', keyPower: 1.55, fill: '#94b4ea', fillPower: .28, keyPosition: [-16, 7, -18] as [number, number, number], shadow: .65 },
  night: { exposure: 1.15, sky: '#789bd4', ground: '#385268', hemi: .42, ambient: .06, env: .09, key: '#9ebeff', keyPower: 2.0, fill: '#829fd4', fillPower: .20, keyPosition: [8, 16, 10] as [number, number, number], shadow: .68 },
};
/** External, deterministic mode. No Date.now, timers or permanent useFrame loop.
 * Night defaults to moon/sky ambience. stadiumLights requires a visible/established venue-light source.
 */
export function StudioLightingV7({ compact, lowQuality, mode = 'day', stadiumLights = false }: {
  compact: boolean; lowQuality: boolean; mode?: AthleteLightMode; stadiumLights?: boolean;
}) {
  const { gl, scene, camera, invalidate } = useThree();
  const keyLight = useRef<THREE.DirectionalLight | null>(null);
  const sky = useRef<ReturnType<typeof createSkyEnvironment> | null>(null);
  useEffect(() => {
    const controller = createSkyEnvironment({ THREE, scene, camera,
      style: 'physical', profile: 'athlete', starMode: 'diorama', lowQuality, state: { mode },
      directions: SKY_SOURCE_DIRECTIONS.athlete });
    sky.current = controller;
    invalidate();
    return () => { controller.dispose(); if (sky.current === controller) sky.current = null; invalidate(); };
    // Mode/quality update below: do not reallocate sky for a preset switch. No camera-relative light-source alignment.
  }, [scene, camera, invalidate]);
  useEffect(() => {
    sky.current?.setQuality(lowQuality);
    sky.current?.update({ camera, state: { mode } });
    invalidate();
  }, [camera, mode, lowQuality, invalidate]);
  // Sync to camera movement only during frames already requested by the game.
  // No invalidate here, no timer, no new render loop.
  useFrame(() => {
    const controller = sky.current;
    if (!controller) return;
    controller.update({ camera });
    if (keyLight.current) keyLight.current.position.copy(controller.getLightingState().direction)
      .multiplyScalar(Math.hypot(...preset.keyPosition));
  });
  const ownedEnvironment = useRef<THREE.Texture | null>(null);
  const base = ATHLETE_LIGHT_PRESETS[mode];
  const preset = mode === 'night' && stadiumLights
    ? { ...base, hemi: .30, env: .14, key: '#fff3de', keyPower: 2.05, fill: '#b9cde2', fillPower: .35, shadow: .76 }
    : base;
  useEffect(() => {
    const previous = {
      exposure: gl.toneMappingExposure, mapping: gl.toneMapping,
      colorSpace: gl.outputColorSpace, shadowType: gl.shadowMap.type,
    };
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = preset.exposure;
    gl.shadowMap.type = THREE.PCFShadowMap;
    gl.shadowMap.needsUpdate = true;
    invalidate();
    return () => {
      // Do not overwrite a setting another owner changed after this effect.
      if (gl.toneMappingExposure === preset.exposure) gl.toneMappingExposure = previous.exposure;
      if (gl.toneMapping === THREE.ACESFilmicToneMapping) gl.toneMapping = previous.mapping;
      if (gl.outputColorSpace === THREE.SRGBColorSpace) gl.outputColorSpace = previous.colorSpace;
      if (gl.shadowMap.type === THREE.PCFShadowMap) gl.shadowMap.type = previous.shadowType;
      gl.shadowMap.needsUpdate = true;
      invalidate();
    };
  }, [gl, invalidate, preset.exposure]);

  useEffect(() => {
    const previous = { map: scene.environment, intensity: scene.environmentIntensity };
    let target: THREE.WebGLRenderTarget | undefined;
    // Economy mode performs no PMREM work and cannot retain another studio map accidentally.
    if (!lowQuality) {
      let generator: THREE.PMREMGenerator | undefined;
      let studio: RoomEnvironment | undefined;
      try {
        generator = new THREE.PMREMGenerator(gl);
        studio = new RoomEnvironment();
        target = generator.fromScene(studio, .06);
      } catch (error) {
        // Lighting failure must not take down a match. Hemisphere/key remain usable.
        console.warn('[StudioLightingV7] Environment unavailable; using direct lights.', error);
      } finally {
        studio?.dispose();
        generator?.dispose();
      }
    }
    const ownedMap = target?.texture ?? null;
    ownedEnvironment.current = ownedMap;
    scene.environment = ownedMap;
    scene.environmentIntensity = 0;
    invalidate();
    return () => {
      // Restore only while this component still owns the scene slot.
      if (scene.environment === ownedMap) {
        scene.environment = previous.map;
        scene.environmentIntensity = previous.intensity;
      }
      if (ownedEnvironment.current === ownedMap) ownedEnvironment.current = null;
      target?.dispose();
      invalidate();
    };
  }, [gl, scene, invalidate, lowQuality]);

  useEffect(() => {
    // Preset changes reuse the PMREM target; only lowQuality/gl remount can regenerate it.
    if (scene.environment === ownedEnvironment.current) {
      scene.environmentIntensity = scene.environment && !lowQuality ? preset.env : 0;
    }
    invalidate();
  }, [gl, scene, lowQuality, preset.env, mode, stadiumLights, invalidate]);

  return <>
    <ambientLight intensity={preset.ambient} />
    <hemisphereLight args={[preset.sky, preset.ground, preset.hemi]} />
    <directionalLight ref={keyLight} color={preset.key} position={preset.keyPosition} intensity={preset.keyPower} castShadow={!lowQuality}
      shadow-mapSize={compact ? [1024, 1024] : [2048, 2048]}
      shadow-camera-left={-21} shadow-camera-right={21} shadow-camera-top={21} shadow-camera-bottom={-21}
      shadow-camera-near={.5} shadow-camera-far={65} shadow-normalBias={.018}
      shadow-bias={-.00012} shadow-radius={compact ? .7 : 1.4} shadow-intensity={preset.shadow} />
    <directionalLight color={preset.fill} position={[8, 8, -7]} intensity={preset.fillPower} />
  </>;
}
