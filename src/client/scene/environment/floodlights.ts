import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three';
import type { TrackId } from '../../../shared/tracks.js';
import edgeMounts from './floodlight-edge-mounts.json' with {type:'json'};
import { trackNodeIds } from '../math.js';
import { environmentPoint, isNaturalMap, type EnvironmentOptions } from './layout.js';
import type { EnvironmentModels } from './runtime.js';
export const FLOODLIGHT_ASSETS=['base','pole','yoke','housing','lenses'] as const;
export const floodlightUrl=(asset:string)=>`/models/floodlights-rebuilt-v3/${asset}.glb`;
export const FLOODLIGHT_REVISION='floodlights-stadium-rows-v4-20261113';
/** Visual fixture count and actual light/shadow budgets are intentionally separate.
 * Eight panels share one lens material/batch. Economy still lights four zones. */
export const VENUE_LIGHT_BUDGET={full:{fixtures:8,spots:6,shadows:1},economy:{fixtures:8,spots:4,shadows:0}} as const;
/** Fixed perimeter rows, never actor-following. Each map's real route determines
 * the extent, height and cross-field aim. Both layouts use the same hardware. */
export function floodlightLayout(track:TrackId,options:EnvironmentOptions){
  const route=trackNodeIds(track).map(node=>({node,point:environmentPoint(track,node,options)}));
  const xs=route.map(p=>p.point.x),zs=route.map(p=>p.point.z),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  const span=maxX-minX,centerZ=(minZ+maxZ)/2,top=Math.max(...route.map(p=>p.point.y));
  const floor=isNaturalMap(track)?.12:options.lift?.055:.15;
  const natural=isNaturalMap(track),height=natural?Math.max(8.2,top+span/5.5):6.2;
  const shore=natural?edgeMounts.tracks[track as keyof typeof edgeMounts.tracks]:undefined;
  return [-1,1].flatMap((side,row)=>[.08,.36,.64,.92].map((fraction,column)=>{
    const edge=shore?.fixtures[row*4+column];
    const classic=track==='mild'||track==='twisty-twirl';
    // Local shifts preserve the gaps between seats, devices and overview labels.
    const offsetX=natural
      ?track==='boardwalks'&&row===0&&column===2?-.1:track==='squiggle'&&row===1&&column===3?-.25:track==='bridges'&&row===1?(column===2?-1:column===3?.25:0):0
      :row===0?(column===2?.995:column===3?.085:0):track==='wild'&&column===1?-1:track==='whirly-world'&&column===2?-.7:classic&&column===1?-.2:0;
    const x=(edge?edge.x*options.scale:minX+span*fraction)+offsetX;
    const slope=edge?(edge.innerCorners[1]![2]!-edge.innerCorners[0]![2]!)/(edge.innerCorners[1]![0]!-edge.innerCorners[0]![0]!):0;
    const edgeOffset=track==='squiggle'&&row===0&&column===0?.4:0;
    const z=edge?edge.edgeZ*options.scale+slope*offsetX+side*(.9+edgeOffset):side<0?(column===3?-7.78:-7.7):classic?5.9:maxZ+2.5+(track==='wild'&&column===3?.80:0);
    const venuePlatform=!natural&&row===0;
    const nearest=route.reduce((a,b)=>Math.abs(b.point.x-x)<Math.abs(a.point.x-x)?b:a);
    const base=new Vector3(x,venuePlatform?.15:floor,z),head=new Vector3(x,height,z);
    const target=new Vector3(x,nearest.point.y,centerZ);
    const direction=target.clone().sub(head).normalize(),rotation=new Quaternion().setFromUnitVectors(new Vector3(0,0,-1),direction);
    const receiver=head.clone().add(new Vector3(0,.14,-.16).applyQuaternion(rotation));
    // Intersect the physical panel axis with the receiving deck plane.
    const axisDistance=(receiver.y-target.y)/(-direction.y);
    target.copy(receiver).addScaledVector(direction,axisDistance);
    const active=options.lowQuality?(row+column)%2===0:column!==(row===0?2:1);
    const bottom=natural?-.56:classic?-.92:-.84,plinth=base.clone();plinth.y=(base.y+bottom)/2;
    // Short fixed outrigger: its inner four vertices follow the measured shore.
    // A 15 mm bonded end is the only permitted overlap with the real base.
    const innerCorners=edge?[0,1,2,3].map(i=>{const a=edge.innerCorners[i<2?0:2]!,b=edge.innerCorners[i<2?1:3]!,dx=i%2?.15:-.15,t=((x+dx)/options.scale-a[0]!)/(b[0]!-a[0]!);return [x+dx,a[1]!,((a[2]!+(b[2]!-a[2]!)*t)+side*.015/shore!.referenceScale)*options.scale-side*.015];}):row===1?[-1,1,-1,1].map((sign,i)=>[x+sign*.15,classic?(i<2?-.66:-.58):(i<2?-.73:-.53),classic?5.25827938338963:4.93]):undefined;
    const connector=innerCorners?{innerCorners,outerZ:z-side*.45}:undefined;
    return {id:`${track}:light:${row*4+column}`,node:nearest.node,targetNode:nearest.node,row,column,base,head,target,direction,rotation,receiver,height:head.y-base.y,plinth,plinthSize:[1.0,base.y-bottom,1.0],venuePlatform,connector,active};
  }));
}
/** Three r186 decay=2 attenuation, including its finite cutoff. */
export function spotDistanceAttenuation(r:number,cutoff:number){return Math.pow(Math.max(0,1-Math.pow(r/cutoff,4)),2)/Math.max(r*r,.01);}
export function venueSpotPhotometry(position:Vector3,target:Vector3,lowQuality=false){
  const axis=target.clone().sub(position).normalize(),cosine=Math.max(.05,-axis.y),receivingDistance=position.distanceTo(target),distance=receivingDistance*2.4,targetLux=lowQuality?2.1:1.4;
  return {intensity:targetLux/(spotDistanceAttenuation(receivingDistance,distance)*cosine),distance,angle:1.18,penumbra:.48,decay:2,targetLux,receivingDistance,cosine,position:position.toArray(),target:target.toArray()};
}
/** Linear receiver calibration, not copying Three candela into Cycles watts.
 * Both engines' directional reference is compared on the same unit receiver.
 * Three cutoff is compensated only at that audited receiver; cone falloff differs. */
export function blenderSpotWatts(spot:ReturnType<typeof venueSpotPhotometry>){return spot.intensity*4*Math.PI*Math.pow(Math.max(0,1-Math.pow(spot.receivingDistance/spot.distance,4)),2);}
export function buildFloodlightGeometry(track:TrackId,models:EnvironmentModels,options:EnvironmentOptions){
  for(const asset of FLOODLIGHT_ASSETS){if(!models[asset])throw Error(`Missing floodlight ${asset}`);models[asset]!.traverse(node=>{if(asset==='lenses'&&node instanceof Mesh&&!(node.material instanceof MeshStandardMaterial))throw Error('Lens material must be standard');});}
  const root=new Group();root.name=`rebuilt-floodlights:${track}`;const layout=floodlightLayout(track,options),owned:MeshStandardMaterial[]=[],ownedGeometry:BufferGeometry[]=[],batches:InstancedMesh[]=[],lenses:{material:MeshStandardMaterial;active:boolean}[]=[];
  const dummy=new Object3D(),geometry=new BoxGeometry(1,1,1),stone=new MeshStandardMaterial({color:'#526b64',roughness:.9});owned.push(stone);
  const supported=layout.filter(l=>!l.venuePlatform);
  const foundation=new InstancedMesh(geometry,stone,supported.length);foundation.name='floodlight-fixed-foundations';foundation.userData.environmentRole='light-foundation';foundation.receiveShadow=true;foundation.castShadow=!options.lowQuality;foundation.raycast=()=>{};
  supported.forEach((lamp,i)=>{dummy.position.copy(lamp.plinth);dummy.quaternion.identity();dummy.scale.fromArray(lamp.plinthSize);dummy.updateMatrix();foundation.setMatrixAt(i,dummy.matrix);});foundation.userData.fixtureIndices=supported.map(l=>l.row*4+l.column);root.add(foundation);batches.push(foundation);
  for(const lamp of layout){if(!lamp.connector)continue;const {innerCorners,outerZ}=lamp.connector,vertices=[...innerCorners,...innerCorners.map(([x,y])=>[x!,y!,outerZ])];const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices.flat(),3));const faces=[0,1,3,0,3,2,4,6,7,4,7,5,0,4,5,0,5,1,2,3,7,2,7,6,0,2,6,0,6,4,1,5,7,1,7,3];if(lamp.row===1)for(let i=0;i<faces.length;i+=3)[faces[i+1],faces[i+2]]=[faces[i+2]!,faces[i+1]!];g.setIndex(faces);g.computeVertexNormals();ownedGeometry.push(g);const beam=new Mesh(g,stone);beam.name=`floodlight-outrigger:${lamp.row*4+lamp.column}`;beam.userData.environmentRole='light-foundation';beam.castShadow=!options.lowQuality;beam.receiveShadow=true;beam.raycast=()=>{};root.add(beam);}
  for(const asset of FLOODLIGHT_ASSETS){const source=models[asset];if(!source)throw Error(`Missing floodlight ${asset}`);source.updateMatrixWorld(true);source.traverse(node=>{
    if(!(node instanceof Mesh))return;
    const groups=[{lamps:layout.map((lamp,i)=>({lamp,i})),active:asset==='lenses'}];
    for(const group of groups){let material=node.material;if(asset==='lenses'){
      if(!(material instanceof MeshStandardMaterial))throw Error('Lens material must be standard');material=material.clone();material.emissive.set('#ffdca0');material.emissiveIntensity=0;owned.push(material);lenses.push({material,active:true});
    }
    const mesh=new InstancedMesh(node.geometry,material,group.lamps.length);mesh.name=`floodlight:${asset}:${node.name}:${group.lamps[0]!.i}`;mesh.userData.environmentRole='light-hardware';mesh.raycast=()=>{};mesh.castShadow=!options.lowQuality&&asset!=='lenses';mesh.receiveShadow=true;
    group.lamps.forEach(({lamp},i)=>{dummy.position.copy(asset==='base'?lamp.base:asset==='pole'?lamp.base.clone().add(new Vector3(0,.16,0)):lamp.head);dummy.quaternion.copy(asset==='base'||asset==='pole'?new Quaternion():lamp.rotation);dummy.scale.set(1,asset==='pole'?lamp.height-.16:1,1);dummy.updateMatrix();mesh.setMatrixAt(i,new Matrix4().multiplyMatrices(dummy.matrix,node.matrixWorld));});mesh.computeBoundingSphere();root.add(mesh);batches.push(mesh);
    }
  });}
  root.updateMatrixWorld(true);let disposed=false;
  return {root,layout,lenses,setNightFactor(value:number){const factor=Math.max(0,Math.min(1,value));for(const lens of lenses)lens.material.emissiveIntensity=2.4*factor;},dispose(){if(disposed)return;disposed=true;batches.forEach(m=>m.dispose());geometry.dispose();ownedGeometry.forEach(g=>g.dispose());owned.forEach(m=>m.dispose());}};
}
