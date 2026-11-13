import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, FrontSide, Mesh, ShaderMaterial, Vector3 } from 'three';
import { venuePoolPhotometry } from './floodlight-pools.js';
import { FLOODLIGHT_COLOR } from './floodlight-color.js';
/** A bounded, soft scattering core, not a ray-marched volume. Actual illumination
 * is still supplied by the existing spots. All eight fixtures share one draw. */
export const BEAM_PROFILE={segments:24,rings:8,startRadius:.16,opacity:.11} as const;
export function createFloodlightBeams(lamps:ReadonlyArray<{receiver:Vector3;target:Vector3}>){
 const positions:number[]=[],normals:number[]=[],uv:number[]=[],indices:number[]=[];
 for(const lamp of lamps){
  const photo=venuePoolPhotometry(lamp.receiver,lamp.target),axis=lamp.target.clone().sub(lamp.receiver).normalize();
  const right=new Vector3().crossVectors(axis,new Vector3(0,1,0));if(right.lengthSq()<.001)right.set(1,0,0);right.normalize();
  const up=new Vector3().crossVectors(right,axis).normalize(),base=positions.length/3;
  for(let ring=0;ring<=BEAM_PROFILE.rings;ring++)for(let i=0;i<=BEAM_PROFILE.segments;i++){
   const t=ring/BEAM_PROFILE.rings,a=i/BEAM_PROFILE.segments*Math.PI*2;
   const radial=right.clone().multiplyScalar(Math.cos(a)).addScaledVector(up,Math.sin(a));
   // Scatter through the bright interior of the real cone up to its
   // central receiver plane; scene depth occludes portions behind the ground.
   const scatteringAngle=photo.angle*(1-photo.penumbra*.7),length=photo.receivingDistance;
   const radius=BEAM_PROFILE.startRadius+Math.tan(scatteringAngle)*length*t;
   const p=lamp.receiver.clone().addScaledVector(axis,length*t).addScaledVector(radial,radius);
   positions.push(...p.toArray());normals.push(...radial.toArray());uv.push(i/BEAM_PROFILE.segments,t);
  }
  for(let r=0;r<BEAM_PROFILE.rings;r++)for(let i=0;i<BEAM_PROFILE.segments;i++){const a=base+r*(BEAM_PROFILE.segments+1)+i,b=a+BEAM_PROFILE.segments+1;indices.push(a,b,a+1,a+1,b,b+1);}
 }
 const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeBoundingSphere();
 const material=new ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:FrontSide,blending:AdditiveBlending,toneMapped:false,uniforms:{nightFactor:{value:0},beamColor:{value:new Color(FLOODLIGHT_COLOR)},opacity:{value:BEAM_PROFILE.opacity}},
 vertexShader:`varying vec2 vUv; varying vec3 vNormal; varying vec3 vEye; void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vEye=-p.xyz;gl_Position=projectionMatrix*p;}`,
 fragmentShader:`uniform float nightFactor;uniform float opacity;uniform vec3 beamColor;varying vec2 vUv;varying vec3 vNormal;varying vec3 vEye;void main(){float edge=pow(abs(dot(normalize(vNormal),normalize(vEye))),1.7);float endFade=1.-smoothstep(.65,1.,vUv.y);float startFade=smoothstep(0.,.045,vUv.y);float falloff=mix(1.,.35,vUv.y);float a=opacity*nightFactor*edge*endFade*startFade*falloff;gl_FragColor=vec4(beamColor,a);#include <colorspace_fragment>
}`.replace(';#include',';\n#include')});
 const mesh=new Mesh(geometry,material);mesh.name='floodlight-soft-beams';mesh.visible=false;mesh.raycast=()=>{};mesh.renderOrder=2;
 let disposed=false;
 return {mesh,setNightFactor(value:number){const factor=Math.max(0,Math.min(1,value));material.uniforms.nightFactor!.value=factor;mesh.visible=factor>0;},dispose(){if(disposed)return;disposed=true;geometry.dispose();material.dispose();}};
}
