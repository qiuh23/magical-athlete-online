import test from 'node:test';
import assert from 'node:assert/strict';
import {BoxGeometry,Group,Matrix4,Mesh,MeshBasicMaterial,Vector3} from 'three';
import {MechanismActorBounds} from '../src/client/scene/mechanisms/actor-bounds.js';
import {createTripSweepRig,planTripSweep,sampleTripSweep,sweepIntersects,SWEEP_PARK_REACH} from '../src/client/scene/environment/trip-sweep.js';
import {displayTripFallProgress,pawnFallPose} from '../src/client/scene/pawn-fall.js';

function actor(registry:MechanismActorBounds,id:string,x:number,z:number,width=.3){
 const body=new Group(),sculpture=new Group();sculpture.userData.sculptureState='ready';
 const foot=new Mesh(new BoxGeometry(width,.35,.35),new MeshBasicMaterial());foot.position.y=.40;sculpture.add(foot);body.add(sculpture);
 // A wider ownership base must never be accepted as an actor-foot hit.
 const base=new Mesh(new BoxGeometry(1.4,.1,1.4),new MeshBasicMaterial());base.position.y=.05;body.add(base);registry.bind(id,body);
 return{body,snapshot:registry.capture(id,new Matrix4().makeTranslation(x,0,z))!};
}

test('triangle snapshots clip actual lower sculptures, exclude bases, ignore hidden parts and preserve authored state',()=>{
 const registry=new MechanismActorBounds(),{body,snapshot}=actor(registry,'not-a-whitelisted-character',0,0);
 assert.ok(snapshot.triangles.length>0&&snapshot.lower.length>0);assert.ok(snapshot.lowerBounds.min.y>.2);assert.ok(snapshot.lowerBounds.max.x<.2);assert.ok(snapshot.bounds.max.x>.6);
 assert.ok(snapshot.lowerBounds.max.y<=.225+.35*.35+1e-9);
 const before=body.matrix.clone();body.rotation.x=-Math.PI/2;body.position.set(3,2,1);
 const second=registry.capture('not-a-whitelisted-character',new Matrix4())!;
 assert.ok(second.bounds.min.distanceTo(snapshot.bounds.min)<1e-8);assert.ok(second.bounds.max.distanceTo(snapshot.bounds.max)<1e-8);
 assert.equal(body.position.x,3);assert.notDeepEqual(body.matrix.elements,before.elements);
 body.children[0]!.userData.sculptureState='pending';assert.equal(registry.capture('not-a-whitelisted-character',new Matrix4()),undefined);
});

test('one world-space sweep reaches multiple real lower-body triangles at distinct first contacts',()=>{
 const registry=new MechanismActorBounds(),targets=[actor(registry,'left',-.42,0).snapshot,actor(registry,'right',.42,0).snapshot];
 const mount=new Matrix4(),plan=planTripSweep('beat','test:1',mount,.30,targets,[])!;
 assert.deepEqual(plan.unreached,[]);assert.equal(plan.contacts.size,2);assert.notEqual(plan.contacts.get('left'),plan.contacts.get('right'));
 for(const target of targets){const hit=plan.contacts.get(target.id)!;assert.ok(hit>=.2&&hit<.62);assert.equal(sweepIntersects(sampleTripSweep(plan,hit-.00002),mount,target),false);assert.equal(sweepIntersects(sampleTripSweep(plan,hit),mount,target),true);
  assert.equal(displayTripFallProgress(hit-.000001,hit),0);assert.equal(pawnFallPose(displayTripFallProgress(.94,hit),'trip').tilt,-Math.PI/2);
 }
 const park={yaw:0,reach:SWEEP_PARK_REACH,height:plan.parkHeight};assert.deepEqual(sampleTripSweep(plan,0),park);assert.deepEqual(sampleTripSweep(plan,1),park);
 assert.equal(sampleTripSweep(plan,.80).reach,SWEEP_PARK_REACH);assert.ok(sampleTripSweep(plan,.9).reach<=SWEEP_PARK_REACH+1e-10);
 for(const t of [.1,.3,.5,.75,.9])assert.deepEqual(sampleTripSweep(plan,t),sampleTripSweep(plan,t));
});

test('compact world rotation preserves contact times and does not move the mechanism root',()=>{
 const registry=new MechanismActorBounds(),standing=actor(registry,'target',.25,0).snapshot;
 const mount=new Matrix4().makeRotationY(.8).setPosition(6,2,4),rotation=new Matrix4().makeRotationY(-Math.PI/2);
 const transformed={...standing,triangles:standing.triangles.map(t=>t.clone().set(t.a.clone().applyMatrix4(mount),t.b.clone().applyMatrix4(mount),t.c.clone().applyMatrix4(mount))),lower:standing.lower.map(t=>t.clone().set(t.a.clone().applyMatrix4(mount),t.b.clone().applyMatrix4(mount),t.c.clone().applyMatrix4(mount))),bounds:standing.bounds.clone().applyMatrix4(mount),lowerBounds:standing.lowerBounds.clone().applyMatrix4(mount)};
 const compact={...transformed,triangles:transformed.triangles.map(t=>t.clone().set(t.a.clone().applyMatrix4(rotation),t.b.clone().applyMatrix4(rotation),t.c.clone().applyMatrix4(rotation))),lower:transformed.lower.map(t=>t.clone().set(t.a.clone().applyMatrix4(rotation),t.b.clone().applyMatrix4(rotation),t.c.clone().applyMatrix4(rotation))),bounds:transformed.bounds.clone().applyMatrix4(rotation),lowerBounds:transformed.lowerBounds.clone().applyMatrix4(rotation)};
 const a=planTripSweep('a','anchor',mount,.3,[transformed],[])!,b=planTripSweep('b','anchor',rotation.clone().multiply(mount),.3,[compact],[])!;
 assert.ok(Math.abs(a.contacts.get('target')!-b.contacts.get('target')!)<1e-6);
 const object=new Group(),rotor=new Group(),old=new Mesh(new BoxGeometry(1,1,1),new MeshBasicMaterial());rotor.name='TRIP_ROTOR_Z';rotor.position.set(0,.22,1.6200000047683716);rotor.add(old);object.add(rotor);object.matrixAutoUpdate=false;object.matrix.copy(mount);
 const rig=createTripSweepRig(object,.3),matrix=object.matrix.clone();assert.equal(old.visible,false);
 for(const t of [0,.5,.2,1,.2,0]){rig.sample(sampleTripSweep(a,t));assert.deepEqual(object.matrix.elements,matrix.elements);}
 assert.ok(object.getObjectByName('TRIP_SWEEP_ROD')?.visible);rig.dispose();assert.equal(old.visible,true);assert.equal(object.getObjectByName('TRIP_SWEEP_ROD'),undefined);
});

test('non-target crossing is recorded rather than hidden, and only explicit contacts can begin a fall',()=>{
 const registry=new MechanismActorBounds(),target=actor(registry,'authorized',0,0).snapshot,other=actor(registry,'bystander',0,0).snapshot;
 const plan=planTripSweep('beat','anchor',new Matrix4(),.3,[target],[other])!;
 assert.deepEqual(plan.bystanders,['bystander']);assert.ok([...plan.contacts.keys()].every(id=>id==='authorized'));
 registry.setTripSweep(plan);assert.equal(registry.tripHit('beat','authorized'),undefined);
 const valid=planTripSweep('beat','anchor',new Matrix4(),.3,[target],[])!;registry.setTripSweep(valid);assert.equal(registry.tripHit('beat','authorized'),valid.contacts.get('authorized'));assert.equal(registry.tripHit('beat','bystander'),undefined);assert.equal(registry.tripHit('other-beat','authorized'),undefined);
 for(const t of [0,.4,.9,.999])assert.equal(displayTripFallProgress(t,undefined),0);assert.equal(displayTripFallProgress(1,undefined),1);
 const original=valid.contacts.get('authorized');assert.equal(registry.tripPlans('beat')[0],valid);assert.equal(registry.tripHit('beat','authorized'),original);
 registry.clearTripSweep('anchor');assert.deepEqual(registry.tripPlans('beat'),[]);
});
