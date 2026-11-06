import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplication } from '../src/server/index.js';
import { connectRoom,enterRoom,forgetIdentity,listRoomDirectory,readIdentity,readPendingCreation,readRouteIdentity,saveIdentity,wireIdentity } from '../src/client/network.js';
import { loadBackends } from '../src/client/backends.js';
import type { Identity, RoomView } from '../src/shared/types.js';
class MemoryStorage {values=new Map<string,string>();get length(){return this.values.size;}getItem(key:string){return this.values.get(key)??null;}setItem(key:string,value:string){this.values.set(key,String(value));}removeItem(key:string){this.values.delete(key);}clear(){this.values.clear();}key(index:number){return [...this.values.keys()][index]??null;}}

test('same-site legacy credentials, uncertain creation retry and reconnect stay on the current API',async()=>{
 const local=new MemoryStorage(),session=new MemoryStorage();
 Object.defineProperty(globalThis,'localStorage',{value:local,configurable:true});Object.defineProperty(globalThis,'sessionStorage',{value:session,configurable:true});
 const old=process.env.BACKEND_ID,oldEdition=process.env.SITE_EDITION;
 process.env.BACKEND_ID='cloudflare';process.env.SITE_EDITION='global';const app=createApplication(':memory:');
 if(old===undefined)delete process.env.BACKEND_ID;else process.env.BACKEND_ID=old;if(oldEdition===undefined)delete process.env.SITE_EDITION;else process.env.SITE_EDITION=oldEdition;
 await new Promise<void>(resolve=>app.http.listen(0,'127.0.0.1',resolve));
 const address=app.http.address();assert(address&&typeof address==='object');const origin=`http://127.0.0.1:${address.port}`;
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'location');Object.defineProperty(globalThis,'location',{value:{origin,pathname:'/',search:'?server=aliyun'},configurable:true});
 const native=globalThis.fetch;let loseReply=true;const requests:{url:string;body:string}[]=[];
 globalThis.fetch=async(input,init)=>{
  if(String(input)==='/backends.json')return new Response(JSON.stringify({siteEdition:'global',backends:[{id:'cloudflare',origin:'',transport:'socketio',enabled:true}]}));
  if(init?.method==='POST')requests.push({url:String(input),body:String(init.body)});
  const response=await native(input,init);if(loseReply&&init?.method==='POST'){loseReply=false;throw Error('lost acknowledgement');}return response;
 };
 try{
  await loadBackends(true);
  const identity:Identity={roomCode:'ABC234',playerId:'original',token:'credential',backendId:'cloudflare'};
  local.setItem('magical-athlete:identity:ABC234',JSON.stringify(identity));
  assert.equal(readRouteIdentity('ABC234')?.token,'credential');
  const foreign={...identity,backendId:'aliyun' as const,playerId:'foreign'};saveIdentity(foreign);
  assert.equal(readIdentity('A-ABC234'),null);assert.equal(readRouteIdentity('A-ABC234'),null);
  assert.equal(readRouteIdentity('ABC234')?.token,'credential');
  assert.deepEqual(wireIdentity(identity),{roomCode:'ABC234',playerId:'original',token:'credential'});
  forgetIdentity('ABC234',identity);
  await assert.rejects(enterRoom('A-ABC234',{name:'海外自定义名'}),/此邀请不属于当前站点/);
  await assert.rejects(enterRoom(null,{name:'海外自定义名',backendId:'aliyun'}),/此邀请不属于当前站点/);
  assert.equal(requests.length,0);
  const result=await enterRoom(null,{name:'海外自定义名',maxPlayers:2,timeoutSeconds:0});
  assert.equal(requests.length,2);assert.deepEqual(requests[0],requests[1]);assert.ok(requests[0]!.url.startsWith(origin));assert.equal(readPendingCreation(),null);
  assert.equal(result.room.players[0]!.name,'海外自定义名');
  const joined=await enterRoom(result.room.code,{name:'同站旧码来客'});assert.equal(joined.room.players.length,2);
  const directory=await listRoomDirectory();assert.equal(directory.backends?.length,1);
  const snapshot=await new Promise<RoomView>((resolve,reject)=>{const timer=setTimeout(()=>{client.disconnect();reject(Error('reconnect timeout'));},5000);const client=connectRoom(result.identity,room=>{clearTimeout(timer);client.disconnect();resolve(room);},()=>{});});
  assert.equal(snapshot.code,result.room.code);assert.equal(snapshot.players[0]!.name,'海外自定义名');assert.ok(requests.every(row=>row.url.startsWith(origin)));
 }finally{globalThis.fetch=native;if(descriptor)Object.defineProperty(globalThis,'location',descriptor);else Reflect.deleteProperty(globalThis,'location');await app.close();}
});
