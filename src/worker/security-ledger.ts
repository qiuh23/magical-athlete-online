import { SECURITY_UNAVAILABLE, networkExpiry, securityEvent, type SecurityEvent } from '../shared/security.js';

export const SECURITY_OBJECT='security-ledger-v1';
export interface SecurityEnvironment { SITE_EDITION?:string; ROOMS?:{idFromName(name:string):DurableObjectId;get(id:DurableObjectId):{fetch(input:Request):Promise<Response>}}; SECURITY_MAX_BYTES?:string; SECURITY_TEST_NO_LEDGER?:boolean; }
export interface ModerationState {hidden:number[];restricted:string[];names:string[];closed:boolean;expiresAt:number;eventIds:number[];bytes?:number;logThrough?:number;}
const empty=():ModerationState=>({hidden:[],restricted:[],names:[],closed:false,expiresAt:0,eventIds:[]});
export function mergeModeration(previous:ModerationState|undefined,next:ModerationState):ModerationState {
  if(!previous)return next;
  return {...next,hidden:[...new Set([...previous.hidden,...next.hidden])],restricted:[...new Set([...previous.restricted,...next.restricted])],names:[...new Set([...previous.names,...next.names])],closed:previous.closed||next.closed,expiresAt:Math.max(previous.expiresAt,next.expiresAt),eventIds:[...new Set([...previous.eventIds,...next.eventIds])].sort((a,b)=>a-b),logThrough:Math.max(previous.logThrough??0,next.logThrough??0)};
}
const pad=(value:number)=>String(value).padStart(16,'0');
let alertedAt=0;
export function securityAlert():void {if(Date.now()-alertedAt>=60000){alertedAt=Date.now();console.error('SECURITY_STORAGE_UNAVAILABLE: required publication blocked; retained records were not evicted (request data omitted).');}}
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
type Entry={id:number;at:number;expires_at:number;held:boolean;event:SecurityEvent;evidence?:unknown;bytes:number;holdReasonIds?:number[]};
type Meta={next:number;bytes:number};
type Expiry={type:'event';id:number}|{type:'moderation';code:string};
async function insertEntry(txn:DurableObjectTransaction,max:number,input:Omit<SecurityEvent,'at'|'expiresAt'>,evidence?:unknown,held=false):Promise<Entry>{
  const meta=await txn.get<Meta>('security-meta')??{next:1,bytes:0},event=securityEvent(input),id=meta.next;
  const raw={id,at:event.at,expires_at:event.expiresAt,held,event,...(evidence===undefined?{}:{evidence})},bytes=new TextEncoder().encode(JSON.stringify(raw)).byteLength+256;
  if(meta.bytes+bytes>=max)throw Error(SECURITY_UNAVAILABLE);
  const entry={...raw,bytes};await txn.put('security:event:'+pad(id),entry);
  if(!held)await txn.put('security:expiry:'+pad(event.expiresAt)+':e:'+pad(id),{type:'event',id} satisfies Expiry);
  await txn.put('security-meta',{next:id+1,bytes:meta.bytes+bytes});if(await txn.getAlarm()===null)await txn.setAlarm(Date.now()+15*60_000);return entry;
}
export async function securityCall<T=unknown>(env:SecurityEnvironment,operation:string,input?:unknown):Promise<T|undefined> {
  if(env.SITE_EDITION==='cn'){if(operation==='health')return {ok:true,enabled:false,warnings:[]} as T;if(operation==='state')return empty() as T;return undefined;}
  // Direct unit construction without a namespace is used by the legacy rule
  // tests. Every deployed Worker request requires ROOMS and always takes this path.
  if(!env.ROOMS||typeof env.ROOMS.idFromName!=='function'){if(env.SECURITY_TEST_NO_LEDGER===true)return undefined;throw Error(SECURITY_UNAVAILABLE);}
  try{const response=await env.ROOMS.get(env.ROOMS.idFromName(SECURITY_OBJECT)).fetch(new Request('https://security.internal/security/'+operation,{method:input===undefined?'GET':'POST',...(input===undefined?{}:{body:JSON.stringify(input)})}));
    if(!response.ok)throw Error(SECURITY_UNAVAILABLE);return await response.json() as T;
  }catch{securityAlert();throw Error(SECURITY_UNAVAILABLE);}
}
export async function appendSecurity(env:SecurityEnvironment,input:Omit<SecurityEvent,'at'|'expiresAt'>){return securityCall<{id:number}>(env,'append',input);}
/** Independent object, never part of a room's close/delete transaction. */
export async function securityLedgerFetch(storage:DurableObjectStorage,env:SecurityEnvironment,request:Request):Promise<Response> {
  const operation=new URL(request.url).pathname.split('/')[2]??'';
  const max=Number(env.SECURITY_MAX_BYTES??268435456);
  if(!Number.isFinite(max)||max<1048576)return reply({error:'Invalid security capacity configuration'},503);
  const input=request.method==='POST'?await request.json() as Record<string,unknown>:{};
  if(operation==='health'){const meta=await storage.get<Meta>('security-meta')??{next:1,bytes:0};await storage.put('security-health',Date.now());const ok=meta.bytes<max-8192;return reply({ok,warnings:meta.bytes>max*.8?['security-storage-near-limit']:[]},ok?200:503);}
  if(operation==='state')return reply(await storage.get<ModerationState>('security:moderation:'+String(input.code))??empty());
  if(operation==='list'){
    const after=Number(input.after??0);if(!Number.isSafeInteger(after)||after<0)return reply({error:'游标错误。'},400);
    const entries=await storage.list<Entry>({prefix:'security:event:',startAfter:'security:event:'+pad(after),limit:100});
    return reply({records:[...entries.values()].map(({evidence,...entry})=>entry)});
  }
  if(operation==='evidence'){const entry=await storage.get<Entry>('security:event:'+pad(Number(input.id)));return reply({record:entry?.evidence??null});}
  if(operation==='hold'){
    const id=Number(input.id),held=input.held;if(!Number.isSafeInteger(id)||id<1||typeof held!=='boolean')return reply({error:'保全格式错误。'},400);
    await storage.transaction(async txn=>{
      const key='security:event:'+pad(id),entry=await txn.get<Entry>(key);if(!entry)throw Error('记录不存在。');
      if(input.reason!==undefined){if(typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>200)throw Error('保全原因错误。');
        const reason=await insertEntry(txn,max,{kind:'admin',operation:held?'hold':'release-hold',outcome:'enforced',target:String(id),roomCode:entry.event.roomCode,reason:input.reason},undefined,held);
        if(held){if((entry.holdReasonIds?.length??0)>=100)throw Error('保全理由数量已达上限，请人工核查。');entry.holdReasonIds=[...(entry.holdReasonIds??[]),reason.id];}
      }
      if(!held){for(const reasonId of entry.holdReasonIds??[]){const reasonKey='security:event:'+pad(reasonId),reason=await txn.get<Entry>(reasonKey);if(reason){reason.held=false;await txn.put(reasonKey,reason);await txn.put('security:expiry:'+pad(reason.expires_at)+':e:'+pad(reasonId),{type:'event',id:reasonId} satisfies Expiry);}}entry.holdReasonIds=[];
        if(entry.event.roomCode){const state=await txn.get<ModerationState>('security:moderation:'+entry.event.roomCode);if(state)await txn.put('security:expiry:'+pad(state.expiresAt)+':m:'+entry.event.roomCode,{type:'moderation',code:entry.event.roomCode} satisfies Expiry);}
      }
      entry.held=held;await txn.put(key,entry);const expiry='security:expiry:'+pad(entry.expires_at)+':e:'+pad(id);if(held)await txn.delete(expiry);else await txn.put(expiry,{type:'event',id} satisfies Expiry);await txn.setAlarm(Date.now()+1000);
    });
    return reply({ok:true});
  }
  if(operation!=='append'&&operation!=='disposition')return reply({error:'接口不存在。'},404);
  let id=0;
  await storage.transaction(async txn=>{
    const entry=await insertEntry(txn,max,(operation==='append'?input:input.event) as unknown as Omit<SecurityEvent,'at'|'expiresAt'>,operation==='disposition'?input.evidence:undefined),event=entry.event;id=entry.id;
    if(operation==='disposition'){
      const code=String(input.code),kind=String(input.kind),target=String(input.target),key='security:moderation:'+code;
      const state=await txn.get<ModerationState>(key)??empty();
      const previousBytes=state.bytes??0;
      if(state.expiresAt)await txn.delete('security:expiry:'+pad(state.expiresAt)+':m:'+code);
      if(kind==='hidden')state.hidden=[...new Set([...state.hidden,Number(target)])];
      if(kind==='restricted')state.restricted=[...new Set([...state.restricted,target])];
      if(kind==='name')state.names=[...new Set([...state.names,target])];
      if(kind==='name'&&typeof (input.evidence as {eventThrough?:unknown}|undefined)?.eventThrough==='number')state.logThrough=Math.max(state.logThrough??0,(input.evidence as {eventThrough:number}).eventThrough);
      if(kind==='closed')state.closed=true;
      state.expiresAt=networkExpiry(event.at);state.eventIds.push(id);state.bytes=new TextEncoder().encode(JSON.stringify(state)).byteLength+256;
      const meta=(await txn.get<Meta>('security-meta'))!;meta.bytes+=state.bytes-previousBytes;if(meta.bytes>=max)throw Error(SECURITY_UNAVAILABLE);await txn.put('security-meta',meta);await txn.put(key,state);
      await txn.put('security:expiry:'+pad(state.expiresAt)+':m:'+code,{type:'moderation',code} satisfies Expiry);
    }
  });
  return reply({id});
}
export async function securityLedgerCleanup(storage:DurableObjectStorage,now=Date.now()):Promise<void> {
  await storage.transaction(async txn=>{
    const entries=await txn.list<Expiry>({prefix:'security:expiry:',limit:500}),meta=await txn.get<Meta>('security-meta')??{next:1,bytes:0};
    for(const [key,value]of entries){const expiry=Number(key.split(':')[2]);if(expiry>now)break;
      if(value.type==='event'){const eventKey='security:event:'+pad(value.id),entry=await txn.get<Entry>(eventKey);if(entry&&!entry.held){await txn.delete(eventKey);meta.bytes=Math.max(0,meta.bytes-entry.bytes);}}
      else {const mark='security:moderation:'+value.code,state=await txn.get<ModerationState>(mark);let held=false;for(const id of state?.eventIds??[])if((await txn.get<Entry>('security:event:'+pad(id)))?.held)held=true;if(!held){await txn.delete(mark);meta.bytes=Math.max(0,meta.bytes-(state?.bytes??0));}}
      await txn.delete(key);
    }
    await txn.put('security-meta',meta);
  });
  await storage.setAlarm(now+15*60_000);
}
