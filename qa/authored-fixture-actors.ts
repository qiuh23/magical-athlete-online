/** Authored bind geometry only. Matches Pawn's root and ToyCharacter hierarchy;
 * mounted-runtime verification is separate. Never a replacement for final pixels. */
import {readFileSync} from 'node:fs';
import {Box3,Group,Mesh,Object3D,Vector3} from 'three';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {rigidShapeEnvelopes} from '../src/client/scene/mechanisms/rigid-shape-envelopes.js';
import {cloneToyModel} from '../src/client/scene/toy-model-instance.js';
import {toyResources} from '../src/client/scene/pawn-materials.js';
import {MOTION_ACTORS} from './motion-fixtures.js';
import {SECOND_WIND_CHARACTERS} from '../src/shared/second-wind.js';
const cache=new Map<string,Awaited<ReturnType<GLTFLoader['parseAsync']>>>();
export async function fixtureAsset(file:string){let g=cache.get(file);if(!g){const b=readFileSync('public'+file);g=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');cache.set(file,g);}return g;}
export function fixtureMeshBounds(root:Object3D){root.updateMatrixWorld(true);const result:{name:string;box:Box3}[]=[];root.traverse(n=>{if(!(n instanceof Mesh))return;for(let p:Object3D|null=n;p;p=p.parent)if(!p.visible)return;const box=new Box3(),positions=n.geometry.getAttribute('position'),v=new Vector3();for(let i=0;i<positions.count;i++)box.expandByPoint(n.getVertexPosition(i,v).applyMatrix4(n.matrixWorld));result.push({name:n.name||n.geometry.type,box});});return result;}
export function boxDistance(a:Box3,b:Box3){return Math.hypot(Math.max(0,a.min.x-b.max.x,b.min.x-a.max.x),Math.max(0,a.min.y-b.max.y,b.min.y-a.max.y),Math.max(0,a.min.z-b.max.z,b.min.z-a.max.z));}
const roleGroups=new Map<string,Group>();
export async function fixtureActor(label:string,low=false){const key=label+low;if(roleGroups.has(key))return roleGroups.get(key)!.clone(true);const actor=MOTION_ACTORS.find(a=>a.label===label)!;const root=new Group(),base=toyResources.baseGeometry(low);root.add(new Mesh(base.body),new Mesh(base.cap));const modelId=label==='bite-mark-were'?label:actor.id;
 const file=actor.id==='banana'?`/models/banana/${low?'banana-economy':'banana'}.glb`:SECOND_WIND_CHARACTERS.some(c=>c.id===actor.id)?`/models/second-wind/${modelId}.glb`:low?'/models/toy-racers-economy.glb':'/models/toy-racers.glb';
 const g=await fixtureAsset(file),sculpture=cloneToyModel(g.scene.getObjectByName(`toy_${modelId}`)!,false),holder=new Group();holder.position.set(0,.164+('mount'in actor?.34:0),'mount'in actor?-.07:0);holder.scale.setScalar('mount'in actor?.7:1);holder.add(sculpture);root.add(holder);
 if('mount'in actor){const g=await fixtureAsset('/models/second-wind/hog-knight-hog.glb'),hog=cloneToyModel(g.scene.getObjectByName('toy_hog-knight-hog')!,false);hog.position.y+=.164;root.add(hog);}roleGroups.set(key,root);return root.clone(true);}

/** Admission input only; exact triangle geometry remains independent in QA. */
export function fixturePlanningParts(root:Object3D){root.updateMatrixWorld(true);const result:{name:string;box:Box3}[]=[];root.traverse(n=>{if(!(n instanceof Mesh))return;for(let p:Object3D|null=n;p;p=p.parent)if(!p.visible)return;for(const box of rigidShapeEnvelopes(n.geometry))result.push({name:n.name,box:box.clone().applyMatrix4(n.matrixWorld)});});return result;}
