import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import {GuardedCertifiedTripController,GuardedPunchController,GuardedTripController} from '../src/client/scene/mechanisms/runtime-entry-guards.js';
import {TRIP_CERTIFICATES} from '../src/client/scene/mechanisms/certified-trip.js';
import {createPlayback,receiveRoom} from '../src/client/presentation.js';import type {Racer,RoomView,GameEvent} from '../src/shared/types.js';
Object.assign(globalThis,{window:{location:{search:'?environment=0&mechanisms=1'}}});
const racer=(id:string,position:number,tripped=false):Racer=>({id,playerId:id,characterId:'banana',position,tripped,finished:false,eliminated:false,flags:{}});
function queue(racers:Racer[],events:GameEvent[]){const room={code:'GUARD',track:'wild',racers,logs:[],version:1,round:1,phase:'race',players:[],hostId:'a',selfId:'a',maxPlayers:8,timeoutSeconds:0,deadline:null,results:[],rulesStatus:'fixture'} as RoomView;return receiveRoom(createPlayback(room),{...room,logs:events,version:2}).queue[0]!;}
test('explicit old-scene fallback cannot retain or reauthorize a same-beat retimed Trip',()=>{
 const f=TRIP_CERTIFICATES.fixtures.find(f=>f.track==='wild'&&f.node===17&&f.layout==='desktop'&&f.actor.id==='banana'&&!f.actor.mounted)!,r=racer('target',17),beat=queue([r],[{id:1,type:'trip',source:'track',targets:[r.id],text:'trip'}]);
 const c=new GuardedCertifiedTripController('fallback');c.ready=true;c.acceptActor(r.id,f.actor.runtimeGeometryFingerprint,[0,0,0,0,1.3,0]);c.enter('wild',false,beat,[r],0,0,850,true,false,false);assert.ok(c.active);c.sample(.3);const pose=c.fall(r.id,beat,.3)!.quaternion.toArray();
 c.enter('wild',false,beat,[r],255,0,212.5,true,false,false);assert.equal(c.active,undefined);c.sample(1,true);assert.deepEqual(c.fall(r.id,beat,1)!.quaternion.toArray(),pose);c.enter('wild',false,beat,[r],300,0,850,true,false,false);c.sample(300/850,true);assert.equal(c.active,undefined);assert.ok(c.protects(r.id));assert.deepEqual(c.fall(r.id,beat,.3)!.quaternion.toArray(),pose);
});
test('old Punch/Trip adapters keep held poses and down protection when same-beat timing changes',()=>{
 const p=new GuardedPunchController(),r=racer('a',23),move=queue([r],[{id:1,type:'move',targets:['a'],source:'a',before:[23],after:[24],paths:[[23,24]],text:'move'}]);p.enter('wild',move,[r],0,0,800,true);assert.ok(p.plan);p.sample(.2);const pose={...p.pose};p.enter('wild',move,[r],160,0,200,true);assert.equal(p.plan,undefined);assert.deepEqual(p.pose,pose);assert.ok(p.protects('a'));p.enter('wild',move,[r],180,0,800,true);assert.equal(p.plan,undefined);
 const racers=[racer('a',4),racer('b',5,true)],trip=new GuardedTripController(),entry=queue(racers,[{id:1,type:'move',targets:['a'],source:'a',before:[4],after:[5],paths:[[4,5]],text:'move'}]);trip.enter('wild',false,entry,racers,0,0,800,true);assert.ok(trip.plan);trip.sample(.35,false);const held={...trip.pose};trip.enter('wild',false,entry,racers,280,0,200,true);assert.equal(trip.plan,undefined);assert.ok(trip.protects('b'));assert.deepEqual(trip.pose,held);assert.equal(racers[1]!.tripped,true);trip.enter('wild',false,entry,racers,300,0,800,true);assert.equal(trip.plan,undefined);
});
test('actual Board uses timing adapters for the explicit environment-off path',()=>{
 const board=readFileSync('src/client/scene/Board3D.tsx','utf8');assert.match(board,/new GuardedCertifiedTripController\(contactScope\)/);assert.match(board,/new GuardedPunchController\(\)/);assert.match(board,/new GuardedTripController\(\)/);assert.doesNotMatch(board,/new CertifiedTripController\(/);
});
