import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { io } from 'socket.io-client';
import { createApplication } from '../src/server/index.js';
import { Store } from '../src/server/store.js';
import { Rooms } from '../src/server/rooms.js';
import { SecurityStore } from '../src/server/security-store.js';
import { networkExpiry,securityEvent,hiddenMessage,SECURITY_UNAVAILABLE } from '../src/shared/security.js';
import { CommunityFeed } from '../src/client/community.js';
import { createPlayback,receiveRoom } from '../src/client/presentation.js';
import { PresentationEventStream } from '../src/client/presentation-events.js';

test('network retention is six calendar months including month ends; audit allowlist excludes tokens and state',()=>{
  assert.equal(new Date(networkExpiry(Date.UTC(2026,7,31,8))).toISOString(),'2027-02-28T08:00:00.000Z');
  const event=securityEvent({kind:'network',operation:'auth',outcome:'accepted',token:'SECRET',cookie:'SECRET',state:{hand:['SECRET']}} as any,Date.UTC(2026,0,1));
  assert.equal(JSON.stringify(event).includes('SECRET'),false);assert.equal(event.expiresAt,Date.UTC(2026,6,1));
});

test('room closure/restart preserves independent audit and targeted evidence; holds survive expiry and release cleans in bounded batches',()=>{
  const directory=mkdtempSync(join(tmpdir(),'athlete-security-'));
  try{
    const path=join(directory,'rooms.sqlite');let store=new Store(path),rooms=new Rooms(store);
    const first=rooms.create('房主',2,0),code=first.identity.roomCode,id=first.identity.playerId;
    rooms.chat(code,id,{clientMessageId:'evidence',text:'指定处置内容'});
    const result=rooms.moderate(code,{action:'hide-chat',seq:1,reason:'测试举报'}) as {recordId:number};
    store.security.hold(result.recordId,true);assert.match(JSON.stringify(store.security.evidence(result.recordId)),/指定处置内容/);
    rooms.moderate(code,{action:'close-room',reason:'关闭测试'});assert.equal(store.db.prepare('SELECT * FROM rooms').all().length,0);
    const count=store.security.list().length;store.close();store=new Store(path);rooms=new Rooms(store);
    assert.equal(store.security.list().length,count);assert.throws(()=>rooms.get(code),/已关闭/);
    (store.security as any).now=()=>Date.UTC(2030,0,1);store.security.cleanup(1);assert.equal(store.security.list().length,count-1);
    for(let i=0;i<20;i++)store.security.cleanup(2);
    assert.equal(store.security.list().length,1);assert.ok(store.security.evidence(result.recordId));assert.ok(store.security.targets(code,'hidden').size);
    store.security.hold(result.recordId,false);store.security.cleanup();assert.equal(store.security.list().length,0);assert.equal(store.security.evidence(result.recordId),undefined);assert.equal(store.security.targets(code,'hidden').size,0);store.close();
  }finally{rmSync(directory,{recursive:true,force:true});}
});

test('required record write failure blocks create, chat and rename without publication or silent loss',()=>{
  const store=new Store(':memory:'),rooms=new Rooms(store);try{
    const first=rooms.create('房主',2,0,'practice'),code=first.identity.roomCode,id=first.identity.playerId;
    store.security.db.exec('PRAGMA query_only=ON');
    assert.throws(()=>rooms.create('未发布房',2,0),new RegExp(SECURITY_UNAVAILABLE));
    assert.equal(rooms.chat(code,id,{clientMessageId:'blocked',text:'不能发布'}).ok,false);
    assert.equal(rooms.rename(code,id,'rename','不能改名').ok,false);
    assert.equal(rooms.get(code).chat?.messages.length??0,0);assert.equal(rooms.get(code).game.players[0]!.name,'房主');assert.equal(store.security.status().ok,false);
  }finally{store.close();}
});

test('SQLite expired-page reuse permits new writes below a logical cap without VACUUM',()=>{
  const directory=mkdtempSync(join(tmpdir(),'athlete-security-space-')),prior=process.env.SECURITY_MAX_BYTES;
  let ledger:SecurityStore|undefined;
  try{
    process.env.SECURITY_MAX_BYTES='1048576';let now=Date.UTC(2020,0,1);ledger=new SecurityStore(join(directory,'security.sqlite'),()=>now);
    let count=0;for(;count<20000;count++){try{ledger.append({kind:'network',operation:'request',outcome:'accepted',ip:'2001:db8::1',reason:'a'.repeat(200)});}catch{break;}}
    assert.ok(count>100);assert.ok(count<20000);const before=statSync(ledger.path).size;now=Date.UTC(2027,0,1);
    for(let i=0;i<Math.ceil(count/500)+1;i++)ledger.cleanup(500);
    assert.equal(ledger.list().length,0);assert.ok(statSync(ledger.path).size>=before,'DELETE does not promise file shrinkage');
    assert.doesNotThrow(()=>ledger!.append({kind:'network',operation:'request',outcome:'accepted'}));assert.equal(ledger.status().ok,true);
  }finally{ledger?.close();if(prior===undefined)delete process.env.SECURITY_MAX_BYTES;else process.env.SECURITY_MAX_BYTES=prior;rmSync(directory,{recursive:true,force:true});}
});

test('stationmaster bearer is independent of owner credentials; hide applies online, duplicate sends, reconnect, restart and member restrictions',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'athlete-moderation-')),prior=process.env.SECURITY_ADMIN_TOKEN;process.env.SECURITY_ADMIN_TOKEN='test_admin_secret_0123456789_ABCDEF';
  let app=createApplication(join(directory,'rooms.sqlite'));const sockets:ReturnType<typeof io>[]=[];
  const listen=async()=>{await new Promise<void>(done=>app.http.listen(0,'127.0.0.1',done));return 'http://127.0.0.1:'+(app.http.address() as {port:number}).port;};
  try{
    let origin=await listen();const first=app.rooms.create('房主',2,0),code=first.identity.roomCode,id=first.identity.playerId;
    const socket=io(origin,{auth:first.identity,reconnection:false});sockets.push(socket);await new Promise<void>((done,fail)=>{socket.once('connect',done);socket.once('connect_error',fail);});
    const send=()=>new Promise<any>(done=>socket.emit('chat-send',{clientMessageId:'stable',text:'需隐藏的原文'},done));assert.equal((await send()).ok,true);
    const moderate=(input:unknown,token=process.env.SECURITY_ADMIN_TOKEN)=>fetch(origin+'/api/stationmaster/rooms/'+code,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(input)});
    assert.equal((await moderate({action:'inspect'},first.identity.token)).status,401);
    assert.equal((await moderate({action:'inspect'},'short')).status,401);
    const changed=new Promise<any>(done=>socket.once('snapshot',done));
    assert.equal((await moderate({action:'hide-chat',seq:1,reason:'举报定位'})).status,200);const view=await changed;assert.equal(view.chat[0].hidden,true);assert.equal(JSON.stringify(view.chat).includes('需隐藏的原文'),false);
    assert.equal((await send()).ok,false);assert.equal((await moderate({action:'hide-chat',seq:999,reason:'不存在'})).status,400);
    assert.equal((await moderate({action:'restrict-member',memberId:id,reason:'重复滥用'})).status,200);
    const blocked=await new Promise<any>(done=>socket.emit('chat-send',{clientMessageId:'new',text:'限制后发布'},done));assert.equal(blocked.ok,false);
    socket.disconnect();await app.close();app=createApplication(join(directory,'rooms.sqlite'));origin=await listen();
    assert.equal(app.rooms.view(app.rooms.authenticate(first.identity),id).chat![0]!.hidden,true);
    assert.equal(app.rooms.chat(code,id,{clientMessageId:'stable',text:'需隐藏的原文'}).ok,false);
    assert.equal(app.rooms.chat(code,id,{clientMessageId:'new-2',text:'重启后发布'}).ok,false);
    assert.equal((await moderate({action:'close-room',reason:'人工关闭'})).status,200);assert.ok(app.rooms.closed(code));
    const health=await fetch(origin+'/api/security/health');assert.equal((await health.json()).ok,true);
  }finally{for(const socket of sockets)socket.disconnect();await app.close();if(prior===undefined)delete process.env.SECURITY_ADMIN_TOKEN;else process.env.SECURITY_ADMIN_TOKEN=prior;rmSync(directory,{recursive:true,force:true});}
});

test('hidden chat tombstones override delayed client replies and remove cached live notices',()=>{
  const feed=new CommunityFeed();let state:any;feed.subscribe(value=>state=value);const message={id:1,senderId:'p',senderName:'原昵称',text:'原文',sentAt:1,kind:'player' as const};
  feed.update({connected:true});feed.update({messages:[]},'history');feed.update({messages:[message]},'live');assert.equal(state.liveMessages.length,1);
  feed.update({messages:[hiddenMessage(message)]},'history');feed.update({messages:[message]},'update');assert.equal(state.messages[0].hidden,true);assert.equal(state.liveMessages.length,0);assert.equal(JSON.stringify(state).includes('原文'),false);
});

test('moderation revisions cannot roll back through old snapshots, animation pages or nickname acknowledgements',()=>{
  const store=new Store(':memory:'),rooms=new Rooms(store);try{
    const first=rooms.create('原昵称',2,0,'practice'),raw={...first.room,version:2,contentRevision:0,logs:[{id:1,type:'power',text:'原昵称的历史事件'}]};
    const moderated={...raw,version:3,contentRevision:1,players:raw.players.map(player=>({...player,name:'成员已处理'})),logs:raw.logs.map(event=>({...event,text:'[已处理]'}))};
    const playback=receiveRoom(createPlayback(raw),moderated);assert.equal(receiveRoom(playback,{...raw,version:999}),playback);assert.equal(playback.queue.length,0);assert.equal(JSON.stringify(playback.confirmed).includes('原昵称'),false);
    const stream=new PresentationEventStream();stream.receive(raw);const oldGeneration=stream.generation;stream.receive(moderated);assert.deepEqual(stream.receive({...raw,version:999}),{});assert.deepEqual(stream.accept({afterId:0,latestId:1,events:raw.logs},oldGeneration),{});
    const feed=new CommunityFeed();let state:any;feed.subscribe(value=>state=value);feed.update({contentRevision:1,name:'成员已处理',messages:[{id:1,text:'内容',senderName:'成员已处理',senderId:'id',kind:'player',sentAt:1,moderated:true}]});feed.update({name:'原昵称'});feed.update({contentRevision:0,name:'原昵称'});feed.update({messages:[{id:1,text:'内容',senderName:'原昵称',senderId:'id',kind:'player',sentAt:1}]});assert.equal(JSON.stringify(state).includes('原昵称'),false);
  }finally{store.close();}
});

test('nickname reset suppresses old chat receipts and creation receipts after restart; future game logs remain readable',()=>{
  const directory=mkdtempSync(join(tmpdir(),'athlete-name-moderation-'));let store=new Store(join(directory,'rooms.sqlite'));try{
    let rooms=new Rooms(store);const requestId=crypto.randomUUID(),first=rooms.create('指定原昵称',2,0,'practice',3,'original',undefined,requestId),code=first.identity.roomCode,id=first.identity.playerId;
    rooms.get(code).game.logs.push({id:1,type:'power',text:'指定原昵称历史'});rooms.chat(code,id,{clientMessageId:'old-name',text:'普通内容'});
    rooms.moderate(code,{action:'reset-name',memberId:id,reason:'昵称举报'});assert.equal(rooms.chat(code,id,{clientMessageId:'old-name',text:'普通内容'}).ok,false);
    assert.equal(JSON.stringify(rooms.create('指定原昵称',2,0,'practice',3,'original',undefined,requestId).room).includes('指定原昵称'),false);
    rooms.get(code).game.logs.push({id:2,type:'power',text:'后续正常游戏记录'});store.save(rooms.get(code));store.close();store=new Store(join(directory,'rooms.sqlite'));rooms=new Rooms(store);
    assert.equal(rooms.chat(code,id,{clientMessageId:'old-name',text:'普通内容'}).ok,false);assert.equal(rooms.view(rooms.authenticate(first.identity),id).logs.at(-1)!.text,'后续正常游戏记录');
  }finally{store.close();rmSync(directory,{recursive:true,force:true});}
});

test('holding a record atomically retains its reason until release without extending the original expiry',()=>{
  let now=Date.UTC(2026,0,1);const ledger=new SecurityStore(':memory:',()=>now);try{
    const id=ledger.disposition('ABC234','hidden','1','初始处置',{text:'指定证据'});ledger.hold(id,true,'继续保全的原因');const reason=ledger.list().find(row=>String(row.event).includes('继续保全的原因'))!;const originalExpiry=reason.expires_at;
    now+=120*86400000;ledger.cleanup();assert.equal(ledger.list().length,2);assert.equal(ledger.list().find(row=>row.id===reason.id)!.expires_at,originalExpiry);
    ledger.hold(id,false,'已核实可以解除');ledger.cleanup();assert.equal(ledger.list().length,1);assert.match(String(ledger.list()[0]!.event),/已核实可以解除/);
  }finally{ledger.close();}
});

test('committed admin closure stays effective when room cleanup fails, and socket storage errors do not crash the service',async()=>{
  const app=createApplication(':memory:');await new Promise<void>(done=>app.http.listen(0,'127.0.0.1',done));const origin='http://127.0.0.1:'+(app.http.address() as {port:number}).port;
  const first=app.rooms.create('房主',2,0);const socket=io(origin,{auth:first.identity,reconnection:false});await new Promise<void>((done,fail)=>{socket.once('connect',done);socket.once('connect_error',fail);});
  try{
    const closeRoom=app.store.closeRoom;app.store.closeRoom=()=>{throw Error('simulated room SQLite failure');};
    const notice=new Promise<void>(done=>socket.once('room-closed',()=>done()));app.rooms.moderate(first.identity.roomCode,{action:'close-room',reason:'故障时关闭'});await notice;assert.ok(app.rooms.closed(first.identity.roomCode));assert.throws(()=>app.rooms.get(first.identity.roomCode));app.store.closeRoom=closeRoom;
    const other=app.rooms.create('另一个房主',2,0),peer=io(origin,{auth:other.identity,reconnection:false});await new Promise<void>((done,fail)=>{peer.once('connect',done);peer.once('connect_error',fail);});
    app.store.security.db.exec('PRAGMA query_only=ON');const room=app.rooms.get(other.identity.roomCode);room.hostLeftAt=Date.now()-3600000;room.game.phase='finished';peer.emit('sync');peer.disconnect();await new Promise(done=>setTimeout(done,50));
    assert.equal((await fetch(origin+'/api/health')).status,200);assert.equal((await fetch(origin+'/api/security/health')).status,503);app.store.security.db.exec('PRAGMA query_only=OFF');
  }finally{socket.disconnect();await app.close();}
});
