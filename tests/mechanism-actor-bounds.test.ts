import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3, type Object3D } from 'three';
import { MechanismActorBounds } from '../src/client/scene/mechanisms/actor-bounds.js';

function block(width:number,height:number,depth:number){return new Mesh(new BoxGeometry(width,height,depth),new MeshBasicMaterial());}
function same(actual:Vector3,expected:number[]){assert.ok(actual.distanceTo(new Vector3(...expected))<1e-6,`${actual.toArray()} != ${expected}`);}
function cleanup(root:Object3D){root.traverse(n=>{if(n instanceof Mesh){n.geometry.dispose();if(Array.isArray(n.material))n.material.forEach(m=>m.dispose());else n.material.dispose();}});}
const fallback=new Vector3(99,99,99);

test('surface targets current body size and crowd scale rather than character identity or a fixed pawn point',()=>{
 const actors=new MechanismActorBounds(),small=block(1,2,1),large=block(4,3,2),origin=new Vector3(-10,0,0);
 const a=actors.bind('arbitrary-small-id',small),b=actors.bind('unlisted-large-character',large);
 same(actors.surface('arbitrary-small-id',origin,fallback),[-.5,0,0]);same(actors.surface('unlisted-large-character',origin,fallback),[-2,0,0]);
 large.scale.set(.25,.5,.5);same(actors.surface('unlisted-large-character',origin,fallback),[-.5,0,0]);
 const holder=new Group();holder.position.set(3,2,4);holder.scale.setScalar(.6);holder.add(small);
 same(actors.surface('arbitrary-small-id',new Vector3(-10,2,4),fallback),[2.7,2,4]);
 a();b();cleanup(holder);cleanup(large);
});

test('surface follows lying and recovering geometry transforms without changing the gameplay down state',()=>{
 const actors=new MechanismActorBounds(),body=block(1,2,1),state=Object.freeze({position:24,tripped:true,score:4,flags:Object.freeze({form:'tall'})});body.userData.gameplay=state;
 actors.bind('falling',body);const origin=new Vector3(0,0,-10),before=JSON.stringify(state);
 same(actors.surface('falling',origin,fallback),[0,0,-.5]);
 body.rotation.x=-Math.PI/2;same(actors.surface('falling',origin,fallback),[0,0,-1]);
 body.rotation.x=0;body.position.y=.4;same(actors.surface('falling',new Vector3(0,.4,-10),fallback),[0,.4,-.5]);
 assert.equal(JSON.stringify(state),before);assert.equal(body.userData.gameplay,state);cleanup(body);
});

test('mounted and transformed forms are measured as the visible combined geometry',()=>{
 const actors=new MechanismActorBounds(),body=new Group(),rider=block(1,2,1),mount=block(3,1,2),form=block(5,1,1);
 rider.position.y=1.5;body.add(rider,mount,form);form.visible=false;actors.bind('mounted',body);
 same(actors.surface('mounted',new Vector3(-10,1,0),fallback),[-1.5,1,0]);
 const first=actors.bounds('mounted')!;same(first.min,[-1.5,-.5,-1]);same(first.max,[1.5,2.5,1]);
 // Switching the visible form changes the measured surface without re-binding.
 rider.visible=false;mount.visible=false;form.visible=true;
 same(actors.surface('mounted',new Vector3(-10,0,0),fallback),[-2.5,0,0]);
 body.visible=false;const missing=actors.surface('mounted',new Vector3(-10,0,0),fallback);same(missing,fallback.toArray());assert.notEqual(missing,fallback);cleanup(body);
});

test('multiple crowded targets retain separate live bounds and stale cleanup cannot erase a replacement',()=>{
 const actors=new MechanismActorBounds(),bodies=Array.from({length:8},(_,index)=>{const body=block(.4+index*.1,1,.4);body.position.set(index*1.5,0,index%2);actors.bind(`racer-${index}`,body);return body;});
 for(let index=0;index<8;index++){const body=bodies[index]!,origin=new Vector3(body.position.x-10,0,body.position.z),hit=actors.surface(`racer-${index}`,origin,fallback);same(hit,[body.position.x-(.4+index*.1)/2,0,body.position.z]);}
 const old=block(1,1,1),replacement=block(3,1,1),unbindOld=actors.bind('reused',old),unbindCurrent=actors.bind('reused',replacement);unbindOld();same(actors.surface('reused',new Vector3(-10,0,0),fallback),[-1.5,0,0]);
 unbindCurrent();same(actors.surface('reused',new Vector3(-10,0,0),fallback),fallback.toArray());bodies.forEach(cleanup);cleanup(old);cleanup(replacement);
});

test('geometry feedback is read-only, ignores hidden branches, and safely handles missing or centered targets',()=>{
 const actors=new MechanismActorBounds(),body=new Group(),visible=block(1,2,1),hidden=new Group(),huge=block(100,100,100);hidden.visible=false;hidden.add(huge);body.add(visible,hidden);
 const state=Object.freeze({racerId:'racer',position:5,tripped:false,eliminated:false,score:8,route:Object.freeze([5,6,7])});body.userData.state=state;actors.bind('racer',body);
 const before=JSON.stringify(state),origin=new Vector3(-10,0,0),originBefore=origin.clone(),fallbackBefore=fallback.clone();
 const bounds=actors.bounds('racer')!;same(bounds.min,[-.5,-1,-.5]);same(bounds.max,[.5,1,.5]);
 for(let i=0;i<20;i++){same(actors.surface('racer',origin,fallback),[-.5,0,0]);same(actors.surface('racer',new Vector3(),fallback),[0,0,0]);}
 same(origin,originBefore.toArray());same(fallback,fallbackBefore.toArray());assert.equal(JSON.stringify(state),before);assert.equal(body.userData.state,state);
 const unknown=actors.surface('not-yet-loaded',origin,fallback);same(unknown,fallback.toArray());assert.notEqual(unknown,fallback);
 assert.deepEqual(Object.getOwnPropertyNames(Object.getPrototypeOf(actors)).sort(),['bind','bounds','capture','captureParts','clearTripSweep','constructor','enterDirectedBeat','setTripSweep','surface','tripHit','tripPlans']);cleanup(body);
});

test('first-frame distant skinned actors match the renderer matrix update order before any rendered frame',async()=>{
 const {readFileSync}=await import('node:fs'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js'),{cloneToyModel}=await import('../src/client/scene/toy-model-instance.js');
 const {Matrix4,Quaternion}=await import('three'),{MeshoptDecoder}=await import('three/addons/libs/meshopt_decoder.module.js');
 const bytes=readFileSync('public/models/toy-racers.glb'),asset=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 for(const id of ['coach','blimp','centaur']){
  const scene=new Group(),root=new Group(),body=new Group(),sculpture=cloneToyModel(asset.scene.getObjectByName(`toy_${id}`)!,true);sculpture.userData.sculptureState='ready';body.add(sculpture);root.add(body);scene.add(root);
  root.position.set(31,2.4,-23);root.rotation.y=Math.PI/2;root.scale.setScalar(.95);
  const world=new Matrix4().compose(root.position,new Quaternion().setFromAxisAngle(new Vector3(0,1,0),Math.PI/2),root.scale),actors=new MechanismActorBounds();actors.bind(id,body);
  const first=actors.capture(id,world)!;assert.ok(first&&first.lower.length>0);
  // Independent oracle follows WebGLRenderer's scene update before reading any
  // evaluated skinned vertices, rather than repeating capture's old method.
  scene.updateMatrixWorld(true);const expectedMin=new Vector3(Infinity,Infinity,Infinity),expectedMax=new Vector3(-Infinity,-Infinity,-Infinity),p=new Vector3();
  body.traverse(node=>{if(!(node instanceof Mesh))return;const position=node.geometry.getAttribute('position');for(let i=0;i<position.count;i++){node.getVertexPosition(i,p).applyMatrix4(node.matrixWorld);expectedMin.min(p);expectedMax.max(p);}});
  same(first.bounds.min,expectedMin.toArray());same(first.bounds.max,expectedMax.toArray());
  const second=actors.capture(id,world)!;same(first.bounds.min,second.bounds.min.toArray());same(first.bounds.max,second.bounds.max.toArray());
  const live=actors.bounds(id)!;same(live.min,expectedMin.toArray());same(live.max,expectedMax.toArray());
 }
});
