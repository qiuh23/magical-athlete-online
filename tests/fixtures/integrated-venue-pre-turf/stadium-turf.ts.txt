import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat, SRGBColorSpace } from 'three';

/** Deterministic, shared small turf input. The same pixels are embedded in the
 * offline GLB, so the review never substitutes an untextured green rectangle. */
export const STADIUM_TURF_REVISION = 'soft-mown-turf-v1';
export const STADIUM_TURF_SIZE = [512,128] as const;
let sharedPixels: { color: Uint8Array; normal: Uint8Array } | undefined;
export function stadiumTurfPixels() {
  if(sharedPixels)return sharedPixels;
  const [w,h]=STADIUM_TURF_SIZE,color=new Uint8Array(w*h*4),normal=new Uint8Array(w*h*4);
  let seed=419;
  const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296-.5;};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const u=x/w,v=y/h,edge=Math.min(v,1-v),fade=Math.min(1,edge/.10);
    // Rounded mowing transitions, slight band drift, and non-repeating fine
    // flecks keep this subordinate to the track rather than a stripe decal.
    const direction=Math.tanh(Math.sin(u*Math.PI*12+.035*Math.sin(v*Math.PI*2))*2.1)*fade;
    const low=1.8*Math.sin(u*19+v*5)+1.2*Math.sin(u*41-v*11);
    const micro=noise()*8,light=direction*4.2+low+micro,i=(y*w+x)*4;
    color.set([Math.round(104+light),Math.round(139+light),Math.round(66+light*.65),255],i);
    const nx=noise()*.10,ny=direction*.085+noise()*.09,nz=Math.sqrt(1-nx*nx-ny*ny);
    normal.set([Math.round(127.5+nx*127.5),Math.round(127.5+ny*127.5),Math.round(127.5+nz*127.5),255],i);
  }
  return sharedPixels={color,normal};
}
export function createStadiumTurfTextures() {
  const data=stadiumTurfPixels();
  const texture=(bytes:Uint8Array,name:string)=>{const t=new DataTexture(bytes,...STADIUM_TURF_SIZE,RGBAFormat);t.name=name;t.wrapS=t.wrapT=RepeatWrapping;t.magFilter=LinearFilter;t.minFilter=LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t;};
  const color=texture(data.color,'stadium-turf-soft-mowing-color');color.colorSpace=SRGBColorSpace;
  return {color,normal:texture(data.normal,'stadium-turf-directional-micro-normal')};
}
