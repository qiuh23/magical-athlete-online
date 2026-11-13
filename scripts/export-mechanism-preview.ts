/** Export actual loaded GLBs and the runtime coordinate/camera functions for
 * offline geometry review. This is NOT a browser screenshot or FPS proof. */
import {readFileSync,writeFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {BoxGeometry,Group,Mesh,MeshStandardMaterial,Object3D,OrthographicCamera,Vector3} from 'three';
import {mechanismPlacements} from '../src/client/scene/mechanisms/placements.js';
import {MECHANISM_FILES,createMechanismInstance} from '../src/client/scene/mechanisms/models.js';
import {toyResources} from '../src/client/scene/pawn-materials.js';
import {cloneToyModel} from '../src/client/scene/toy-model-instance.js';
import {boardPoint,trackConnections,trackNodeIds} from '../src/client/scene/math.js';
import {sceneryGeometry,palette} from '../src/client/scene/ExpansionScenery.js';
import {STADIUM_PLACEMENTS,stadiumDecorPosition} from '../src/client/scene/stadium/models.js';
import {cameraFrame,cameraView,pawnOccupancy} from '../src/client/scene/camera.js';
import type {TrackId} from '../src/shared/tracks.js';
Object.assign(globalThis,{window:{location:{search:'?mechanisms=1'}}});
Object.assign(globalThis,{FileReader:class{result:any;onloadend:any;readAsArrayBuffer(blob:Blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}readAsDataURL(blob:Blob){blob.arrayBuffer().then(b=>{this.result=`data:${blob.type};base64,${Buffer.from(b).toString('base64')}`;this.onloadend?.();});}}});
const load=async(file:string)=>{const b=readFileSync(file);return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const sources=new Map();for(const [kind,file]of Object.entries(MECHANISM_FILES))sources.set(kind,await load('public/models/mechanisms/'+file));const tile=await load('public/models/mechanisms/approved_soft_track_tile.glb');
for(const track of ['wild','boardwalks'] as TrackId[]){
 const root=new Group();
 for(const part of sceneryGeometry(track,false))root.add(new Mesh(part.geometry,new MeshStandardMaterial({color:palette[part.paint],roughness:.8})));
 if(track==='wild'){const skipped=new Set(['athlete_rail_corner.glb','athlete_rail_straight.glb','athlete_pennant.glb','athlete_scoreboard.glb','athlete_bunting.glb']);for(const p of STADIUM_PLACEMENTS){if(skipped.has(p.asset))continue;const g=await load(`public/models/stadium-v7/${p.asset}`);g.scene.position.fromArray(stadiumDecorPosition(p,true));g.scene.rotation.y=p.rotationY;root.add(g.scene);}}
 const placements=mechanismPlacements(track),byNode=new Map(placements.map(p=>[p.anchor.node,p]));
 for(const id of trackNodeIds(track)){const g=tile.scene.clone(true);g.position.fromArray(boardPoint(id,false,track));g.rotation.y=byNode.get(id)?.deckYaw??0;root.add(g);}
 const material=new MeshStandardMaterial({color:'#263f4b',roughness:.8});
 for(const [a,b]of trackConnections(track)){const p=boardPoint(a,false,track),q=boardPoint(b,false,track),mesh=new Mesh(new BoxGeometry(2,.13,Math.hypot(q[0]-p[0],q[2]-p[2])),material);mesh.position.set((p[0]+q[0])/2,(p[1]+q[1])/2-.085,(p[2]+q[2])/2);mesh.rotation.y=Math.atan2(q[0]-p[0],q[2]-p[2]);root.add(mesh);}
 for(const p of placements){const source=sources.get(p.anchor.kind),instance=createMechanismInstance(source.scene,source.animations[0]);instance.sample(0);if(track==='wild'&&p.anchor.node===5)instance.fitWild5Foot();const holder=new Group();holder.position.fromArray(p.position);holder.rotation.y=p.yaw;holder.add(instance.object);root.add(holder);}
 const actorAsset=await load('public/models/banana/banana.glb'),actor=actorAsset.scene.getObjectByName('toy_banana')??actorAsset.scene.children[0];const displayed={id:'preview',playerId:'preview',characterId:'banana',position:7,tripped:false,finished:false,eliminated:false,flags:{}};const offset=pawnOccupancy(displayed,[displayed],7,false,track),actorRoot=new Group(),point=boardPoint(7,false,track);actorRoot.position.set(point[0]+offset.x,point[1]+.005,point[2]+offset.z);actorRoot.scale.setScalar(offset.scale);const sculpture=new Group();sculpture.position.y=.164;sculpture.add(cloneToyModel(actor!,false));actorRoot.add(sculpture);const base=toyResources.baseGeometry(false);actorRoot.add(new Mesh(base.body,new MeshStandardMaterial({color:'#e6bd69'})),new Mesh(base.cap,new MeshStandardMaterial({color:'#ffe1a6'})));root.add(actorRoot);
 const cameras=[];for(const [width,height,compact,overview]of [[1280,900,false,true],[390,844,true,true],[844,390,false,true],[390,844,true,false]]as const){const frame=cameraFrame([7],compact,width,height,overview,undefined,false,track);const view=cameraView(compact),camera=new OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,2000);camera.zoom=frame.zoom;camera.position.set(frame.x+view.offset[0]*5,frame.y+view.offset[1]*5,frame.z+view.offset[2]*5);camera.lookAt(frame.x,frame.y,frame.z);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);const points=[[frame.x,frame.y,frame.z],boardPoint(0,compact,track),boardPoint(trackNodeIds(track).at(-1)!,compact,track),[frame.x+1,frame.y,frame.z],[frame.x,frame.y+1,frame.z],[frame.x,frame.y,frame.z+1]].map(world=>({world,ndc:new Vector3(...world as [number,number,number]).project(camera).toArray()}));cameras.push({width,height,compact,overview,frame,view,projectionChecks:points});}
 const bytes=await new GLTFExporter().parseAsync(root,{binary:true});writeFileSync(`docs/qa/map-mechanisms/${track}-runtime-geometry.glb`,Buffer.from(bytes as ArrayBuffer));writeFileSync(`docs/qa/map-mechanisms/${track}-runtime-cameras.json`,JSON.stringify(cameras,null,2));
}
