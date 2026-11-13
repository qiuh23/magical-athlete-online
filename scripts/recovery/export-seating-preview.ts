/** Exact runtime environment/deck/pad/light geometry; offline visual evidence, not WebGL. */
import {createRequire}from'node:module';
const {createCanvas,ImageData}=createRequire(import.meta.url)('@napi-rs/canvas');
import {createStadiumTurfTextures}from'../../src/client/scene/environment/stadium-turf.js';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {Group,InstancedMesh,Matrix4,Mesh,MeshStandardMaterial,OrthographicCamera,Vector3,Shape,ExtrudeGeometry,BoxGeometry} from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {instantiateStadiumModel,stadiumTileAsset} from '../../src/client/scene/stadium/models.js';
import {BOARD_CENTER_SPAN,TILE} from '../../src/client/scene/math.js';
import {environmentAssets,environmentUrl,isNaturalMap} from '../../src/client/scene/environment/layout.js';
import {buildEnvironmentGeometry,setEnvironmentTreeVisibility,type EnvironmentModels} from '../../src/client/scene/environment/runtime.js';
import {environmentTreeVisibility} from '../../src/client/scene/environment/visibility.js';
const {buildFloodlightGeometry,FLOODLIGHT_ASSETS,floodlightUrl,venueSpotPhotometry,blenderSpotWatts}=await import(process.env.LIGHTING_MODULE??'../../src/client/scene/environment/floodlights.js');
import {createVenueLightingState,stepVenueLighting} from '../../src/client/scene/environment/venue-lighting-state.js';
import {mechanismLayout} from '../../src/client/scene/mechanisms/layout.js';
import {createRebuiltDeckStructureKit} from '../../src/client/scene/environment/RebuiltMechanismCourse.js';
import {rebuiltSceneryGeometry,palette} from '../../src/client/scene/environment/RebuiltScenery.js';
import {mechanismPlacements} from '../../src/client/scene/mechanisms/placements.js';
import {boardPoint,trackNodeIds} from '../../src/client/scene/math.js';
import {cameraFrame,cameraView} from '../../src/client/scene/camera.js';
import {SKY_SOURCE_DIRECTIONS} from '../../src/client/scene/sky-environment.mjs';
import type {TrackId} from '../../src/shared/tracks.js';
const output=process.argv[2]??'../stadium-lighting-preview-20261113';mkdirSync(output,{recursive:true});
Object.assign(globalThis,{ImageData,HTMLCanvasElement:createCanvas(1,1).constructor,document:{createElement:()=>{const c=createCanvas(1,1);Object.assign(c,{data:undefined,toBlob:(cb:any,mime:string)=>cb(new Blob([c.toBuffer('image/png')],{type:mime}))});return c;}},window:{location:{search:'?environment=1&mechanisms=1'}},FileReader:class{result:any;onloadend:any;readAsArrayBuffer(b:Blob){b.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});}readAsDataURL(b:Blob){b.arrayBuffer().then(v=>{this.result=`data:${b.type};base64,${Buffer.from(v).toString('base64')}`;this.onloadend?.();});}}});
const comparison=process.argv[3],runtime=comparison?await import(pathToFileURL(resolve(comparison,'src/client/scene/environment/runtime.ts')).href):{buildEnvironmentGeometry},layoutSource=comparison?await import(pathToFileURL(resolve(comparison,'src/client/scene/environment/layout.ts')).href):{environmentAssets};
const models:EnvironmentModels={},lightModels:EnvironmentModels={},load=async(path:string)=>{const b=readFileSync(path);return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const pad=(await load('public/models/mechanisms/approved_soft_track_tile.glb')).scene;
for(const asset of FLOODLIGHT_ASSETS)lightModels[asset]=(await load(`public${floodlightUrl(asset)}`)).scene;
const files=[];
for(const [track,width,height,compact] of [['mild',390,844,true],['mild',1280,900,false],['whirly-world',1280,900,false],['squiggle',1280,900,false]] as [TrackId,number,number,boolean][]){
 if(process.env.PREVIEW_SPECS&&!process.env.PREVIEW_SPECS.split(',').includes(`${track}-${width}x${height}`))continue;
 for(const asset of layoutSource.environmentAssets(track))if(!models[asset])models[asset]=(await load(`public${environmentUrl(asset)}`)).scene;
 const options={...mechanismLayout(track),lowQuality:false},kit=runtime.buildEnvironmentGeometry(track,models,options),deck=createRebuiltDeckStructureKit(track,false),lights=buildFloodlightGeometry(track,lightModels,options);
 const course=new Group();if(track!=='mild')for(const mesh of [deck.pads,deck.roads,deck.supports,deck.trimmedSupports])course.add(mesh);
 if(track!=='mild'&&!isNaturalMap(track))for(const p of rebuiltSceneryGeometry(track,false,'ground'))course.add(new Mesh(p.geometry,new MeshStandardMaterial({color:palette[p.paint],roughness:.8})));
 const yaw=new Map(mechanismPlacements(track).map(p=>[p.anchor.node,p.deckYaw]));
 for(const node of track==='mild'?[]:trackNodeIds(track)){const group=pad.clone(true);group.position.fromArray(boardPoint(node,false,track));group.rotation.y=yaw.get(node)??0;group.name=`runtime-pad-${node}`;course.add(group);}
 if(track==='mild'){
  // Same measured runtime source meshes, transforms, dimensions and course path.
  // Canvas ink/grain/lawn stamps are intentionally omitted, not painted screenshots.
  const W=BOARD_CENTER_SPAN.width+TILE*1.95,D=BOARD_CENTER_SPAN.depth+TILE*2.05;
  const add=(geometry:any,color:string,y:number,roughness=.65)=>{const mesh=new Mesh(geometry,new MeshStandardMaterial({color,roughness}));mesh.position.y=y;course.add(mesh);};
  add(new RoundedBoxGeometry(W+.2,.6,D+.2,5,.29),'#f7e7c9',-.62,.56);
  add(new RoundedBoxGeometry(W+.23,.11,D+.23,4,.05),'#438674',-.265,.66);
  add(new RoundedBoxGeometry(W,.3,D,5,.145),'#f3e3c4',-.07);
  const turf=createStadiumTurfTextures();
  // GLTFExporter normal-channel conversion expects an image-like canvas. Copy
  // the exact runtime bytes, without repainting or changing their convention.
  const normalCanvas=createCanvas(turf.normal.image.width,turf.normal.image.height);normalCanvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(turf.normal.image.data),turf.normal.image.width,turf.normal.image.height),0,0);turf.normal.image=normalCanvas;
  const grass=new Mesh(new RoundedBoxGeometry(1,1,1,2,.1).scale(W-.55,.08,D-.55),new MeshStandardMaterial({color:'#fffdf0',map:turf.color,normalMap:turf.normal,roughness:.96}));grass.material.normalScale.set(.45,.45);grass.position.y=.11;grass.name='runtime-mild-turf-with-shared-textures';course.add(grass);
  const source=readFileSync('src/client/scene/DioramaStadium.tsx','utf8');
  const body=source.slice(source.indexOf('function courseGeometry() {')+'function courseGeometry() {'.length,source.indexOf('\nfunction useKit'));
  const geometry=new Function('THREE',body.slice(0,body.lastIndexOf('}')))({Shape,ExtrudeGeometry});
  add(geometry,'#438674',.19,.66);
  const tileModels=new Map();
  for(const node of trackNodeIds(track)){const name=stadiumTileAsset(node,track);if(!tileModels.has(name))tileModels.set(name,(await load(`public/models/stadium-v7/${name}.glb`)).scene);const {object}=instantiateStadiumModel(tileModels.get(name),node===0?'#438674':node===30?'#ee785e':undefined);const p=boardPoint(node,false,track);object.position.set(p[0]-(node===0?TILE*1.5:0),p[1]-.195,p[2]);course.add(object);}
 }
 const frame=cameraFrame([7],compact,width,height,true,undefined,false,track),view=cameraView(compact),camera=new OrthographicCamera(-width/2,width/2,height/2,-height/2,.1,2000);camera.zoom=frame.zoom;camera.position.set(frame.x+view.offset[0]*5,frame.y+view.offset[1]*5,frame.z+view.offset[2]*5);camera.lookAt(frame.x,frame.y,frame.z);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
 const hidden=environmentTreeVisibility(track,options,compact)(camera,kit.trees);setEnvironmentTreeVisibility(kit,hidden);
 const root=new Group();
 const flatten=(group:Group)=>{group.updateMatrixWorld(true);group.traverse(node=>{if(!(node instanceof Mesh))return;const indices=node instanceof InstancedMesh?Array.from({length:node.count},(_,i)=>i):[-1];for(const i of indices){const mesh=new Mesh(node.geometry,node.material);mesh.name=node.name;mesh.castShadow=node.castShadow;mesh.receiveShadow=node.receiveShadow;const instance=new Matrix4();if(node instanceof InstancedMesh)node.getMatrixAt(i,instance);mesh.matrixAutoUpdate=false;mesh.matrix.multiplyMatrices(node.matrixWorld,instance);root.add(mesh);}});};
 flatten(kit.root);flatten(course);lights.setNightFactor(process.env.PREVIEW_NIGHT?1:0);flatten(lights.root);root.updateMatrixWorld(true);
 const file=`${track}-${width}x${height}.glb`,bytes=Buffer.from(await new GLTFExporter().parseAsync(root,{binary:true}) as ArrayBuffer);writeFileSync(`${output}/${file}`,bytes);
 const state=createVenueLightingState('night');let lighting=stepVenueLighting(state,'night',true,1);for(let i=0;i<30;i++)lighting=stepVenueLighting(state,'night',true,1);
 const checks=[[frame.x,frame.y,frame.z],boardPoint(0,compact,track),boardPoint(30,compact,track)].map(world=>({world,ndc:new Vector3(...world as [number,number,number]).project(camera).toArray()}));
 files.push({nodes:trackNodeIds(track).map(node=>({node,position:boardPoint(node,false,track)})),file,sha256:createHash('sha256').update(bytes).digest('hex'),track,width,height,compact,frame,view,projectionChecks:checks,hiddenTrees:[...hidden],lighting:{...lighting,key:lighting.key.toArray(),fill:lighting.fill.toArray(),skyColor:lighting.skyColor.toArray(),ground:lighting.ground.toArray()},mainDirection:SKY_SOURCE_DIRECTIONS.athlete.night,lights:lights.layout.filter(l=>l.active).map((l,index)=>{const photo=venueSpotPhotometry(l.receiver,l.target);return{...photo,castShadow:index===0,id:l.id,base:l.base.toArray(),head:l.head.toArray(),blenderWatts:blenderSpotWatts(photo)};})});kit.dispose();lights.dispose();
}
writeFileSync(`${output}/runtime-layout.json`,JSON.stringify({lightingSourceSha256:createHash('sha256').update(readFileSync(process.env.LIGHTING_MODULE??'src/client/scene/environment/floodlights.ts')).digest('hex'),comparison:comparison?'Combined current lighting with candidate seating environment':'Current checkout environment',scope:'Offline actual runtime fixture/environment/tile meshes and framing. Mild base dimensions/course shape match DioramaStadium; new Mild grass color/normal pixels included identically; legacy canvas tile grain/number textures, actors, rigs and HUD omitted. Cycles light response/tone mapping differs from Three; receiver energy is calibrated, not a WebGL acceptance.',files},null,2));console.log(output);
