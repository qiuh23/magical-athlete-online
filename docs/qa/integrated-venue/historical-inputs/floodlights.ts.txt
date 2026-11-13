import { BoxGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three';
import type { TrackId } from '../../../shared/tracks.js';
import { environmentPoint, isNaturalMap, type EnvironmentOptions } from './layout.js';
import type { EnvironmentModels } from './runtime.js';
export const FLOODLIGHT_ASSETS=['base','pole','yoke','housing','lenses'] as const;
export const floodlightUrl=(asset:string)=>`/models/floodlights-rebuilt-v3/${asset}.glb`;
export const FLOODLIGHT_REVISION='floodlights-reference-rebuilt-v3-20261113';
/** Fixed route-adjacent mounts. No root follows an actor or an animation. */
export function floodlightLayout(track:TrackId,options:EnvironmentOptions){
  const anchors:readonly(readonly[number,number,'x'|'z',number])[]=track==='squiggle'?[[11,-1,'z',13],[25,1,'z',23]]:track==='boardwalks'?[[5,1,'z',8],[27,1,'x',25]]:track==='bridges'?[[1,-1,'z',3],[27,1,'z',20]]:[[2,-1,'z',4],[19,1,'z',21]];
  return anchors.map(([node,side,axis,targetNode],index)=>{
    const edge=environmentPoint(track,node,options),target=environmentPoint(track,targetNode,options),floor=isNaturalMap(track)?.12:options.lift?.055:.15;
    const base=edge.clone();base.y=floor;base[axis]+=side*2.5;
    const head=base.clone();head.y=Math.max(5.6,target.y+4.2);
    const direction=target.clone().sub(head).normalize(),rotation=new Quaternion().setFromUnitVectors(new Vector3(0,0,-1),direction);
    const receiver=head.clone().add(new Vector3(0,.14,-.16).applyQuaternion(rotation));
    // Aim follows the physical panel normal. Intersect the chosen node's deck plane.
    const axisDistance=(receiver.y-target.y)/(-direction.y);
    target.copy(receiver).addScaledVector(direction,axisDistance);
    const plinth=edge.clone();plinth.y=(floor-.84)/2;plinth[axis]+=side*2.05;
    return {id:`${track}:light:${index}`,node,targetNode,base,head,target,direction,rotation,receiver,height:head.y-base.y,plinth,plinthSize:axis==='z'?[1.0,floor+.84,1.7]:[1.7,floor+.84,1.0],active:!options.lowQuality||index===0};
  });
}
/** Three r186 decay=2 attenuation, including its finite cutoff. */
export function spotDistanceAttenuation(r:number,cutoff:number){return Math.pow(Math.max(0,1-Math.pow(r/cutoff,4)),2)/Math.max(r*r,.01);}
export function venueSpotPhotometry(position:Vector3,target:Vector3){
  const axis=target.clone().sub(position).normalize(),cosine=Math.max(.05,-axis.y),receivingDistance=position.distanceTo(target),distance=receivingDistance*1.65,targetLux=3.2;
  return {intensity:targetLux/(spotDistanceAttenuation(receivingDistance,distance)*cosine),distance,angle:Math.PI/7,penumbra:.65,decay:2,targetLux,receivingDistance,cosine,position:position.toArray(),target:target.toArray()};
}
/** Linear receiver calibration, not copying Three candela into Cycles watts.
 * Both engines' directional reference is compared on the same unit receiver.
 * Three cutoff is compensated only at that audited receiver; cone falloff differs. */
export function blenderSpotWatts(spot:ReturnType<typeof venueSpotPhotometry>){return spot.intensity*4*Math.PI*Math.pow(Math.max(0,1-Math.pow(spot.receivingDistance/spot.distance,4)),2);}
export function buildFloodlightGeometry(track:TrackId,models:EnvironmentModels,options:EnvironmentOptions){
  for(const asset of FLOODLIGHT_ASSETS){if(!models[asset])throw Error(`Missing floodlight ${asset}`);models[asset]!.traverse(node=>{if(asset==='lenses'&&node instanceof Mesh&&!(node.material instanceof MeshStandardMaterial))throw Error('Lens material must be standard');});}
  const root=new Group();root.name=`rebuilt-floodlights:${track}`;const layout=floodlightLayout(track,options),owned:MeshStandardMaterial[]=[],batches:InstancedMesh[]=[],lenses:{material:MeshStandardMaterial;active:boolean}[]=[];
  const dummy=new Object3D(),geometry=new BoxGeometry(1,1,1),stone=new MeshStandardMaterial({color:'#526b64',roughness:.9});owned.push(stone);
  const foundation=new InstancedMesh(geometry,stone,layout.length);foundation.name='floodlight-fixed-foundations';foundation.userData.environmentRole='light-foundation';foundation.receiveShadow=true;foundation.castShadow=!options.lowQuality;foundation.raycast=()=>{};
  layout.forEach((lamp,i)=>{dummy.position.copy(lamp.plinth);dummy.quaternion.identity();dummy.scale.fromArray(lamp.plinthSize);dummy.updateMatrix();foundation.setMatrixAt(i,dummy.matrix);});root.add(foundation);batches.push(foundation);
  for(const asset of FLOODLIGHT_ASSETS){const source=models[asset];if(!source)throw Error(`Missing floodlight ${asset}`);source.updateMatrixWorld(true);source.traverse(node=>{
    if(!(node instanceof Mesh))return;
    const groups=asset==='lenses'?layout.map((lamp,i)=>({lamps:[{lamp,i}],active:lamp.active})): [{lamps:layout.map((lamp,i)=>({lamp,i})),active:false}];
    for(const group of groups){let material=node.material;if(asset==='lenses'){
      if(!(material instanceof MeshStandardMaterial))throw Error('Lens material must be standard');material=material.clone();material.emissive.set('#ffdca0');material.emissiveIntensity=0;owned.push(material);lenses.push({material,active:group.active});
    }
    const mesh=new InstancedMesh(node.geometry,material,group.lamps.length);mesh.name=`floodlight:${asset}:${node.name}:${group.lamps[0]!.i}`;mesh.userData.environmentRole='light-hardware';mesh.raycast=()=>{};mesh.castShadow=!options.lowQuality&&asset!=='lenses';mesh.receiveShadow=true;
    group.lamps.forEach(({lamp},i)=>{dummy.position.copy(asset==='base'?lamp.base:asset==='pole'?lamp.base.clone().add(new Vector3(0,.16,0)):lamp.head);dummy.quaternion.copy(asset==='base'||asset==='pole'?new Quaternion():lamp.rotation);dummy.scale.set(1,asset==='pole'?lamp.height-.16:1,1);dummy.updateMatrix();mesh.setMatrixAt(i,new Matrix4().multiplyMatrices(dummy.matrix,node.matrixWorld));});mesh.computeBoundingSphere();root.add(mesh);batches.push(mesh);
    }
  });}
  root.updateMatrixWorld(true);let disposed=false;
  return {root,layout,lenses,setNightFactor(value:number){for(const lens of lenses)lens.material.emissiveIntensity=lens.active?2.4*value:0;},dispose(){if(disposed)return;disposed=true;batches.forEach(m=>m.dispose());geometry.dispose();owned.forEach(m=>m.dispose());}};
}
