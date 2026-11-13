/** Candidate-only partition of legacy scenery. Keep the frozen original unchanged. */
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TRACKS, type TrackId } from '../../../shared/tracks.js';
import { boardBounds, boardPoint, TILE, trackConnections, trackNodeIds } from '../math.js';
import { expansionOutline, expansionTileSize, sceneryPockets } from '../expansion-layout.js';

export const palette={cream:'#f2e3c5',dark:'#42786b',mint:'#87bdae',wood:'#c7a479',grass:'#99b96c',leaf:'#638848',coral:'#e99279',gold:'#edc56c',water:'#84b8bb',waterLight:'#b2d7cd',purple:'#aa91be'};
type Paint=keyof typeof palette;
function surfaceStamp(wood=false) {
 const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;ctx.fillStyle='#eee6d5';ctx.fillRect(0,0,128,128);
 let seed=194;for(let i=0;i<1800;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;const x=(seed>>>8)%128,y=(seed>>>16)%128;ctx.fillStyle=`rgba(67,75,45,${.02+(i%4)*.012})`;ctx.fillRect(x,y,wood?8:1,1)}
 if(!wood){ctx.fillStyle='rgba(255,255,220,.08)';for(let x=0;x<128;x+=32)ctx.fillRect(x,0,16,128)}
 if(wood){ctx.strokeStyle='rgba(96,65,34,.2)';ctx.lineWidth=1;for(let y=0;y<128;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y);ctx.stroke()}}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;
}
/** Merged static kit: repeat geometry/materials never become hundreds of draws. */
export function rebuiltSceneryGeometry(track:TrackId,low:boolean,mode:'all'|'ground'|'route'='all') {
 const buckets=new Map<Paint,THREE.BufferGeometry[]>();const box=new RoundedBoxGeometry(1,1,1,1,.07),sphere=new THREE.IcosahedronGeometry(1,1),cyl=new THREE.CylinderGeometry(1,1,1,12);
 const add=(paint:Paint,g:THREE.BufferGeometry,p:number[],s:number[],angle=0)=>{const copy=g.clone();copy.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle),new THREE.Vector3(...s)));if(copy.index){const flat=copy.toNonIndexed();copy.dispose();(buckets.get(paint)??buckets.set(paint,[]).get(paint)!).push(flat)}else(buckets.get(paint)??buckets.set(paint,[]).get(paint)!).push(copy)};
 const block=(paint:Paint,p:number[],s:number[],a=0)=>add(paint,box,p,s,a);
 const ball=(paint:Paint,p:number[],s:number[])=>add(paint,sphere,p,s);
 const disc=(paint:Paint,p:number[],s:number[])=>add(paint,cyl,p,s);
 const outline=(paint:Paint,margin:number,y:number,h:number)=>{const g=new THREE.ExtrudeGeometry(expansionOutline(track,margin),{depth:h,bevelEnabled:true,bevelSize:.07,bevelThickness:.05,bevelSegments:2,curveSegments:5});g.rotateX(-Math.PI/2);add(paint,g,[0,y,0],[1,1,1]);g.dispose()};
 if(mode!=='route'){outline('wood',1.8,-.84,.5);outline('dark',1.83,-.32,.09);outline('cream',1.72,-.2,.17);outline(track==='boardwalks'?'water':'grass',1.42,-.005,.06);}
 // Continuous rounded curbs unite node pads and every legal connection.
 if(mode!=='ground'){
 if(track!=='bridges'){
 for(const [a,b]of trackConnections(track)){const p=boardPoint(a,false,track),q=boardPoint(b,false,track),dx=q[0]-p[0],dz=q[2]-p[2],len=Math.hypot(dx,dz),angle=Math.atan2(dx,dz),w=Math.min(expansionTileSize(track,a),expansionTileSize(track,b));
 block('dark',[(p[0]+q[0])/2,.105,(p[2]+q[2])/2],[w+.13,.18,len],angle);
 block(track==='boardwalks'?'wood':'cream',[(p[0]+q[0])/2,.17,(p[2]+q[2])/2],[w-.06,.075,len],angle);
 }
 for(const id of trackNodeIds(track)){const p=boardPoint(id,false,track),w=expansionTileSize(track,id);block('dark',[p[0],.11,p[2]],[w+.15,.18,w+.15]);}
 }
 const start=boardPoint(0,false,track);block('dark',[start[0]-TILE*1.5,.08,start[2]],[TILE*3,.24,TILE*1.45]);block('mint',[start[0]-TILE*1.5,.18,start[2]],[TILE*3-.12,.06,TILE*1.4]);
 }
 if(mode==='all'){
 // Start/finish portals stand behind the tile, never across the walking line.
 for(const id of [0,30]){const p=boardPoint(id,false,track),x=p[0]-(id===0?TILE*1.5:0),z=p[2]-1.52,w=id===0?3.3:1.1;
 for(const side of [-1,1]){disc('cream',[x+side*w,.13,z],[.22,.22,.22]);disc(id===0?'mint':'coral',[x+side*w,1.07,z],[.065,1.85,.065]);ball('gold',[x+side*w,2.08,z],[.13,.13,.13]);}
 block(id===0?'dark':'coral',[x,1.9,z],[w*2+.2,.32,.15]);
 for(let i=0;i<Math.round(w*7);i++)block(i%2?'cream':'dark',[x-w+.15+i*.28,1.66,z],[.27,.12,.16]);
 }
 const pockets=sceneryPockets(track);
 pockets.forEach((p,i)=>{
 const venue=i<2&&p.r>1.3;disc(track==='boardwalks'?'cream':'dark',[p.x,.075,p.z],[p.r,.1,p.r*.78]);disc('grass',[p.x,.14,p.z],[p.r-.12,.05,p.r*.78-.1]);
 if(venue&&i===0){ // podium and cup, kept below pawn head height
 for(let k=0;k<3;k++){const h=k===1?.53:.3;block(k===1?'coral':'cream',[p.x+(k-1)*.62,.19+h/2,p.z],[.58,h,.72])}
 disc('gold',[p.x,.86,p.z],[.2,.25,.2]);disc('dark',[p.x,.71,p.z],[.12,.07,.12]);
 }else if(venue){ // small grandstand, not a wall
 block('dark',[p.x,.22,p.z],[p.r*1.5,.18,.9]);block('cream',[p.x,.4,p.z-.19],[p.r*1.4,.2,.55]);block('mint',[p.x,.57,p.z-.36],[p.r*1.4,.14,.2]);
 for(let j=0;j<(low?3:5);j++){const x=p.x+(j-(low?1:2))*.36;ball(j%2?'coral':'gold',[x,.66,p.z-.13],[.1,.14,.1]);ball('cream',[x,.84,p.z-.13],[.09,.09,.09])}
 }else{
 const flowers=track==='squiggle';for(let j=0;j<(low?2:5);j++){const a=j*2.4+i,x=p.x+Math.cos(a)*p.r*.45,z=p.z+Math.sin(a)*p.r*.38;ball('leaf',[x,.3,z],[.27,.25,.26]);if(flowers)ball(j%2?'coral':'gold',[x,.52,z],[.13,.09,.13]);}
 if(track==='boardwalks')for(let j=0;j<(low?2:4);j++)block('waterLight',[p.x+(j%2?-.5:.5)*p.r,.078,p.z+p.r*.8+.15+j*.12],[.45+(j%2)*.2,.008,.035]);
 }
 });
 // Sparse side markers are situated outside the node square and never at forks.
 if(!low&&track==='squiggle')for(const id of [3,10,18,24]){const p=boardPoint(id,false,track);disc('cream',[p[0]-1.25,.26,p[2]],[.055,.45,.055]);block('coral',[p[0]-1.09,.45,p[2]],[.32,.2,.04]);}
 }
 box.dispose();sphere.dispose();cyl.dispose();return [...buckets].map(([paint,parts])=>{const geometry=mergeGeometries(parts,false)!;parts.forEach(p=>p.dispose());return {paint,geometry}});
}
function CourseBanners({track}:{track:TrackId}) {
 const textures=useMemo(()=>[0,30].map(id=>{
 const c=document.createElement('canvas');c.width=id===0?1024:256;c.height=96;const ctx=c.getContext('2d')!;ctx.fillStyle='#fff8df';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 60px sans-serif';
 const title=track==='squiggle'?'GARDEN':track==='boardwalks'?'BOARDWALKS':track==='bridges'?'BRIDGES':TRACKS[track].name;ctx.fillText(id===0?`${title} · START`:'FINISH',c.width/2,48);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
 }),[track]);
 useEffect(()=>()=>textures.forEach(t=>t.dispose()),[textures]);
 return <>{[0,30].map((id,i)=>{const p=boardPoint(id,false,track);return <mesh key={id} position={[p[0]-(id===0?TILE*1.5:0),1.9,p[2]-1.435]}><planeGeometry args={[id===0?6.1:2,.27]}/><meshBasicMaterial map={textures[i]} transparent depthWrite={false} toneMapped={false}/></mesh>})}</>;
}
function Grounding({track}:{track:TrackId}) {
 const b=boardBounds(track),w=b.width+5,h=b.depth+5;
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d')!;ctx.filter='blur(6px)';ctx.fillStyle='rgba(62,52,32,.23)';ctx.beginPath();expansionOutline(track,1.85).getPoints(12).forEach((p,i)=>{const x=(p.x-b.x)/w*1024+512,y=(-p.y-b.z)/h*512+256;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fill();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t},[track]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <mesh rotation={[-Math.PI/2,0,0]} position={[b.x,-.92,b.z]}><planeGeometry args={[w,h]}/><meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false}/></mesh>;
}
export function RebuiltScenery({track,lowQuality,mode='all'}:{track:TrackId;lowQuality:boolean;mode?:'all'|'ground'|'route'}) {
 const kit=useMemo(()=>{const grain=surfaceStamp(),wood=surfaceStamp(true);const mats=Object.fromEntries(Object.entries(palette).map(([k,color])=>[k,new THREE.MeshStandardMaterial({color,roughness:k==='water'?.55:k==='grass'||k==='leaf'?.96:.72,map:k==='wood'?wood:k==='grass'?grain:null,bumpMap:lowQuality?null:grain,bumpScale:.012})])) as Record<string,THREE.Material>;return {parts:rebuiltSceneryGeometry(track,lowQuality,mode),mats,grain,wood}},[track,lowQuality,mode]);
 useEffect(()=>()=>{kit.parts.forEach(p=>p.geometry.dispose());Object.values(kit.mats).forEach(m=>m.dispose());kit.grain.dispose();kit.wood.dispose()},[kit]);
 return <group name={`expansion-scenery-${track}`}>{mode!=='route'&&<Grounding track={track}/>} {mode==='all'&&<CourseBanners track={track}/>}{kit.parts.map(({paint,geometry})=><mesh key={paint} name={`scenery-${paint}`} geometry={geometry} material={kit.mats[paint]} castShadow receiveShadow dispose={null}/>)}</group>;
}
