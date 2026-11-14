import { DataTexture, LinearFilter, LinearMipmapLinearFilter, MeshStandardMaterial, RepeatWrapping, RGBAFormat, SRGBColorSpace, Vector2 } from 'three';

/** One authored surface, not a carpet of blade meshes. The offline evidence uses
 * these exact pixels/material values; only the renderer and sky fill differ. */
export const STADIUM_TURF_REVISION = 'sports-infield-short-cut-v2';
export const STADIUM_TURF_SIZE = [1024, 256] as const;
export const STADIUM_TURF_BANDS = 18;
export const STADIUM_TURF_ROUGHNESS = .92;
export const STADIUM_TURF_NORMAL_SCALE = .62;
let sharedPixels: { color: Uint8Array; normal: Uint8Array } | undefined;

function hash(x: number, y: number) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ 419;
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return ((n ^ n >>> 16) >>> 0) / 4294967295;
}
const smooth = (t: number) => { const v = Math.max(0, Math.min(1, t)); return v * v * (3 - 2 * v); };
function patch(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y), u = smooth(x - ix), v = smooth(y - iy);
  const a = hash(ix, iy) * (1-u) + hash(ix+1, iy) * u;
  const b = hash(ix, iy+1) * (1-u) + hash(ix+1, iy+1) * u;
  return (a * (1-v) + b * v) * 2 - 1;
}

/** Mower-width passes with softened, slightly imperfect edges. Short horizontal
 * headlands blend the turns, avoiding hard stripe decals all the way to the curb. */
export function stadiumMowDirection(u: number, v: number) {
  const edge = Math.min(v, 1-v);
  const headland = smooth(edge / .065);
  const drift = .034 * Math.sin(v * Math.PI * 6) + .017 * Math.sin(v * Math.PI * 14 + u * 9);
  return Math.tanh(Math.sin(u * Math.PI * STADIUM_TURF_BANDS + drift) * 7) * headland;
}

export function stadiumTurfPixels() {
  if (sharedPixels) return sharedPixels;
  const [w,h] = STADIUM_TURF_SIZE, color = new Uint8Array(w*h*4), normal = new Uint8Array(w*h*4);
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    const u=x/(w-1), v=y/(h-1), direction=stadiumMowDirection(u,v);
    // Dense 2–4 texel fibres, not large bright flecks. Different length scales
    // prevent both a flat painted surface and a visibly tiled noise texture.
    const fibre = (hash(x,y)*.46 + hash(x,y-1)*.34 + hash(x,y-2)*.20 - .5) * 2;
    const tip = hash(x+91,y+43) > .973 ? 4 : 0;
    const mottling = patch(u*36,v*11)*3.2 + patch(u*103,v*29)*1.6;
    const light = direction*11.5 + mottling + fibre*8;
    const i=(y*w+x)*4;
    color.set([Math.round(77+light*.88+tip),Math.round(119+light+tip*.7),Math.round(58+light*.52),255],i);
    // Bent short grass changes the PBR light response between mowing passes.
    // Sparse fine slopes survive close views; mipmaps average them at overview.
    const nx=(hash(x-1,y)-hash(x+1,y))*.18;
    const ny=direction*.085+(hash(x,y-1)-hash(x,y+1))*.12;
    const nz=Math.sqrt(1-nx*nx-ny*ny);
    normal.set([Math.round(127.5+nx*127.5),Math.round(127.5+ny*127.5),Math.round(127.5+nz*127.5),255],i);
  }
  return sharedPixels={color,normal};
}
export function createStadiumTurfTextures() {
  const data=stadiumTurfPixels();
  const texture=(bytes:Uint8Array,name:string)=>{const t=new DataTexture(bytes,...STADIUM_TURF_SIZE,RGBAFormat);t.name=name;t.wrapS=t.wrapT=RepeatWrapping;t.magFilter=LinearFilter;t.minFilter=LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;};
  const color=texture(data.color,'stadium-turf-short-cut-color');color.colorSpace=SRGBColorSpace;
  return {color,normal:texture(data.normal,'stadium-turf-bent-fibre-normal')};
}
/** Same single PBR draw in both qualities. Economy retains the authored colour
 * and mipmaps, but avoids the additional normal-map sample/derivatives. */
export function createStadiumTurfMaterial(textures:ReturnType<typeof createStadiumTurfTextures>,lowQuality=false) {
  const material = new MeshStandardMaterial({color:'#ffffff',map:textures.color,roughness:STADIUM_TURF_ROUGHNESS,metalness:0,normalMap:lowQuality?null:textures.normal,normalScale:new Vector2(STADIUM_TURF_NORMAL_SCALE,STADIUM_TURF_NORMAL_SCALE)});
  material.name=STADIUM_TURF_REVISION;
  return material;
}
