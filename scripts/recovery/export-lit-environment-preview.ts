/** Exact runtime environment/deck/pad/light geometry; offline visual evidence, not WebGL. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {Group,InstancedMesh,Matrix4,Mesh,MeshStandardMaterial,OrthographicCamera,Vector3} from 'three';
import {environmentAssets,environmentUrl} from '../../src/client/scene/environment/layout.js';
import {buildEnvironmentGeometry,setEnvironmentTreeVisibility,type EnvironmentModels} from '../../src/client/scene/environment/runtime.js';
import {environmentTreeVisibility} from '../../src/client/scene/environment/visibility.js';
import {buildFloodlightGeometry,FLOODLIGHT_ASSETS,floodlightUrl,venueSpotPhotometry,blenderSpotWatts} from '../../src/client/scene/environment/floodlights.js';
import {createVenueLightingState,stepVenueLighting} from '../../src/client/scene/environment/venue-lighting-state.js';
import {mechanismLayout} from '../../src/client/scene/mechanisms/layout.js';
import {createRebuiltDeckStructureKit} from '../../src/client/scene/environment/RebuiltMechanismCourse.js';
import {rebuiltSceneryGeometry,palette} from '../../src/client/scene/environment/RebuiltScenery.js';
import {mechanismPlacements} from '../../src/client/scene/mechanisms/placements.js';
import {boardPoint,trackNodeIds} from '../../src/client/scene/math.js';
import {cameraFrame,cameraView} from '../../src/client/scene/camera.js';
import {SKY_SOURCE_DIRECTIONS} from '../../src/client/scene/sky-environment.mjs';
import type {TrackId} from '../../src/shared/tracks.js';
const output=process.argv[2]??'../lights-rebuilt-v3/runtime-preview';mkdirSync(output,{recursive:true});
Object.assign(globalThis,{window:{location:{search:'?environment=1&mechanisms=1'}},FileReader:class{result:any;onloadend:any;readAsArrayBuffer(b:Blob){b.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});}readAsDataURL(b:Blob){b.arrayBuffer().then(v=>{this.result=`data:${b.type};base64,${Buffer.from(v).toString('base64')}`;this.onloadend?.();});}}});
const models:EnvironmentModels={},lightModels:EnvironmentModels={},load=async(path:string)=>{const b=readFileSync(path);return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const pad=(await load('public/models/mechanisms/approved_soft_track_tile.glb')).scene;
for(const asset of FLOODLIGHT_ASSETS)lightModels[asset]=(await load(`public${floodlightUrl(asset)}`)).scene;
const files=[];
for(const [track,width,height,compact] of [['wild',1280,900,false],['boardwalks',390,844,true]] as [TrackId,number,number,boolean][]){
 for(const asset of environmentAssets(track))if(!models[asset])models[asset]=(await load(`public${environmentUrl(asset)}`)).scene;
 const options={...mechanismLayout(track),lowQuality:false},kit=buildEnvironmentGeometry(track,models,options),deck=createRebuiltDeckStructureKit(track,false),lights=buildFloodlightGeometry(track,lightModels,options);
 const course=new Group();for(const mesh of [deck.pads,deck.roads,deck.supports,deck.trimmedSupports])course.add(mesh);
 if(track==='wild')for(const p of rebuiltSceneryGeometry(track,false,'ground'))course.add(new Mesh(p.geometry,new MeshStandardMaterial({color:palette[p.paint],roughness:.8})));
 const yaw=new Map(mechanismPlacements(track).map(p=>[p.anchor.node,p.deckYaw]));
 for(const node of trackNodeIds(track)){const group=pad.clone(true);group.position.fromArray(boardPoint(node,false,track));group.rotation.y=yaw.get(node)??0;group.name=`runtime-pad-${node}`;course.add(group);}
 const frame=cameraFrame([7],compact,width,height,true,undefined,false,track),view=cameraView(compact),camera=new OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,2000);camera.zoom=frame.zoom;camera.position.set(frame.x+view.offset[0]*5,frame.y+view.offset[1]*5,frame.z+view.offset[2]*5);camera.lookAt(frame.x,frame.y,frame.z);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 const hidden=environmentTreeVisibility(track,options,compact)(camera,kit.trees);setEnvironmentTreeVisibility(kit,hidden);
 const root=new Group();
 const flatten=(group:Group)=>{group.updateMatrixWorld(true);group.traverse(node=>{if(!(node instanceof Mesh))return;const indices=node instanceof InstancedMesh?Array.from({length:node.count},(_,i)=>i):[-1];for(const i of indices){const mesh=new Mesh(node.geometry,node.material);mesh.name=node.name;mesh.castShadow=node.castShadow;mesh.receiveShadow=node.receiveShadow;const instance=new Matrix4();if(node instanceof InstancedMesh)node.getMatrixAt(i,instance);mesh.matrixAutoUpdate=false;mesh.matrix.multiplyMatrices(node.matrixWorld,instance);root.add(mesh);}});};
 flatten(kit.root);flatten(course);lights.setNightFactor(1);flatten(lights.root);root.updateMatrixWorld(true);
 const file=`${track}-${width}x${height}.glb`,bytes=Buffer.from(await new GLTFExporter().parseAsync(root,{binary:true}) as ArrayBuffer);writeFileSync(`${output}/${file}`,bytes);
 const state=createVenueLightingState('night');let lighting=stepVenueLighting(state,'night',true,1);for(let i=0;i<30;i++)lighting=stepVenueLighting(state,'night',true,1);
 const checks=[[frame.x,frame.y,frame.z],boardPoint(0,compact,track),boardPoint(30,compact,track)].map(world=>({world,ndc:new Vector3(...world as [number,number,number]).project(camera).toArray()}));
 files.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),track,width,height,compact,frame,view,projectionChecks:checks,hiddenTrees:[...hidden],lighting:{...lighting,key:lighting.key.toArray(),fill:lighting.fill.toArray(),skyColor:lighting.skyColor.toArray(),ground:lighting.ground.toArray()},mainDirection:SKY_SOURCE_DIRECTIONS.athlete.night,lights:lights.layout.filter(l=>l.active).map(l=>{const photo=venueSpotPhotometry(l.receiver,l.target);return{...photo,id:l.id,base:l.base.toArray(),head:l.head.toArray(),blenderWatts:blenderSpotWatts(photo)};})});kit.dispose();lights.dispose();
}
writeFileSync(`${output}/runtime-layout.json`,JSON.stringify({scope:'Offline exact runtime geometry and framing; no actors, rigs, number textures or HUD. Cycles light response/tone mapping differs from Three; receiver energy is calibrated, not a WebGL acceptance.',files},null,2));console.log(output);
