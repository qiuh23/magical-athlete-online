import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { connectivityInfo } from '../src/shared/backend-protocol.js';

const platformUrl='data:text/javascript,'+encodeURIComponent('export class DurableObject { constructor(ctx,env){this.ctx=ctx;this.env=env;} }');
registerHooks({resolve(specifier,context,nextResolve){return specifier==='cloudflare:workers'?{url:platformUrl,shortCircuit:true}:nextResolve(specifier,context);}});
const worker=await import(new URL('../src/worker/index.ts',import.meta.url).href);
(globalThis as any).WebSocketRequestResponsePair=class {};
class Storage {
  values=new Map<string,unknown>();
  async get<T>(key:string){return structuredClone(this.values.get(key)) as T|undefined;}
  async put(key:string,value:unknown){this.values.set(key,structuredClone(value));}
  async delete(key:string){return this.values.delete(key);}
  async list<T>({prefix}:{prefix:string}){return new Map([...this.values].filter(([key])=>key.startsWith(prefix)).map(([key,value])=>[key,structuredClone(value) as T]));}
  async transaction<T>(callback:(storage:Storage)=>Promise<T>){const before=structuredClone(this.values);try{return await callback(this);}catch(error){this.values=before;throw error;}}
}

test('Worker cross-origin connectivity and preflight do not touch the room namespace',async()=>{
  let accesses=0;const env={PUBLIC_ORIGINS:'https://game.example.cn',ROOMS:{get(){accesses++;throw Error('Probe must not allocate a room');}},ASSETS:{fetch:()=>new Response('asset')}};
  const request=(path:string,options:RequestInit={})=>worker.default.fetch(new Request('https://example.workers.dev'+path,{headers:{Origin:'https://game.example.cn'},...options}),env);
  const probe=await request('/api/connectivity');assert.deepEqual(await probe.json(),connectivityInfo('cloudflare'));assert.equal(probe.headers.get('Access-Control-Allow-Origin'),'https://game.example.cn');
  const preflight=await request('/api/browser/rooms',{method:'OPTIONS'});assert.equal(preflight.status,204);assert.match(preflight.headers.get('Access-Control-Allow-Methods')??'',/POST/);
  assert.equal((await request('/api/connectivity',{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await request('/api/connectivity/ws')).status,426);assert.equal(accesses,0);
});

test('Worker dual quota is durable, idempotent and excludes solo reservations',async()=>{
  const storage=new Storage(),pending:Promise<unknown>[]=[];
  const ctx={storage,blockConcurrencyWhile(callback:()=>Promise<unknown>){const promise=callback();pending.push(promise);return promise;},setWebSocketAutoResponse(){}};
  const relay=new worker.RoomRelay(ctx,{DUAL_BACKEND_ENABLED:'true'});await Promise.all(pending);
  const reserve=(requestId:string,mode='multiplayer')=>relay.fetch(new Request('https://room.internal/directory/reserve',{method:'POST',body:JSON.stringify({requestId,request:'same settings',mode})}));
  const requestId=crypto.randomUUID(),first=await (await reserve(requestId)).json();
  assert.deepEqual(await (await reserve(requestId)).json(),first);
  for(let index=1;index<15;index++)assert.equal((await reserve(crypto.randomUUID())).status,200);
  assert.equal((await reserve(crypto.randomUUID())).status,409);
  assert.equal((await reserve(crypto.randomUUID(),'practice')).status,200);assert.equal((await reserve(crypto.randomUUID(),'ai')).status,200);
  assert.equal((await storage.list({prefix:'capacity:'})).size,15);
  const list=await relay.fetch(new Request('https://room.internal/directory/list'));const result=await list.json();assert.deepEqual(result.capacity,{used:15,limit:15});
});
