import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Group,Matrix4,Mesh,Vector3} from 'three';
import {createDisplayMechanism,displayPunchOutlet,DISPLAY_URLS,fullCoveragePlacements} from '../src/client/scene/environment/full-coverage.js';
import {createDirectedMechanism,geometryBounds,type DirectedActor} from '../src/client/scene/environment/directed-mechanism.js';
import {fixtureAsset,fixtureActor} from '../qa/authored-fixture-actors.js';
import {MechanismActorBounds} from '../src/client/scene/mechanisms/actor-bounds.js';
import {pawnOccupancy} from '../src/client/scene/camera.js';
import {boardPoint} from '../src/client/scene/math.js';
import {mechanismPlacements} from '../src/client/scene/mechanisms/placements.js';
import type {Racer} from '../src/shared/types.js';
Object.assign(globalThis,{window:{location:{search:'?mechanisms=1&environment=1'}}});
const tiny=(id:string,center:Vector3):DirectedActor=>{const bounds=new Box3().setFromCenterAndSize(center,new Vector3(.3,.6,.3));return{id,bounds,parts:[bounds]};};
const pose=(object:Group)=>{object.updateMatrixWorld(true);const result:number[]=[];object.traverse(n=>{result.push(...n.matrix.elements);if(n instanceof Mesh)result.push(...n.morphTargetInfluences??[]);});return result;};

test('every gain and native punch directs its real working mesh toward actual authorized world target in either layout',async()=>{
 for(const track of ['wild','squiggle','boardwalks'] as const)for(const compact of [false,true])for(const p of fullCoveragePlacements(track,compact).filter(p=>p.variant==='gain'||p.variant==='punch')){
  const asset=await fixtureAsset(DISPLAY_URLS[p.variant]),model=createDisplayMechanism(p.variant,asset.scene,asset.animations[0]);assert.ok('directional' in model&&model.directional);const rig=model.directional;
  for(const offset of [[-.65,-.65],[.65,-.65],[-.65,.65],[.65,.65],[0,0]]){
   const origin=boardPoint(p.anchor.node,compact,track),target=tiny('arbitrary-authorized-id',new Vector3(origin[0]+offset[0]!,origin[1]+.65,origin[2]+offset[1]!));
   const plan=rig.plan(p.matrix,target,[target]);assert.equal(plan.mode,'directed',`${p.anchor.id}/${compact}/${offset}`);
   const startT=p.variant==='punch'?.08:.14,endT=p.variant==='punch'?.22:.38;
   rig.sample(plan,startT);const start=rig.surface().applyMatrix4(p.matrix);rig.sample(plan,endT);const end=rig.surface().applyMatrix4(p.matrix);
   assert.ok(end.distanceTo(target.bounds.getCenter(new Vector3()))<start.distanceTo(target.bounds.getCenter(new Vector3())),`${p.anchor.id}/${compact} actual working surface moves closer`);
   assert.ok(end.clone().sub(start).dot(target.bounds.getCenter(new Vector3()).sub(start))>0,`${p.anchor.id} positive target-directed displacement`);
   if(p.variant==='punch'){
    assert.ok(Math.abs(end.distanceTo(start)-.35)<1e-5,'whole authored stroke is retained');
    assert.ok(Math.abs(end.y-start.y)<1e-8,'horizontal slider, no fake head pitch');
    assert.ok(displayPunchOutlet(model.object).distanceTo(rig.surface())<1e-6,'outlet is the transformed authored +X face');
   }
  }
  model.dispose();
 }
});

test('target sampling is absolute, pause/reverse/replay safe, restores exact park and keeps mount/cache unchanged',async()=>{
 for(const kind of ['gain','punch'] as const){
  const asset=await fixtureAsset(DISPLAY_URLS[kind]),sourcePose=pose(asset.scene),model=createDisplayMechanism(kind,asset.scene,asset.animations[0]);assert.ok('directional'in model&&model.directional);const rig=model.directional;
  const holder=new Group();holder.position.set(12,2,-5);holder.rotation.y=.7;holder.add(model.object);holder.updateMatrixWorld(true);const mount=holder.matrixWorld.clone(),fixed=holder.matrix.clone();
  const target=tiny('target',new Vector3(0,.7,0).applyMatrix4(mount)),plan=rig.plan(mount,target,[target]);assert.equal(plan.mode,'directed');rig.sample(plan,0);const park=pose(model.object);
  for(const t of [.05,.14,.22,.38,.6,.88]){rig.sample(plan,t);const expected=pose(model.object);rig.sample(plan,.98);rig.sample(plan,.001);for(let i=0;i<8;i++)rig.sample(plan,t);assert.deepEqual(pose(model.object),expected);assert.deepEqual(holder.matrix.elements,fixed.elements);}
  rig.sample(plan,1);assert.deepEqual(pose(model.object),park);assert.deepEqual(pose(asset.scene),sourcePose);model.dispose();
 }
});

test('an unproven sweep holds actual hardware without moving or mutating the bystander',async()=>{
 const asset=await fixtureAsset(DISPLAY_URLS.punch),model=createDisplayMechanism('punch',asset.scene,asset.animations[0]);assert.ok('directional'in model&&model.directional);const rig=model.directional;
 const target=tiny('target',new Vector3(0,.7,0)),wall=tiny('not-a-target',new Vector3(0,.7,1));wall.bounds.expandByScalar(6);const before=wall.bounds.clone(),plan=rig.plan(new Matrix4(),target,[target,wall]);assert.equal(plan.mode,'hold');
 rig.sample(plan,0);const park=pose(model.object);for(const t of [.2,.4,.8,1]){rig.sample(plan,t);assert.deepEqual(pose(model.object),park);}assert.ok(wall.bounds.equals(before));assert.equal(plan.targetId,'target');model.dispose();
});

test('native stand-off is fixed before animation; R1, gain, trip, loss and warp mounts keep their source placement',()=>{
 for(const track of ['wild','squiggle','boardwalks']as const)for(const compact of [false,true]){
  const first=fullCoveragePlacements(track,compact),second=fullCoveragePlacements(track,compact);
  first.forEach((p,i)=>assert.deepEqual(p.matrix.elements,second[i]!.matrix.elements));
  const desktop=fullCoveragePlacements(track),rotate=new Matrix4().makeRotationY(-Math.PI/2);
  if(compact)first.forEach((p,i)=>{const expected=rotate.clone().multiply(desktop[i]!.matrix);p.matrix.elements.forEach((v,j)=>assert.ok(Math.abs(v-expected.elements[j]!)<1e-8));});
 }
});

test('a frozen base envelope does not suppress separated moving hardware',async()=>{
 const asset=await fixtureAsset(DISPLAY_URLS.gain),model=createDisplayMechanism('gain',asset.scene,asset.animations[0]);
 assert.ok('directional'in model&&model.directional);const rig=model.directional;
 model.object.updateMatrixWorld(true);const foot=model.object.getObjectByName('GAIN_FOOT') as Mesh;assert.ok(foot instanceof Mesh);
 const fixed=geometryBounds(foot.geometry).clone().applyMatrix4(foot.matrixWorld),base={id:'close-to-fixed-base',bounds:fixed,parts:[fixed]};
 const target=tiny('target',new Vector3(0,.7,0)),plan=rig.plan(new Matrix4(),target,[target,base]);
 assert.equal(plan.mode,'directed','unchanged fixed base does not enter moving sweep admission');
 const before=foot.matrixWorld.clone();for(const t of [0,.07,.14,.26,.38,.6,.78,.9,1]){rig.sample(plan,t);assert.deepEqual(foot.matrixWorld.elements,before.elements);}
 model.dispose();
});

test('supported crowded-device down-body regressions retain directed action instead of silent holds',async()=>{
 const {Quaternion}=await import('three');
 for(const track of ['squiggle','boardwalks']as const)for(const compact of [false,true])for(const low of [false,true])for(const placement of fullCoveragePlacements(track,compact).filter(p=>['squiggle:14','boardwalks:9','boardwalks:32','boardwalks:50'].includes(p.anchor.id)))for(const role of ['banana','hotel']){
  const body=await fixtureActor(role,low);body.userData.sculptureState='ready';const p=boardPoint(placement.anchor.node,compact,track),scale=1.65;
  const world=new Matrix4().compose(new Vector3(p[0],p[1]+.005+.34*scale,p[2]),new Quaternion().setFromAxisAngle(new Vector3(1,0,0),-Math.PI/2),new Vector3(scale,scale,scale));
  const reader=new MechanismActorBounds();reader.bind('authorized-target',body);const actor=reader.captureParts('authorized-target',world)!;assert.ok(actor);
  const asset=await fixtureAsset(DISPLAY_URLS.punch),model=createDisplayMechanism('punch',asset.scene,asset.animations[0],low);assert.ok('directional'in model&&model.directional);const rig=model.directional,plan=rig.plan(placement.matrix,actor,[actor]);
  assert.equal(plan.mode,'directed',`${placement.anchor.id}/${compact}/${low}/${role}`);assert.ok(plan.clearance>=.10);
  rig.sample(plan,.08);const from=rig.surface().applyMatrix4(placement.matrix);rig.sample(plan,.22);const to=rig.surface().applyMatrix4(placement.matrix);
  assert.ok(to.distanceTo(actor.bounds.getCenter(new Vector3()))<from.distanceTo(actor.bounds.getCenter(new Vector3())));
  assert.ok(Math.abs(from.distanceTo(to)-(plan.pressurePulse?.25:.35))<1e-7,'substantial stroke and shared .22 release');model.dispose();
 }
});
