import test from 'node:test';
import assert from 'node:assert/strict';
import { DOWN_MOTION_CASES, downMotionFixture } from '../qa/down-motion-fixtures.js';
import { pawnOccupancy } from '../src/client/scene/camera.js';
import { mechanismActions, isTrackPath } from '../src/client/scene/mechanisms/events.js';

for(const residentParty of [false,true])for(const scenario of DOWN_MOTION_CASES)for(const actor of ['banana','hotel'])test(`already-down ${actor} legally triggers ${scenario.id} (${residentParty?'shared':'solo'})`,()=>{
 const fixture=downMotionFixture(scenario.id,actor,{residentParty});
 assert.equal(fixture.racers.filter(r=>r.position===scenario.node).length,residentParty?2:1);
 for(const compact of [false,true])assert.equal(pawnOccupancy(fixture.racers.find(r=>r.id==='r0')!,fixture.racers,scenario.node,compact,scenario.track).scale,residentParty?1.14:1.65);
 assert.equal(fixture.initialRacers.find(r=>r.id==='r0')!.tripped,true);
 assert.equal(fixture.initialRacers.find(r=>r.id==='r0')!.position,scenario.from);
 assert.equal(fixture.racers.find(r=>r.id==='r0')!.tripped,true);
 assert.equal(fixture.racers.find(r=>r.id==='r0')!.position,scenario.node);
 assert.equal(fixture.room.racers.find(r=>r.id==='r0')!.tripped,true);
 assert.ok(!fixture.events.some(event=>event.type==='recover'&&event.source==='r0'));
 const forced=fixture.events.find(event=>event.type==='move'&&event.cause==='party-animal');
 assert.ok(forced);assert.deepEqual(forced.targets,['r0']);
 assert.deepEqual(forced.before,[scenario.from]);assert.deepEqual(forced.after,[scenario.node]);
 const action=mechanismActions(scenario.track,fixture.beat,fixture.racers).find(action=>action.anchor.id===scenario.id);
 assert.ok(action);assert.deepEqual(action.targets,['r0']);assert.equal(action.anchor.kind,scenario.kind);
 if(scenario.kind==='punch'){
  assert.deepEqual(action.motions[0]!.path,[...scenario.path]);assert.ok(isTrackPath(scenario.track,action.motions[0]!.path));
  assert.equal(fixture.room.racers.find(r=>r.id==='r0')!.position,scenario.path.at(-1));
 }else{
  assert.equal(action.scoreDelta,1);
  const score=fixture.events.find(event=>event.id===action.eventId)!;
  assert.equal(score.cause,'track-star');assert.equal(score.boardPosition,scenario.node);
 }
});
