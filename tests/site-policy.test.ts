import test from 'node:test';
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import { Store } from '../src/server/store.js';
import { Rooms } from '../src/server/rooms.js';
import { createApplication } from '../src/server/index.js';
import { SITE_NICKNAMES, assignFixedNickname, CN_COMMUNICATION_DISABLED, CN_NICKNAME_FIXED, migrateCnRoom, readSiteEdition, validateSiteRegistry, validateCnLegacyDisplay } from '../src/shared/site-policy.js';

test('CN fixed library has 32 stable IDs; overflow uses a separate badge',()=>{
  assert.equal(SITE_NICKNAMES.length,32);assert.equal(new Set(SITE_NICKNAMES.map(n=>n.id)).size,32);
  const occupied=SITE_NICKNAMES.map(n=>({name:n.name,nicknameId:n.id,nicknameBadge:0}));
  const extra=assignFixedNickname(occupied,SITE_NICKNAMES[0]!.id);assert.equal(extra.name,'追风');assert.equal(extra.nicknameBadge,1);
  assert.throws(()=>validateCnLegacyDisplay({racers:[{characterId:'任意自由文字'}]}),/无效角色/);assert.throws(()=>validateCnLegacyDisplay({players:[{score:'任意自由文字'}]}),/无效数值/);
  assert.throws(()=>validateSiteRegistry(JSON.stringify({siteEdition:'global',backends:[]}), 'cn','socketio'),/SITE_EDITION/);
  assert.throws(()=>readSiteEdition(undefined,true),/SITE_EDITION/);assert.throws(()=>readSiteEdition('open'),/SITE_EDITION/);
});

test('CN allocation includes bots, spectators and disconnected seats; preserves IDs and RNG',()=>{
  const store=new Store(':memory:'),rooms=new Rooms(store,0,Date.now,'cn');
  try{
    assert.throws(()=>rooms.create('自由名字',8),new RegExp(CN_NICKNAME_FIXED));
    assert.throws(()=>rooms.create('自由名字',8,0,'multiplayer',0,'original',undefined,undefined,'athlete-01'),new RegExp(CN_NICKNAME_FIXED));
    const host=rooms.create('追风',8,0,'multiplayer',0,'original',undefined,undefined,'athlete-01'),code=host.identity.roomCode;
    const viewer=rooms.join(code,'追风','spectator','athlete-01'),guest=rooms.join(code,'追风','player','athlete-01');
    assert.equal(host.room.players[0]!.name,'追风');
    assert.equal(new Set([...guest.room.players,...guest.room.spectators!].map(p=>p.nicknameId)).size,3);
    const room=rooms.get(code),before=structuredClone(room.game.randomStream??room.game.rngState),version=room.version;
    for(const input of [{clientMessageId:'x',text:'secret'},{clientMessageId:'x',phraseId:'hello'},{clientMessageId:'x',emojiId:'smile'}])assert.deepEqual(rooms.chat(code,guest.identity.playerId,input),{ok:false,error:CN_COMMUNICATION_DISABLED});
    assert.deepEqual(rooms.rename(code,guest.identity.playerId,'old','free'),{ok:false,error:CN_NICKNAME_FIXED});
    assert.deepEqual(room.game.randomStream??room.game.rngState,before);assert.equal(room.version,version);
    const recovered=new Rooms(store,0,Date.now,'cn');assert.equal(recovered.authenticate(viewer.identity).spectators![0]!.name,viewer.room.spectators![0]!.name);
    const bots=rooms.create('追风',8,0,'ai',7);assert.equal(new Set(bots.room.players.map(p=>p.nicknameId)).size,8);assert(bots.room.players.every(p=>SITE_NICKNAMES.some(n=>n.name===p.name)));
    const fixed=bots.room.players.map(p=>p.nicknameId),raw=rooms.get(bots.identity.roomCode);raw.game.phase='finished';
    assert.equal(rooms.act(raw.code,bots.identity.playerId,{actionId:crypto.randomUUID(),expectedVersion:raw.version,action:{type:'rematch'}}).ok,true);
    assert.deepEqual(rooms.get(raw.code).game.players.map(p=>p.nicknameId),fixed);
  }finally{store.close();}
});

test('CN restores old saves and creation receipts without exposing names, chat or historical aliases',()=>{
  const store=new Store(':memory:'),old=new Rooms(store,0),requestId=crypto.randomUUID();
  try{
    const created=old.create('旧自由名字',8,0,'multiplayer',0,'original',undefined,requestId),code=created.identity.roomCode;
    old.chat(code,created.identity.playerId,{clientMessageId:'old-success',text:'旧自由聊天'});
    const original=old.get(code);delete original.siteEdition;original.game.logs=[{id:1,type:'score',text:'更早的自由昵称得分',faces:[3]}];original.game.pending={id:'old-choice',playerId:created.identity.playerId,kind:'suckerfish',title:'更早别名发起技能',options:[{id:'yes',label:'更早别名同意'}],optional:false,context:{}};store.save(original);
    const cards=structuredClone(original.game.players.map(p=>({id:p.id,hand:p.hand,score:p.score}))),rng=structuredClone(original.game.randomStream??original.game.rngState),version=original.version;
    const cn=new Rooms(store,0,Date.now,'cn'),room=cn.authenticate(created.identity);
    assert.deepEqual(room.game.players.map(p=>({id:p.id,hand:p.hand,score:p.score})),cards);assert.deepEqual(room.game.randomStream??room.game.rngState,rng);assert.equal(room.version,version);
    assert.equal(room.chat!.messages.length,0);assert.deepEqual(room.game.logs[0]!.faces,[3]);assert(!JSON.stringify(cn.view(room,created.identity.playerId)).includes('自由'));assert(!JSON.stringify(cn.view(room,created.identity.playerId)).includes('更早别名'));assert.equal(room.game.pending!.options[0]!.label,'是');
    assert.equal(cn.chat(code,created.identity.playerId,{clientMessageId:'old-success',text:'旧自由聊天'}).ok,false);
    const retried=cn.create('旧自由名字',8,0,'multiplayer',0,'original',undefined,requestId);assert.deepEqual(retried.identity,created.identity);assert(!JSON.stringify(retried.room).includes('自由'));
    // Legitimate old fixed-library requests can replay, with the current safe projection.
    const fixed=old.create('冲线',8,0,'multiplayer',0,'original',undefined,crypto.randomUUID());
    delete old.get(fixed.identity.roomCode).siteEdition;store.save(old.get(fixed.identity.roomCode));
    assert.equal(new Rooms(store,0,Date.now,'cn').authenticate(created.identity).game.players[0]!.nicknameId,room.game.players[0]!.nicknameId);
  }finally{store.close();}
});

test('CN real HTTP/socket boundary rejects publication before receipts and client policy overrides',async()=>{
  const previous=process.env.SITE_EDITION;process.env.SITE_EDITION='cn';let app:ReturnType<typeof createApplication>;
  try{app=createApplication(':memory:');}finally{if(previous===undefined)delete process.env.SITE_EDITION;else process.env.SITE_EDITION=previous;}
  await new Promise<void>(resolve=>app.http.listen(0,'127.0.0.1',resolve));const address=app.http.address();assert(address&&typeof address==='object');const origin=`http://127.0.0.1:${address.port}`;
  const post=(body:unknown)=>fetch(origin+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const socket=io(origin,{autoConnect:false,transports:['websocket'],reconnection:false});
  try{
    assert.equal((await post({name:'evil',siteEdition:'global'})).status,400);assert.equal((await post({name:'evil'})).status,400);
    const response=await post({name:'追风',nicknameId:'athlete-01'});assert.equal(response.status,201);const created=await response.json() as any;
    socket.auth=created.identity;const snapshot=new Promise<any>(resolve=>socket.once('snapshot',resolve));socket.connect();assert.deepEqual((await snapshot).chat,[]);
    const request=(event:string,input:unknown)=>new Promise<any>((resolve,reject)=>socket.timeout(3000).emit(event,input,(error:unknown,result:unknown)=>error?reject(error):resolve(result)));
    for(const [event,input] of [['chat-send',{clientMessageId:'old-success',text:'secret'}],['chat-send',{phraseId:'greeting'}],['emoji-send',{emojiId:'smile'}],['phrase-send',{phraseId:'greeting'}]] as const)assert.equal((await request(event,input)).error,CN_COMMUNICATION_DISABLED);
    assert.deepEqual((await request('chat-sync',{afterId:0})).messages,[]);
    assert.equal((await request('rename',{requestId:'rename',name:'evil'})).error,CN_NICKNAME_FIXED);
    assert.equal((await fetch(origin+'/api/security/health').then(r=>r.json()) as any).enabled,false);
    assert.equal(app.store.security.list().length,0);
    assert.equal((await fetch(origin+'/api/stationmaster/logs')).status,404);
    const registry=await (await fetch(origin+'/backends.json?siteEdition=global')).json() as any;assert.equal(registry.siteEdition,'cn');assert.equal(registry.backends.length,1);assert.equal(registry.backends[0].id,'aliyun');
  }finally{socket.disconnect();await app.close();}
});
