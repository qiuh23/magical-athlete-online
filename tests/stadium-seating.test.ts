import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync}from'node:fs';
import {Box3,InstancedMesh,Matrix4,Mesh,Vector3}from'three';
import {GLTFLoader}from'three/addons/loaders/GLTFLoader.js';
import {TRACKS,type TrackId}from'../src/shared/tracks.js';
import {mechanismLayout}from'../src/client/scene/mechanisms/layout.js';
import {buildStadiumSeating,stadiumSeatingPlan}from'../src/client/scene/environment/seating.js';
import type {EnvironmentModels}from'../src/client/scene/environment/runtime.js';
const models:EnvironmentModels={};
async function load(){for(const name of ['bleachers','spectators','grandstand_rostrum'])if(!models[name]){const b=readFileSync(`public/models/environment-rebuilt-v2/${name}.glb`);models[name]=(await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;}return models;}
const tracks=Object.keys(TRACKS)as TrackId[];
test('seven seat plans keep the foreground open and make real shape-specific entrances',()=>{
 for(const track of tracks){const plan=stadiumSeatingPlan(track,{...mechanismLayout(track),lowQuality:false});assert.ok(plan.bays.length===2);assert.equal(plan.bays.filter(b=>b.yaw<-1).length,1);assert.ok(plan.bays.filter(b=>b.yaw>-1&&!b.infield).every(b=>b.z<0));assert.equal(new Set(plan.bays.map(b=>b.id)).size,plan.bays.length);}
 const options={scale:1,lift:1.43,lowQuality:false};assert.ok(stadiumSeatingPlan('wild',options).bays.at(-1)!.x>stadiumSeatingPlan('whirly-world',options).bays.at(-1)!.x);
 assert.equal(stadiumSeatingPlan('boardwalks',options).promenades.length,0);
});
test('seating shares original full-detail geometry and economy never removes seats, crowds or structure',async()=>{
 const sources=await load();for(const track of tracks){const options={...mechanismLayout(track),lowQuality:false},full=buildStadiumSeating(track,sources,options),economy=buildStadiumSeating(track,sources,{...options,lowQuality:true});
 assert.deepEqual(full.plan,economy.plan);assert.equal(full.root.children.length,economy.root.children.length);assert.ok(full.root.children.length<=19);
 full.root.children.forEach((node,i)=>{assert.ok(node instanceof Mesh);const low=economy.root.children[i]as Mesh;assert.equal(node.name,low.name);assert.deepEqual(node.geometry.getAttribute('position').array,low.geometry.getAttribute('position').array);if(node instanceof InstancedMesh){assert.ok(low instanceof InstancedMesh);assert.equal(node.count,full.plan.bays.length);assert.equal(node.count,low.count);assert.deepEqual(node.instanceMatrix.array,low.instanceMatrix.array);assert.ok(Object.values(sources).some(s=>s.getObjectByProperty('geometry',node.geometry)));}assert.equal(low.castShadow,false);});
 let disposed=0;sources.bleachers!.traverse(node=>{if(node instanceof Mesh)node.geometry.addEventListener('dispose',()=>disposed++);});full.dispose();full.dispose();economy.dispose();assert.equal(disposed,0);
 }
});
test('source support remains under each raised spectator bank instead of an empty high floor',async()=>{
 const kit=buildStadiumSeating('wild',await load(),{...mechanismLayout('wild'),lowQuality:false});let supports=0;kit.root.traverse(n=>{if(n instanceof InstancedMesh&&n.name.includes('grandstand_structural_rostrum')){supports+=n.count;const m=new Matrix4();n.getMatrixAt(0,m);const box=new Box3().setFromBufferAttribute(n.geometry.getAttribute('position')).applyMatrix4(m);assert.ok(box.min.y<=.240001&&box.max.y>=1.38);}});assert.equal(supports,kit.plan.bays.length);kit.dispose();
});

test('all infields are open rather than crowded with another spectator bank',()=>{
 const options={scale:1,lift:0,lowQuality:false};
 const inner=stadiumSeatingPlan('mild',options).bays.filter(b=>b.infield);
 assert.equal(inner.length,0);
 assert.equal(stadiumSeatingPlan('twisty-twirl',options).bays.filter(b=>b.infield).length,0);
});
