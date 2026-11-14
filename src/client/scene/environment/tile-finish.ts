import {BufferGeometry,Float32BufferAttribute,Group,InstancedMesh,Matrix4,Mesh,MeshBasicMaterial,MeshStandardMaterial,Object3D,PlaneGeometry,BoxGeometry,Color,Vector3,TorusGeometry,CanvasTexture,SRGBColorSpace} from 'three';
import type {TrackId,TrackSpace} from '../../../shared/tracks.js';
import {TRACKS} from '../../../shared/tracks.js';
import {nextTrackNodes} from '../../../shared/track-topology.js';
import {boardPoint,trackNodeIds} from '../math.js';
const themes={normal:['#dfcfad','#566d64'],punch:['#b5dbc5','#175d4b'],back:['#d7b9e5','#68398b'],trip:['#efb09b','#8c3329'],gain:['#f4da82','#725417'],loss:['#d3b8cd','#6e345c'],warp:['#c0ded7','#359e9a']} as const;
const pairColors=['#329bc2','#aa77b9','#dc8c54','#62a15e','#c97498','#718aca'];
export function tileTheme(s?:TrackSpace,node=0){const key=!s?'normal':s.kind==='arrow'?(s.move??1)<0?'back':'punch':s.kind==='star'?(s.points??1)<0?'loss':'gain':s.kind;return{key,face:themes[key][0],rim:s?.kind==='warp'?pairColors[[3,7,10,18,20,24].indexOf(Math.min(node,s.to??node))]??themes.warp[1]:themes[key][1]};}
export function tileCaption(s?:TrackSpace){return !s?'':s.kind==='arrow'?`${(s.move??1)>0?'+':''}${s.move??1}`:s.kind==='star'?`${(s.points??1)>0?'+':''}${s.points??1}`:s.kind==='warp'?`↔ ${s.to}`:'!';}
/** Full running surface plus molded perimeter cues. Center remains flat/open
 * for eight seats. No old cropped symbol textures and no extra asset download. */
export function buildTileFinish(track:TrackId){
 const nodes=trackNodeIds(track),root=new Group(),plane=new PlaneGeometry(1.76,1.76),unit=new BoxGeometry(1,1,1),ring=new TorusGeometry(.77,.026,6,32),faceMaterial=new MeshStandardMaterial({roughness:.94,metalness:0}),rimMaterial=new MeshStandardMaterial({roughness:.5,metalness:.24}),faces=new InstancedMesh(plane,faceMaterial,nodes.length),rims=new InstancedMesh(unit,rimMaterial,nodes.length*4),accents=new InstancedMesh(unit,rimMaterial,nodes.length*12),portals=new InstancedMesh(ring,rimMaterial,nodes.length);
 const dummy=new Object3D(),color=new Color(),labels:{node:number;caption:string;p:number[];special?:TrackSpace;angle:number}[]=[];let accentCount=0,portalCount=0;
 const set=(mesh:InstancedMesh,index:number,p:number[],scale:number[],rotation:number[],hex:string)=>{dummy.position.fromArray(p);dummy.scale.fromArray(scale);dummy.rotation.set(...rotation as[number,number,number]);dummy.updateMatrix();mesh.setMatrixAt(index,dummy.matrix);mesh.setColorAt(index,color.set(hex));};
 nodes.forEach((node,i)=>{const p=boardPoint(node,false,track),s=TRACKS[track].specials[node],theme=tileTheme(s,node);set(faces,i,[p[0],p[1]+.007,p[2]],[1,1,1],[-Math.PI/2,0,0],theme.face);
  for(let edge=0;edge<4;edge++){const angle=edge*Math.PI/2;set(rims,i*4+edge,[p[0]+Math.sin(angle)*.858,p[1]+.011,p[2]+Math.cos(angle)*.858],[1.72,.007,.047],[0,angle,0],theme.rim);}
  const nextNode=nextTrackNodes(TRACKS[track],node,Math.sign(s?.move??1))[0],nextPoint=boardPoint(nextNode??node,false,track);
  labels.push({node,caption:tileCaption(s),p,special:s,angle:Math.atan2(nextPoint[0]-p[0],-(nextPoint[2]-p[2]))});
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
 labels.forEach(({p},i)=>{const x=p[0],y=p[1]+.026,z=p[2],w=1.62,h=1.62,u=(i%columns)/columns,v=1-Math.floor(i/columns)/rows;const n=positions.length/3;positions.push(x-w/2,y,z+h/2,x+w/2,y,z+h/2,x+w/2,y,z-h/2,x-w/2,y,z-h/2);uvs.push(u,v-1/rows,u+1/columns,v-1/rows,u+1/columns,v,u,v);indices.push(n,n+1,n+2,n,n+2,n+3);});
 const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 const material=new MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}),mesh=new Mesh(geometry,material);mesh.name='inlaid-cell-numbers-and-results';mesh.raycast=()=>{};return{mesh,dispose(){geometry.dispose();material.dispose();}};
}

/** Signed effect labels plus a large, flat pictogram remain visible before any
 * event. This is printed court ink, not a raised obstacle or a new portal sign. */
export function tileEffectLabel(s?:TrackSpace){
 if(!s)return '';if(s.kind==='warp')return tileCaption(s);
 if(s.kind==='trip')return '绊倒';
 if(s.kind==='star')return `${(s.points??1)<0?'扣分':'得分'} ${tileCaption(s)}`;
 return `${(s.move??1)<0?'后退':'前进'} ${tileCaption(s)}`;
}
export function createTileLabelAtlas(labels:ReturnType<typeof buildTileFinish>['labels']){
 const columns=8,rows=Math.ceil(labels.length/columns),canvas=document.createElement('canvas');canvas.width=columns*256;canvas.height=rows*256;const c=canvas.getContext('2d')!;
 labels.forEach(({node,special,caption,angle},i)=>{
  c.save();c.translate((i%columns)*256,Math.floor(i/columns)*256);
  const ink='#253e36',paper='#fff8df';c.fillStyle=ink;c.beginPath();c.roundRect(3,3,250,43,7);c.fill();c.fillStyle=paper;c.font='bold 31px sans-serif';c.textAlign='left';c.textBaseline='middle';c.fillText(String(node).padStart(2,'0'),12,25);
  if(special?.kind==='warp'){c.textAlign='right';c.fillText(caption,243,25);c.restore();return;}
  if(special){
   c.save();c.translate(128,130);c.fillStyle=paper;c.strokeStyle=ink;c.lineWidth=7;c.lineJoin='round';
   if(special.kind==='arrow'){
    c.rotate(angle);c.beginPath();c.moveTo(0,-65);c.lineTo(60,-9);c.lineTo(24,-9);c.lineTo(24,59);c.lineTo(-24,59);c.lineTo(-24,-9);c.lineTo(-60,-9);c.closePath();c.fill();c.stroke();
   }else if(special.kind==='trip'){
    c.beginPath();c.moveTo(0,-63);c.lineTo(67,53);c.lineTo(-67,53);c.closePath();c.fill();c.stroke();c.fillStyle=ink;c.fillRect(-7,-27,14,42);c.beginPath();c.arc(0,34,8,0,Math.PI*2);c.fill();
   }else{
    c.beginPath();for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,r=j%2?31:66;j?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.stroke();
    c.fillStyle=ink;c.textAlign='center';c.font='bold 37px sans-serif';c.fillText(caption,0,3);
   }
   c.restore();c.fillStyle=ink;c.beginPath();c.roundRect(3,207,250,46,7);c.fill();c.fillStyle=paper;c.textAlign='center';c.font='bold 32px sans-serif';c.fillText(tileEffectLabel(special),128,231);
  }
  c.restore();
 });
 const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.anisotropy=4;return texture;
}
