import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Euler,Matrix4,Quaternion,Triangle,Vector3} from 'three';
import {createTriangleContactIndex,getTriangleContactIndex,TriangleContactBox} from '../src/client/scene/mechanisms/triangle-contact-index.js';

function brute(triangles:readonly Triangle[],box:Box3,matrix:Matrix4){
 const inverse=matrix.clone().invert(),triangle=new Triangle();
 for(const source of triangles){
  triangle.a.copy(source.a).applyMatrix4(inverse);triangle.b.copy(source.b).applyMatrix4(inverse);triangle.c.copy(source.c).applyMatrix4(inverse);
  if(box.intersectsTriangle(triangle))return true;
 }
 return false;
}
function seeded(){let state=0x1729;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/0x100000000;};}

test('contact bounds reject candidates but never substitute for triangle contact',()=>{
 const triangles=[new Triangle(new Vector3(0,0,0),new Vector3(2,0,0),new Vector3(0,2,0))],index=createTriangleContactIndex(triangles),matrix=new Matrix4();
 const miss=new Box3(new Vector3(1.5,1.5,-.1),new Vector3(1.6,1.6,.1));
 assert.equal(new Box3(new Vector3(0,0,0),new Vector3(2,2,0)).intersectsBox(miss),true);
 assert.equal(index.intersectsBox(miss,matrix),false);
 assert.equal(index.intersectsBox(new Box3(new Vector3(.3,.3,-.1),new Vector3(.4,.4,.1)),matrix),true);
 assert.equal(index.intersectsBox(new Box3(new Vector3(1,1,0),new Vector3(1.1,1.1,.1)),matrix),true,'edge tangent is a contact');
 assert.equal(index.intersectsBox(new Box3(),matrix),false);
 assert.equal(createTriangleContactIndex([]).intersectsBox(miss,matrix),false);
});

test('cached indexes belong to frozen triangle array identities without reordering the source',()=>{
 const triangles=Array.from({length:64},(_,i)=>new Triangle(new Vector3(64-i,0,0),new Vector3(64-i,1,0),new Vector3(64-i,0,1))),before=triangles.map(t=>t.a.x);
 assert.equal(getTriangleContactIndex(triangles),getTriangleContactIndex(triangles));
 assert.notEqual(getTriangleContactIndex(triangles),getTriangleContactIndex([...triangles]));
 assert.deepEqual(triangles.map(t=>t.a.x),before);
});

test('BVH contact matches brute-force exact SAT for random rotation, scale, reflection and shear',()=>{
 const random=seeded(),coord=()=>random()*8-4;
 const triangles=Array.from({length:192},()=>{
  const a=new Vector3(coord(),coord(),coord());return new Triangle(a,a.clone().add(new Vector3(random(),random(),random())),a.clone().add(new Vector3(random(),random(),random())));
 });
 const index=createTriangleContactIndex(triangles);let hits=0,misses=0;
 for(let i=0;i<1500;i++){
  const matrix=new Matrix4().compose(new Vector3(coord(),coord(),coord()),new Quaternion().setFromEuler(new Euler(random()*6,random()*6,random()*6)),new Vector3((i%2?-1:1)*(.05+random()*2),.05+random()*2,.05+random()*2));
  matrix.multiply(new Matrix4().makeShear(random()*.4,random()*.4,random()*.4,random()*.4,random()*.4,random()*.4));
  const center=new Vector3(random()-.5,random()-.5,random()-.5),size=new Vector3(.01+random(),.01+random(),.01+random()),box=new Box3().setFromCenterAndSize(center,size);
  const expected=brute(triangles,box,matrix);expected?hits++:misses++;
  assert.equal(index.intersectsBox(box,matrix),expected,`affine query ${i}`);
 }
 assert.ok(hits>100&&misses>100,`meaningful positive/negative coverage: ${hits}/${misses}`);
});

test('conservative bounds preserve near-face and degenerate contacts across scales and world offsets',()=>{
 const random=seeded(),box=new Box3(new Vector3(-1,-1,-1),new Vector3(1,1,1));
 for(const scale of [1e-4,.1,1,100,1e4])for(const offset of [0,1e6])for(let i=0;i<60;i++){
  const matrix=new Matrix4().compose(new Vector3(offset,-offset,offset),new Quaternion().setFromEuler(new Euler(random()*6,random()*6,random()*6)),new Vector3(scale,scale*.7,scale*1.8));
  const z=1+(i%3-1)*1e-12;
  const triangle=new Triangle(new Vector3(-.1,-.1,z),new Vector3(.1,-.1,z),new Vector3(0,.1,z));
  if(i%7===0)triangle.c.copy(triangle.b);
  for(const p of [triangle.a,triangle.b,triangle.c])p.applyMatrix4(matrix);
  assert.equal(createTriangleContactIndex([triangle]).intersectsBox(box,matrix),brute([triangle],box,matrix),`scale ${scale}, offset ${offset}, query ${i}`);
 }
});

test('localized contact prunes a large sculpture before running exact SAT',()=>{
 const triangles=Array.from({length:10000},(_,i)=>new Triangle(new Vector3(i*3,0,0),new Vector3(i*3+1,0,0),new Vector3(i*3,1,0))),index=createTriangleContactIndex(triangles);
 const box=new Box3(new Vector3(29997.1,.1,-.1),new Vector3(29997.2,.2,.1));let calls=0;
 const query=new TriangleContactBox().set(box,new Matrix4()),original=query.box.intersectsTriangle;
 query.box.intersectsTriangle=function(triangle:Triangle){calls++;return original.call(this,triangle);};
 assert.equal(index.intersectsPreparedBox(query),true);
 assert.ok(calls<=8,`${calls} narrow-phase checks for 10,000 triangles`);
});

test('one prepared rendered box is reusable across actors and invalidates its inverse with every pose',()=>{
 const a=[new Triangle(new Vector3(0,0,0),new Vector3(1,0,0),new Vector3(0,1,0))],b=a.map(t=>new Triangle(t.a.clone().addScalar(5),t.b.clone().addScalar(5),t.c.clone().addScalar(5))),indexes=[createTriangleContactIndex(a),createTriangleContactIndex(b)];
 const box=new Box3(new Vector3(.1,.1,-.1),new Vector3(.2,.2,.1)),matrix=new Matrix4(),query=new TriangleContactBox();
 for(const offset of [0,5,-10,0,5]){
  matrix.makeTranslation(offset,offset,offset);query.set(box,matrix);
  for(let i=0;i<indexes.length;i++)assert.equal(indexes[i]!.intersectsPreparedBox(query),brute(i?b:a,box,matrix));
 }
 // Prepared inputs are copied, so later changes cannot stale only their bounds.
 query.set(box,new Matrix4());box.makeEmpty();matrix.makeScale(20,20,20);
 assert.equal(indexes[0]!.intersectsPreparedBox(query),true);
});
