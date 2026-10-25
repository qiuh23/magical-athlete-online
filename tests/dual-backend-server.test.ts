import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { io, type Socket } from 'socket.io-client';
import { createApplication } from '../src/server/index.js';
import { Store } from '../src/server/store.js';
import { Rooms } from '../src/server/rooms.js';
import { connectivityInfo, multiplayerQuota, trustedOrigins } from '../src/shared/backend-protocol.js';

function socketEvent<T>(socket:Socket,event:string):Promise<T>{return new Promise((resolve,reject)=>{const listener=(value:T)=>{clearTimeout(timeout);resolve(value);};const timeout=setTimeout(()=>{socket.off(event,listener);reject(Error(`Socket event ${event} timed out`));},3000);socket.once(event,listener);});}

test('deployment quotas cap each dual backend at 15 and validate explicit overrides',()=>{
  assert.equal(multiplayerQuota(false),30);assert.equal(multiplayerQuota(true),15);
  assert.equal(multiplayerQuota(true,'0'),0);assert.equal(multiplayerQuota(false,'15'),15);
  assert.throws(()=>multiplayerQuota(true,'30'));assert.throws(()=>multiplayerQuota(true,'-1'));assert.throws(()=>multiplayerQuota(true,'1.5'));
  assert.deepEqual(trustedOrigins('https://game.example.cn,https://example.workers.dev'),['https://game.example.cn','https://example.workers.dev']);
  assert.throws(()=>trustedOrigins('https://game.example.cn/anything'));assert.throws(()=>trustedOrigins('*'));
});

test('reducing quota preserves existing rooms; creation receipts survive restart and quota exhaustion',()=>{
  const directory=mkdtempSync(join(tmpdir(),'athlete-dual-')),path=join(directory,'rooms.sqlite');
  let store=new Store(path,30);
  try{
    let rooms=new Rooms(store,0);const requestId=crypto.randomUUID();
    const first=rooms.create('原房主',2,0,'multiplayer',3,'original',undefined,requestId);
    for(let index=1;index<16;index++)rooms.create(`房主${index}`,2);
    store.close();store=new Store(path,15);rooms=new Rooms(store,0);
    assert.equal(rooms.capacity().used,16);assert.equal(rooms.capacity().limit,15);
    assert.equal(rooms.authenticate(first.identity).code,first.identity.roomCode);
    assert.equal(JSON.stringify(rooms.create('原房主',2,0,'multiplayer',3,'original',undefined,requestId)),JSON.stringify(first));
    assert.throws(()=>rooms.create('新房',2),/实时对战房间已满/);
    rooms.create('练习',2,0,'practice');rooms.create('人机',2,0,'ai',1);
    assert.equal(rooms.capacity().used,16);
  }finally{store.close();rmSync(directory,{recursive:true,force:true});}
});

test('Node lightweight HTTP/realtime probes, CORS, private launch gate and authenticated recovery',async()=>{
  const keys=['BACKEND_ID','NODE_ENV','PUBLIC_ORIGIN','PUBLIC_ORIGINS','PUBLIC_ACCESS_ENABLED','CONTROLLED_VALIDATION','HOST','BACKENDS_CONFIG_JSON'];
  const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  Object.assign(process.env,{BACKEND_ID:'aliyun',NODE_ENV:'production',PUBLIC_ORIGIN:'https://game.example.cn',PUBLIC_ORIGINS:'https://example.workers.dev',PUBLIC_ACCESS_ENABLED:'false',CONTROLLED_VALIDATION:'false'});
  delete process.env.BACKENDS_CONFIG_JSON;
  const application=createApplication(':memory:');application.http.listen(0,'127.0.0.1');await once(application.http,'listening');
  const origin=`http://127.0.0.1:${(application.http.address() as {port:number}).port}`;
  try{
    const response=await fetch(origin+'/api/connectivity',{headers:{Origin:'https://example.workers.dev'}});
    assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://example.workers.dev');assert.deepEqual(await response.json(),connectivityInfo('aliyun'));
    const preflight=await fetch(origin+'/api/rooms',{method:'OPTIONS',headers:{Origin:'https://example.workers.dev','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'Content-Type'}});
    assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Headers'),'Content-Type');
    assert.equal((await fetch(origin+'/api/connectivity',{headers:{Origin:'https://evil.example'}})).status,403);
    const health=await (await fetch(origin+'/api/health')).json() as {publicAccessEnabled:boolean;controlledValidation:boolean};assert.equal(health.publicAccessEnabled,false);assert.equal(health.controlledValidation,false);
    assert.equal((await fetch(origin+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'公开拒绝',maxPlayers:2})})).status,503);
    const probe=io(origin,{auth:{probe:true},transports:['websocket'],reconnection:false,extraHeaders:{Origin:'https://example.workers.dev'}});
    try{const reply=await socketEvent(probe,'connectivity');assert.deepEqual(reply,connectivityInfo('aliyun'));}finally{probe.disconnect();}
    assert.equal(application.rooms.rooms.size,0);assert.equal(application.rooms.capacity().used,0);
    const host=application.rooms.create('受控凭据',2),blocked=io(origin,{auth:host.identity,transports:['websocket'],reconnection:false});
    try{const error=await socketEvent<Error>(blocked,'connect_error');assert.match(error.message,/尚未开放/);}finally{blocked.disconnect();}
    assert.equal(application.rooms.capacity().limit,15);
  }finally{await application.close();for(const key of keys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}}
});

test('controlled validation accepts loopback rooms while reporting public access closed',async()=>{
  const keys=['NODE_ENV','HOST','CONTROLLED_VALIDATION','PUBLIC_ACCESS_ENABLED'],previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  Object.assign(process.env,{NODE_ENV:'production',HOST:'127.0.0.1',CONTROLLED_VALIDATION:'true',PUBLIC_ACCESS_ENABLED:'false'});
  const application=createApplication(':memory:');application.http.listen(0,'127.0.0.1');await once(application.http,'listening');
  const origin=`http://127.0.0.1:${(application.http.address() as {port:number}).port}`;
  try{const health=await(await fetch(origin+'/api/health')).json() as {publicAccessEnabled:boolean;controlledValidation:boolean};assert.equal(health.publicAccessEnabled,false);assert.equal(health.controlledValidation,true);const response=await fetch(origin+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:3341'},body:JSON.stringify({name:'受控验证',maxPlayers:2})});assert.equal(response.status,201);}
  finally{await application.close();for(const key of keys){if(previous[key]===undefined)delete process.env[key];else process.env[key]=previous[key];}}
});

test('Node idempotent HTTP create and restart restore identity, chat and room state',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'athlete-restart-')),path=join(directory,'rooms.sqlite');
  let application=createApplication(path);
  const listen=async()=>{application.http.listen(0,'127.0.0.1');await once(application.http,'listening');return `http://127.0.0.1:${(application.http.address() as {port:number}).port}`;};
  try{
    let origin=await listen();const payload={name:'房主',maxPlayers:2,requestId:crypto.randomUUID()};
    const create=async()=>{const response=await fetch(origin+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});assert.equal(response.status,201);return await response.json() as ReturnType<Rooms['create']>;};
    const first=await create(),retry=await create();assert.deepEqual(retry,first);assert.equal(application.rooms.capacity().used,1);
    const chat=application.rooms.chat(first.identity.roomCode,first.identity.playerId,{clientMessageId:crypto.randomUUID(),text:'重启后保留'});assert(chat.ok);
    await application.close();application=createApplication(path);origin=await listen();
    const resumed=await fetch(origin+`/api/rooms/${first.identity.roomCode}/resume-status`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(first.identity)});assert.equal(resumed.status,200);
    assert.equal((await create()).identity.playerId,first.identity.playerId);assert.equal(application.rooms.capacity().used,1);
    const room=application.rooms.authenticate(first.identity);assert(application.rooms.view(room,first.identity.playerId).chat?.some(message=>message.text==='重启后保留'));
  }finally{await application.close();rmSync(directory,{recursive:true,force:true});}
});
