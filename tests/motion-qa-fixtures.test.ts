import test from 'node:test';
import assert from 'node:assert/strict';
import {CHARACTERS} from '../src/shared/characters.js';
import {mechanismActions} from '../src/client/scene/mechanisms/events.js';
import {ALL_MOTION_CASES,MOTION_ACTORS,motionFixture} from '../qa/motion-fixtures.js';
test('every character projects the same confirmed legal tile event without an identity allowlist',()=>{
 assert.equal(ALL_MOTION_CASES.length,54);
 for(const scenario of ALL_MOTION_CASES){const fixture=motionFixture(scenario.id,'banana'),expected=mechanismActions(fixture.room.track,fixture.beat,fixture.racers);
  assert.ok(expected.length>0,scenario.id);
  for(const character of CHARACTERS){const racers=fixture.racers.map(r=>({...r,characterId:character.id}));
   assert.deepEqual(mechanismActions(fixture.room.track,fixture.beat,racers),expected,`${character.id} ${scenario.id}`);
  }
 }
});
test('the eight representative assets generate all 54 events through actual engine board resolution',()=>{
 for(const actor of MOTION_ACTORS)for(const scenario of ALL_MOTION_CASES){const f=motionFixture(scenario.id,actor.label);assert.ok(mechanismActions(f.room.track,f.beat,f.racers).some(a=>a.anchor.id===scenario.id),`${actor.label} ${scenario.id}`);}
});
test('a real new trip target does not retrigger an already-down resident',()=>{
 const f=motionFixture('wild:5','banana');const resident={...f.racers[0]!,id:'already-down',tripped:true};const racers=[...f.racers,resident],before=structuredClone(racers);
 const beat={...f.beat,targets:[...f.beat.targets,resident.id],events:f.beat.events.map(e=>({...e,targets:[...(e.targets??[]),resident.id]}))};
 const actions=mechanismActions(f.room.track,beat,racers);assert.equal(actions.length,1);assert.deepEqual(actions[0]!.targets,['r0']);assert.deepEqual(racers,before);
});
