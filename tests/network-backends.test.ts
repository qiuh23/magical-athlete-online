import test from 'node:test';
import assert from 'node:assert/strict';
import {createApplication} from '../src/server/index.js';
import {connectRoom,enterRoom,forgetClosedRoom,forgetIdentity,listRoomDirectory,ownedRoomCandidates,readClosedRoom,readIdentity,readPendingCreation,readRouteIdentity,saveIdentity,wireIdentity} from '../src/client/network.js';
import {probeBackend,loadBackends} from '../src/client/backends.js';
import type {Identity,RoomView} from '../src/shared/types.js';

class MemoryStorage {
  values=new Map<string,string>();get length(){return this.values.size;}
  getItem(key:string){return this.values.get(key)??null;}setItem(key:string,value:string){this.values.set(key,String(value));}removeItem(key:string){this.values.delete(key);}clear(){this.values.clear();}key(index:number){return [...this.values.keys()][index]??null;}
}
test('runtime routing isolates credentials and retries uncertain creation on its original backend',async t=>{
  const local=new MemoryStorage(),session=new MemoryStorage();
  Object.defineProperty(globalThis,'localStorage',{value:local,configurable:true});Object.defineProperty(globalThis,'sessionStorage',{value:session,configurable:true});
  const previousId=process.env.BACKEND_ID;
  process.env.BACKEND_ID='cloudflare';const cf=createApplication(':memory:');
  process.env.BACKEND_ID='aliyun';const cn=createApplication(':memory:');
  if(previousId===undefined)delete process.env.BACKEND_ID;else process.env.BACKEND_ID=previousId;
  await Promise.all([new Promise<void>(resolve=>cf.http.listen(0,'127.0.0.1',resolve)),new Promise<void>(resolve=>cn.http.listen(0,'127.0.0.1',resolve))]);
  const origin=(app:typeof cf)=>{const address=app.http.address();assert(address&&typeof address==='object');return `http://127.0.0.1:${address.port}`;};
  const cfOrigin=origin(cf),cnOrigin=origin(cn),nativeFetch=globalThis.fetch;
  let loseReply=false,offlineCn=false;const creationRequests:{url:string;body:string}[]=[];
  globalThis.fetch=async(input,init)=>{
    if(String(input)==='/backends.json')return new Response(JSON.stringify({backends:[{id:'cloudflare',origin:cfOrigin,transport:'socketio',enabled:true},{id:'aliyun',origin:cnOrigin,transport:'socketio',enabled:true}]}),{headers:{'Content-Type':'application/json'}});
    if(offlineCn&&String(input).startsWith(cnOrigin))throw TypeError('network offline');
    if(init?.method==='POST'&&String(input).endsWith('/api/rooms')){
      creationRequests.push({url:String(input),body:String(init.body)});const response=await nativeFetch(input,init);
      if(loseReply){loseReply=false;throw TypeError('accepted response lost');}return response;
    }
    return nativeFetch(input,init);
  };
  try{
    await loadBackends();
    await t.test('both lightweight probes leave room storage empty',async()=>{
      assert.equal((await probeBackend('cloudflare')).state,'available');assert.equal((await probeBackend('aliyun')).state,'available');
      assert.equal(cf.rooms.rooms.size,0);assert.equal(cn.rooms.rooms.size,0);
    });
    await t.test('same six-digit codes retain independent identities, roles, route and closed markers',()=>{
      const first:Identity={roomCode:'ABC234',backendId:'cloudflare',playerId:'cf-player',token:'cf-token'},second:Identity={...first,backendId:'aliyun',playerId:'cn-player',token:'cn-token'};
      saveIdentity(first);saveIdentity(second);
      assert.equal(readIdentity('C-ABC234')?.token,'cf-token');assert.equal(readIdentity('A-ABC234')?.token,'cn-token');
      assert.equal(readRouteIdentity('ABC234')?.backendId,'aliyun');assert.equal(readRouteIdentity('C-ABC234')?.backendId,'cloudflare');
      session.clear();assert.equal(readRouteIdentity('ABC234'),null,'two saved identities require explicit server choice');
      forgetIdentity('ABC234',first);assert.equal(readRouteIdentity('ABC234')?.backendId,'aliyun','one saved Aliyun identity can recover an old code');saveIdentity(first);
      forgetClosedRoom('ABC234','expired','aliyun');assert.equal(readClosedRoom('A-ABC234'),'expired');assert.equal(readClosedRoom('C-ABC234'),null);assert.equal(readIdentity('C-ABC234')?.token,'cf-token');
      assert.deepEqual(wireIdentity(second),{roomCode:'ABC234',playerId:'cn-player',token:'cn-token'});
      forgetIdentity('ABC234',first);assert.equal(readIdentity('C-ABC234'),null);
      local.clear();session.clear();
      local.setItem('magical-athlete:identity:ABC234',JSON.stringify(first));
      assert.equal(readIdentity('ABC234')?.backendId,'cloudflare');assert.equal(readIdentity('A-ABC234'),null);assert.equal(ownedRoomCandidates().length,1);
    });
    await t.test('unknown legacy code asks for server instead of guessing',async()=>{
      await assert.rejects(enterRoom('XYZ678',{name:'旧码玩家'}),/选择服务器/);
    });
    await t.test('lost create acknowledgement retries exact body and request ID on Aliyun only',async()=>{
      loseReply=true;const result=await enterRoom(null,{name:'阿里云房主',backendId:'aliyun',maxPlayers:2,timeoutSeconds:0});
      assert.equal(result.identity.backendId,'aliyun');assert.equal(cn.rooms.rooms.size,1);assert.equal(cf.rooms.rooms.size,0);
      assert.equal(creationRequests.length,2);assert.equal(creationRequests[0]!.url,`${cnOrigin}/api/rooms`);assert.deepEqual(creationRequests[0],creationRequests[1]);assert.ok(JSON.parse(creationRequests[0]!.body).requestId);assert.equal(readPendingCreation(),null);
      const guest=await enterRoom(`A-${result.room.code}`,{name:'跨入口加入',backendId:'cloudflare'});assert.equal(guest.identity.backendId,'aliyun');assert.equal(guest.room.players.length,2);
      const snapshot=await new Promise<RoomView>((resolve,reject)=>{const timer=setTimeout(()=>{connection.disconnect();reject(Error('snapshot timeout'));},5000);const connection=connectRoom(result.identity,room=>{clearTimeout(timer);connection.disconnect();resolve(room);},()=>{});});
      assert.equal(snapshot.backendId,'aliyun');assert.equal(snapshot.code,result.room.code);
    });
    await t.test('an uncertain pending create cannot move to the other backend',async()=>{
      session.setItem('magical-athlete:pending-create:v1',JSON.stringify({backendId:'aliyun',requestId:'pending-create-same-id',creation:{name:'原房主'}}));
      const before=creationRequests.length;await assert.rejects(enterRoom(null,{name:'新房主',backendId:'cloudflare'}),/原服务器.*尚未确认/);assert.equal(creationRequests.length,before);
      offlineCn=true;await assert.rejects(enterRoom(null,{name:'原房主',backendId:'aliyun'}),/建房结果尚未确认/);assert.equal(readPendingCreation()?.requestId,'pending-create-same-id');offlineCn=false;
      const original=await enterRoom(null,{name:'后来改过的表单',backendId:'aliyun',requestId:'different-ui-id'});
      assert.equal(original.room.players[0]!.name,'原房主');assert.equal(JSON.parse(creationRequests.at(-1)!.body).requestId,'pending-create-same-id');
      session.clear();
    });
    await t.test('browser entry guards avoid cross-origin probes and new seats but preserve original pending receipts',async()=>{
      const locationDescriptor=Object.getOwnPropertyDescriptor(globalThis,'location'),routedFetch=globalThis.fetch;
      const requests:string[]=[];
      Object.defineProperty(globalThis,'location',{value:{origin:cfOrigin,pathname:'/'},configurable:true});
      globalThis.fetch=async(input,init)=>{requests.push(String(input));return routedFetch(input,init);};
      try {
        assert.equal((await probeBackend('aliyun')).state,'entry');
        await assert.rejects(enterRoom(null,{name:'新房主',backendId:'aliyun'}),/先打开.*入口/);
        await assert.rejects(enterRoom('A-XYZ678',{name:'新访客'}),/先打开.*入口/);
        assert.equal(requests.length,0,'no remote probe, room creation or join was sent');
        const directory=await listRoomDirectory();
        assert.equal(directory.backends?.find(item=>item.backendId==='aliyun')?.error,'请切换入口查看此服务器房间。');
        assert.equal(requests.some(url=>url.startsWith(cnOrigin)),false);
        const receipt={backendId:'aliyun',requestId:'legacy-origin-receipt-id',creation:{name:'旧入口原房主'}};
        session.setItem('magical-athlete:pending-create:v1',JSON.stringify(receipt));
        const original=await enterRoom(null,{name:'不替换原请求',backendId:'aliyun'});
        assert.equal(original.room.players[0]!.name,'旧入口原房主');
        assert.equal(JSON.parse(creationRequests.at(-1)!.body).requestId,receipt.requestId);
        assert.equal(readPendingCreation(),null);
      }finally{
        globalThis.fetch=routedFetch;
        if(locationDescriptor)Object.defineProperty(globalThis,'location',locationDescriptor);else Reflect.deleteProperty(globalThis,'location');
      }
    });
  }finally{globalThis.fetch=nativeFetch;await Promise.all([cf.close(),cn.close()]);}
});
