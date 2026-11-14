import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Matrix4,Vector3} from 'three';
import {orientedSweep,orientedSeparation} from '../src/client/scene/mechanisms/oriented-clearance.js';

test('rotated cabinet false corners are separable without reducing a Euclidean safety gap',()=>{
 const part=new Box3(new Vector3(-1,-1,-.1),new Vector3(1,1,.1)),matrix=new Matrix4().makeRotationY(Math.PI/4),other=new Box3().setFromCenterAndSize(new Vector3(.65,0,.65),new Vector3(.2,.3,.2));
 assert.ok(part.clone().applyMatrix4(matrix).intersectsBox(other));
 const sweep=orientedSweep(part,matrix,undefined,0)!;assert.ok(orientedSeparation(sweep,other)>.6);
 const touching=new Box3().setFromCenterAndSize(new Vector3(),new Vector3(.2,.3,.2));assert.equal(orientedSeparation(sweep,touching),0);
});

test('swept local endpoint union plus analytic bow contains intermediate actual corners including nonunit shear',()=>{
 const local=new Box3(new Vector3(1.95,-.05,-.05),new Vector3(2.05,.05,.05));
 for(const mount of [new Matrix4(),new Matrix4().set(1.2,0,.3,3, 0,.7,0,2, 0,0,1.4,-4, 0,0,0,1)]){
  const current=mount.clone().multiply(new Matrix4().makeRotationY(.5)),previous=mount.clone().multiply(new Matrix4().makeRotationY(-.5));
  const linear=Math.sqrt([0,1,2,4,5,6,8,9,10].reduce((sum,i)=>sum+mount.elements[i]!**2,0));
  const sweep=orientedSweep(local,current,previous,2.1*linear/8)!;
  for(let i=0;i<=128;i++){const pose=mount.clone().multiply(new Matrix4().makeRotationY(-.5+i/128));for(const x of [local.min.x,local.max.x])for(const y of [local.min.y,local.max.y])for(const z of [local.min.z,local.max.z]){
   const p=new Vector3(x,y,z).applyMatrix4(pose);for(const a of sweep.projections){const v=p.dot(a.axis);assert.ok(v>=a.min-1e-9&&v<=a.max+1e-9);}
  }}
 }
});

test('singular or projective matrices cannot supply narrow-phase clearance',()=>{
 const box=new Box3(new Vector3(-1,-1,-1),new Vector3(1,1,1));assert.equal(orientedSweep(box,new Matrix4().makeScale(0,1,1),undefined,0),undefined);
 const perspective=new Matrix4();perspective.elements[3]=.1;assert.equal(orientedSweep(box,perspective,undefined,0),undefined);
});

test('nonfinite or negative padding and invalid previous transforms cannot authorize a sweep',()=>{
 const box=new Box3(new Vector3(-1,-1,-1),new Vector3(1,1,1)),valid=new Matrix4(),nan=new Matrix4();nan.elements[12]=NaN;
 for(const previous of [nan,new Matrix4().makeScale(0,1,1)])assert.equal(orientedSweep(box,valid,previous,0),undefined);
 for(const bow of [NaN,Infinity,-.001])assert.equal(orientedSweep(box,valid,undefined,bow),undefined);
 assert.equal(orientedSeparation(orientedSweep(box,valid,undefined,0)!,new Box3(new Vector3(NaN,0,0),new Vector3(1,1,1))),0);
});
