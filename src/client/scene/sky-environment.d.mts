import type * as Three from 'three';
export type SkyAtmosphere = { rayleigh: number; turbidity: number; mieCoefficient: number; mieDirectionalG: number; daylightScale: number; cloudOpacity: number };
export const SKY_ATMOSPHERE_PROFILES: Readonly<Record<'catan'|'athlete', Readonly<SkyAtmosphere>>>;
/** Radius bounds as fractions of viewport height: small, medium, prominent. */
export const SKY_STAR_PROFILES: Readonly<Record<'catan'|'athlete', { readonly radiusMin: readonly [number,number,number]; readonly radiusMax: readonly [number,number,number] }>>;
export type SkyStarMode = 'off' | 'physical' | 'diorama';
export type SkyMode = 'day' | 'dusk' | 'twilight' | 'night';
export type SkyState = { mode: SkyMode } | { from: SkyMode; to: SkyMode; mix: number };
export type SkyDirection = Three.Vector3 | readonly [number, number, number];
export type SkyDirections = Readonly<Record<'day'|'dusk'|'night', SkyDirection>>;
export const SKY_SOURCE_DIRECTIONS: Readonly<{ catan: SkyDirections; athlete: SkyDirections }>;
export type SkyProjection = { x: number | null; y: number | null; visible: boolean; parallelRays: boolean };
export interface SkyEnvironment {
  mesh: Three.Mesh<Three.BufferGeometry, Three.ShaderMaterial>;
  material: Three.ShaderMaterial;
  uniforms: Record<string, Three.IUniform>;
  setState(state: SkyState): void;
  setSourceDirection(direction: SkyDirection): void;
  /** @deprecated V7 integrations must not orient light sources to make celestial bodies visible. Explicit artistic compatibility only. */
  alignSourcesToCamera(camera?: Three.PerspectiveCamera | Three.OrthographicCamera): ReturnType<SkyEnvironment['getLightingState']> | undefined;
  update(options?: { camera?: Three.PerspectiveCamera | Three.OrthographicCamera; state?: SkyState; sourceDirection?: SkyDirection; aspect?: number }): void;
  /** Changes only background stars, never lights/camera/sun/moon. No redraw loop. */
  setStars(settings: { mode?: SkyStarMode; intensity?: number }): void;
  setQuality(lowQuality: boolean | { lowQuality: boolean }): void;
  getState(): { from: SkyMode; to: SkyMode; mix: number; lowQuality: boolean; opacity: number; profile: 'catan'|'athlete'; starMode: SkyStarMode; starIntensity: number; disposed: boolean };
  getLightingState(): { direction: Three.Vector3; sourceColor: Three.Color; source: 'sun'|'moon'|'blend'; nightMix: number; angularRadius: number };
  getProjectionState(): { style: 'physical'|'artistic'|'board-diorama'; aspect: number; orthographic: boolean; backdropElevation: number | null; backdropFov: number | null; minHorizontalFov: number; effectiveVerticalFov: number; sourceAlignment: string; right: Three.Vector3; up: Three.Vector3; forward: Three.Vector3; sourceProjection: SkyProjection; adaptation: string };
  projectDirection(direction?: SkyDirection): SkyProjection;
  dispose(): void;
}
export function createSkyEnvironment(options: {
  THREE: typeof Three;
  scene: Three.Scene;
  camera: Three.PerspectiveCamera | Three.OrthographicCamera;
  style?: 'physical' | 'artistic' | 'board-diorama';
  profile?: 'catan' | 'athlete';
  atmosphere?: Partial<SkyAtmosphere>;
  /** Explicit decorative backdrop stars remain visible in high-angle/ortho views. */
  starMode?: SkyStarMode;
  /** [0,1], multiplied by deterministic night-state fade. Default1. */
  starIntensity?: number;
  lowQuality?: boolean;
  state?: SkyState;
  /** Defaults to SKY_SOURCE_DIRECTIONS[profile], never another game's directions. */
  directions?: SkyDirections;
  opacity?: number;
  /** Canvas width / height; inferred from camera when omitted. */
  aspect?: number;
  /** Explicit artistic override only; default uses actual camera orientation/FOV. */
  backdropElevation?: number;
  backdropFov?: number;
  /** Explicit artistic field-of-view override; default0 disables widening. */
  minHorizontalFov?: number;
  /** Match renderer context; default true matches Three's default canvas. */
  premultipliedAlpha?: boolean;
}): SkyEnvironment;
