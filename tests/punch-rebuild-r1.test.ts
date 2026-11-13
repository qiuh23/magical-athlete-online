import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {Euler,Mesh,Quaternion,Vector3} from 'three';
import {PARK,assertPose,assertTransition,bindRebuildDriver,interpolate,retract,reviewPose} from '../art/mechanisms/punch-rebuild-r1/driver.js';
const model=async()=>{const b=readFileSync('art/mechanisms/punch-rebuild-r1/punch-rebuild-r1.glb');return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
test('r1 driver has separate wrist/reach, real spring morph, fixed root and deterministic backwards sampling',async()=>{
 const gltf=await model();assert.equal(gltf.animations.length,0);const root=gltf.scene,driver=bindRebuildDriver(root),before=root.matrix.clone();
 const p={boomYaw:Math.PI/2,headYaw:Math.PI/6,reach:.30,stroke:.35};driver.sample(p);
 const head=root.getObjectByName('PUNCH_COUNTER_YAW')!,v=head.getWorldPosition(new Vector3());
 const expected=new Vector3(.85+p.reach,0,0).applyAxisAngle(new Vector3(0,1,0),p.boomYaw).add(new Vector3(-.85,.35,1.3));assert.ok(v.distanceTo(expected)<1e-5);
 const q=head.getWorldQuaternion(new Quaternion()),target=new Quaternion().setFromEuler(new Euler(0,p.headYaw,0));assert.ok(q.angleTo(target)<1e-5);
 assert.equal((root.getObjectByName('PUNCH_SPRING') as Mesh).morphTargetInfluences![0],1);
 driver.sample(PARK);assert.deepEqual(root.matrix.toArray(),before.toArray());assert.equal(root.getObjectByName('PUNCH_R1_TELESCOPE_2')!.position.x,0);assert.equal((root.getObjectByName('PUNCH_SPRING') as Mesh).morphTargetInfluences![0],0);
});
test('r1 domains and phase constraints reject invalid or simultaneous aiming while extended',()=>{
 for(const bad of [{...PARK,stroke:.351},{...PARK,reach:.301},{...PARK,headYaw:NaN},{...PARK,boomYaw:0}])assert.throws(()=>assertPose(bad));
 assert.throws(()=>interpolate({...PARK,stroke:.2},{...PARK,boomYaw:1.4,stroke:.2},.5));assert.throws(()=>interpolate(PARK,{...PARK,reach:.3,stroke:.2},.5));
 assert.throws(()=>interpolate({...PARK,reach:.3},{...PARK,reach:.3,headYaw:0},.5));
 const held={...PARK,reach:.25,stroke:.3};for(let i=0;i<=100;i++){const p=retract(held,i/100);assert.equal(p.reach,held.reach);assert.equal(p.headYaw,held.headYaw);assert.equal(p.boomYaw,held.boomYaw);assert.ok(p.stroke<=held.stroke);}
 assert.deepEqual(interpolate(PARK,{...PARK,reach:.3},1),{...PARK,reach:.3});
});
test('r1 review samples use normalized progress only and retract before changing any other joint',()=>{
 let previous=reviewPose(0);for(let i=1;i<=1000;i++){const p=reviewPose(i/1000);assertPose(p);assertTransition(previous,p);previous=p;}assert.deepEqual(previous,PARK);
});
test('r1 evidence is bound to the current GLB and only certifies the finite new-mechanical domain',async()=>{
 const {createHash}=await import('node:crypto');
 const report=JSON.parse(readFileSync('docs/qa/punch-rebuild-r1/validation.json','utf8'));
 const section=JSON.parse(readFileSync('docs/qa/punch-rebuild-r1/section-clearance.json','utf8'));
 assert.equal(report.glbSHA256,createHash('sha256').update(readFileSync('art/mechanisms/punch-rebuild-r1/punch-rebuild-r1.glb')).digest('hex'));
 assert.equal(report.productionApproved,false);assert.equal(section.productionApproved,false);
 assert.equal(report.finitePoseSamples,81);assert.deepEqual(report.newPartUnexpectedSurfacePairs,[]);
 assert.equal(Object.keys(section.newSolids).length,9);assert.ok(Object.values(section.newSolids).every((x:any)=>x.cavityConfirmed));
 assert.ok(section.fits.every((x:any)=>x.guideGapM>.00299&&x.axialOverlapMinimumM>.08999));
 assert.ok(report.coldRoundtrip.maximumBidirectionalVertexErrorM<1e-5);
 assert.ok(report.negativeOverrun.triangleContactPairs>0);
});
