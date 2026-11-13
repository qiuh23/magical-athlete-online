import {BufferGeometry,Float32BufferAttribute,Group,InstancedMesh,Matrix4,Mesh,MeshBasicMaterial,MeshStandardMaterial,Object3D,PlaneGeometry,BoxGeometry,Color,Vector3,TorusGeometry} from 'three';
import type {TrackId,TrackSpace} from '../../../shared/tracks.js';
import {TRACKS} from '../../../shared/tracks.js';
import {nextTrackNodes} from '../../../shared/track-topology.js';
import {boardPoint,trackNodeIds} from '../math.js';
const themes={normal:['#53716d','#b5c9bb'],punch:['#ead7b5','#df805e'],back:['#e1cee3','#a16da8'],trip:['#e6c9ab','#d75d4c'],gain:['#eee2b7','#d9a431'],loss:['#d9c4d7','#92557f'],warp:['#c0ded7','#359e9a']} as const;
const pairColors=['#329bc2','#aa77b9','#dc8c54','#62a15e','#c97498','#718aca'];
export function tileTheme(s?:TrackSpace,node=0){const key=!s?'normal':s.kind==='arrow'?(s.move??1)<0?'back':'punch':s.kind==='star'?(s.points??1)<0?'loss':'gain':s.kind;return{key,face:themes[key][0],rim:s?.kind==='warp'?pairColors[[3,7,10,18,20,24].indexOf(Math.min(node,s.to??node))]??themes.warp[1]:themes[key][1]};}
export function tileCaption(s?:TrackSpace){return !s?'':s.kind==='arrow'?`${(s.move??1)>0?'+':''}${s.move??1}`:s.kind==='star'?`${(s.points??1)>0?'+':''}${s.points??1}`:s.kind==='warp'?`↔ ${s.to}`:'!';}
/** Full running surface plus molded perimeter cues. Center remains flat/open
 * for eight seats. No old cropped symbol textures and no extra asset download. */
export function buildTileFinish(track:TrackId){
 const nodes=trackNodeIds(track),root=new Group(),plane=new PlaneGeometry(1.76,1.76),unit=new BoxGeometry(1,1,1),ring=new TorusGeometry(.77,.026,6,32),faceMaterial=new MeshStandardMaterial({roughness:.94,metalness:0}),rimMaterial=new MeshStandardMaterial({roughness:.5,metalness:.24}),faces=new InstancedMesh(plane,faceMaterial,nodes.length),rims=new InstancedMesh(unit,rimMaterial,nodes.length*4),accents=new InstancedMesh(unit,rimMaterial,nodes.length*12),portals=new InstancedMesh(ring,rimMaterial,nodes.length);
 const dummy=new Object3D(),color=new Color(),labels:{node:number;caption:string;p:number[]}[]=[];let accentCount=0,portalCount=0;
 const set=(mesh:InstancedMesh,index:number,p:number[],scale:number[],rotation:number[],hex:string)=>{dummy.position.fromArray(p);dummy.scale.fromArray(scale);dummy.rotation.set(...rotation as[number,number,number]);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.setColorAt(index,color.set(hex));};
 nodes.forEach((node,i)=>{const p=boardPoint(node,false,track),s=TRACKS[track].specials[node],theme=tileTheme(s,node);set(faces,i,[p[0],p[1]+.007,p[2]],[1,1,1],[-Math.PI/2,0,0],theme.face);
  for(let edge=0;edge<4;edge++){const angle=edge*Math.PI/2;set(rims,i*4+edge,[p[0]+Math.sin(angle)*.858,p[1]+.011,p[2]+Math.cos(angle)*.858],[1.72,.007,.047],[0,angle,0],theme.rim);}
  labels.push({node,caption:tileCaption(s),p});
  if(s?.kind==='arrow'){
   const next=nextTrackNodes(TRACKS[track],node,Math.sign(s.move??1))[0],q=boardPoint(next??node,false,track),yaw=Math.atan2(q[0]-p[0],q[2]-p[2]);
   // Twin molded chevron rails point along the first authoritative legal edge.
   // The event route supplies the chosen fork, not this at-rest indicator.
   for(const side of [-1,1])for(let step=0;step<3;step++)for(const wing of [-1,1]){const v=new Vector3(side*.69+wing*.06,0,(step-1)*.36-.02).applyAxisAngle(new Vector3(0,1,0),yaw);set(accents,accentCount++,[p[0]+v.x,p[1]+.014,p[2]+v.z],[.18,.009,.04],[0,yaw+wing*Math.PI/4,0],theme.rim);}
  }else if(s?.kind==='trip'){
   for(const side of [-1,1])for(let j=0;j<5;j++)set(accents,accentCount++,[p[0]+side*.73,p[1]+.014,p[2]+(j-2)*.28],[.13,.008,.12],[0,Math.PI/5,0],j%2?'#fff1c7':theme.rim);
  }else if(s?.kind==='warp')set(portals,portalCount++,[p[0],p[1]+.014,p[2]],[1,1,1],[-Math.PI/2,0,0],theme.rim);
 });
 accents.count=accentCount;portals.count=portalCount;faces.name='complete-running-surfaces';rims.name='continuous-tile-rims';accents.name='molded-direction-hazard-rails';portals.name='paired-portal-ring-rims';
 for(const mesh of [faces,rims,accents,portals]){mesh.receiveShadow=true;mesh.raycast=()=>{};mesh.computeBoundingSphere();root.add(mesh);}
 return{root,labels,dispose(){[faces,rims,accents,portals].forEach(m=>m.dispose());[plane,unit,ring].forEach(g=>g.dispose());faceMaterial.dispose();rimMaterial.dispose();}};
}
/** One atlas and one draw call for every number + concise result label. Text is
 * engraved into a consistent rim panel, not a replacement for the machine. */
export function buildTileLabels(labels:ReturnType<typeof buildTileFinish>['labels'],texture:import('three').Texture){
 const positions:number[]=[],uvs:number[]=[],indices:number[]=[];const columns=8,rows=Math.ceil(labels.length/columns);
 labels.forEach(({p},i)=>{const x=p[0],y=p[1]+.026,z=p[2]-.59,w=1.42,h=.32,u=(i%columns)/columns,v=1-Math.floor(i/columns)/rows;const n=positions.length/3;positions.push(x-w/2,y,z+h/2,x+w/2,y,z+h/2,x+w/2,y,z-h/2,x-w/2,y,z-h/2);uvs.push(u,v-1/rows,u+1/columns,v-1/rows,u+1/columns,v,u,v);indices.push(n,n+1,n+2,n,n+2,n+3);});
 const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 const material=new MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}),mesh=new Mesh(geometry,material);mesh.name='inlaid-cell-numbers-and-results';mesh.raycast=()=>{};return{mesh,dispose(){geometry.dispose();material.dispose();}};
}
