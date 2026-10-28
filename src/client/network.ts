import { randomId } from './random-id.js';
import { PresentationEventClient } from './presentation-events.js';
import { io, type Socket } from 'socket.io-client';
import type { ActionEnvelope, ActionReply, CharacterPool, ChatReply, ChatSend, GameAction, GameMode, Identity, Phase, PublicEventReply, RenameReply, RoomRole, RoomSummary, RoomView } from '../shared/types.js';
import { CommunityFeed, type CommunityState } from './community.js';
import type { RelayJoinReply } from '../shared/relay.js';
import { BrowserRelayConnection, prepareBrowserRoom } from './browser-connection.js';
import { backendEntryUrl, backendUrl, formatRoomCode, getBackend, getBackends, httpEntryUrl, isBackendId, loadBackends, parseRoomCode, probeBackend, roomApiPrefix, type BackendId } from './backends.js';

export const BROWSER_HOST_MODE = import.meta.env?.VITE_HOST_MODE === 'browser';
export interface RoomConnection {
  readonly connected: boolean;
  /** Authenticated personal-room owners may close through the relay even
   * while the browser responsible for computing gameplay is unavailable. */
  readonly canClose?: boolean;
  connect(): void;
  disconnect(): void;
  emit(event: 'sync'): unknown;
  request(envelope: ActionEnvelope): Promise<ActionReply>;
  acknowledgeEvents?(cursor:number):void;
  readEvents?(afterId:number):Promise<import('../shared/types.js').PublicEventBatch>;
  subscribeCommunity?(listener: (state: CommunityState) => void): () => void;
  sendChat?(message: ChatSend): Promise<ChatReply>;
  rename?(request: {requestId: string; name: string}): Promise<RenameReply>;
}

const identityKey = (code: string, backendId:BackendId) => `magical-athlete:identity:${backendId}:${code.toUpperCase()}`;
const OWNED_ROOMS_KEY = 'magical-athlete:owned-rooms:v1';
const ROUTE_IDENTITY_KEY = 'magical-athlete:route-identity:v1';
const CLOSED_ROOMS_KEY = 'magical-athlete:closed-rooms:v1';
const PENDING_CREATE_KEY = 'magical-athlete:pending-create:v1';
export const OWNED_ROOMS_CHANGED = 'magical-athlete:owned-rooms-changed';
const backendOf = (identity:Pick<Identity,'backendId'>):BackendId => identity.backendId ?? 'cloudflare';
function roomTarget(value:string, backendId?:BackendId):{code:string;backendId:BackendId} {
  const parsed=parseRoomCode(value);if(!parsed)throw Error('请输入完整房间码，例如 C-ABC234。');
  return {code:parsed.code,backendId:parsed.backendId ?? backendId ?? 'cloudflare'};
}
function sameRoom(record:{code:string;backendId?:BackendId},target:{code:string;backendId:BackendId}) { return record.code === target.code && backendOf(record) === target.backendId; }
export function wireIdentity(identity:Identity):Omit<Identity,'backendId'> { const {backendId:_,...wire}=identity;return wire; }
/** No credential is duplicated here: returning always uses the saved player identity. */
export interface OwnedRoom { code: string; backendId?:BackendId; playerId: string; mode: GameMode; phase: Phase; createdAt: number; lastVisitedAt: number; hostLeftAt?: number; expiresAt?: number }
function ownedRecords(): OwnedRoom[] {
  try {
    const records: unknown = JSON.parse(localStorage.getItem(OWNED_ROOMS_KEY) ?? '[]');
    return Array.isArray(records) ? records.filter((r): r is OwnedRoom => !!r && typeof r === 'object' && /^[A-Z2-9]{6}$/.test(r.code) && (!r.backendId || isBackendId(r.backendId)) && typeof r.playerId === 'string' && Number.isFinite(r.createdAt) && Number.isFinite(r.lastVisitedAt)) : [];
  } catch { return []; }
}
function writeOwnedRooms(records: OwnedRoom[]) {
  try {
    const value = JSON.stringify(records.toSorted((a,b) => b.lastVisitedAt-a.lastVisitedAt).slice(0,8));
    if (localStorage.getItem(OWNED_ROOMS_KEY) === value) return;
    localStorage.setItem(OWNED_ROOMS_KEY, value);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(OWNED_ROOMS_CHANGED));
  } catch { /* Optional recovery metadata must not prevent a committed game action. */ }
}
export function forgetOwnedRoom(code:string,backendId?:BackendId) { const target=roomTarget(code,backendId);writeOwnedRooms(ownedRecords().filter(room=>!sameRoom(room,target))); }
function closedRecords(): {code:string;backendId?:BackendId;reason:'closed'|'expired'}[] {
  try { const records=JSON.parse(localStorage.getItem(CLOSED_ROOMS_KEY)??'[]');return Array.isArray(records)?records.filter(record=>record&&/^[A-Z2-9]{6}$/.test(record.code)&&(!record.backendId||isBackendId(record.backendId))&&(record.reason==='closed'||record.reason==='expired')):[]; }catch{return [];}
}
export function readClosedRoom(code:string,backendId?:BackendId):'closed'|'expired'|null { const parsed=parseRoomCode(code);if(!parsed)return null;const target=roomTarget(code,backendId);return closedRecords().find(record=>sameRoom(record,target))?.reason??null; }
export function forgetClosedRoom(code:string,reason:'closed'|'expired'='closed',backendId?:BackendId) {
  const target=roomTarget(code,backendId);forgetOwnedRoom(target.code,target.backendId);
  try { localStorage.setItem(CLOSED_ROOMS_KEY,JSON.stringify([{...target,reason},...closedRecords().filter(record=>!sameRoom(record,target))].slice(0,32)));for(const suffix of ['',':player',':spectator']){localStorage.removeItem(identityKey(target.code,target.backendId)+suffix);if(target.backendId==='cloudflare')localStorage.removeItem(`magical-athlete:identity:${target.code}${suffix}`);} }catch{/* Storage may be unavailable. */}
}
export function readIdentity(code:string,role?:RoomRole,backendId?:BackendId):Identity|null {
  const parsed=parseRoomCode(code);if(!parsed)return null;
  const target=roomTarget(code,backendId),key=identityKey(target.code,target.backendId);
  try {
    const read=(prefix:string)=>{const current=JSON.parse(localStorage.getItem(prefix)??'null');return role?JSON.parse(localStorage.getItem(`${prefix}:${role}`)??'null')??((current?.role??'player')===role?current:null):current;};
    // Credentials predating regions belong to the original Cloudflare service only.
    const value=read(key)??(target.backendId==='cloudflare'?read(`magical-athlete:identity:${target.code}`):null);
    return value && value.roomCode === target.code && (!value.backendId || value.backendId===target.backendId) && typeof value.playerId==='string' && typeof value.token==='string' ? {...value,backendId:target.backendId} : null;
  }catch{return null;}
}
export function saveIdentity(identity:Identity) {
  const id=backendOf(identity),key=identityKey(identity.roomCode,id),qualified={...identity,backendId:id};
  const previous=readIdentity(identity.roomCode,undefined,id);
  if(previous)localStorage.setItem(`${key}:${previous.role??'player'}`,JSON.stringify(previous));
  localStorage.setItem(`${key}:${identity.role??'player'}`,JSON.stringify(qualified));localStorage.setItem(key,JSON.stringify(qualified));
  try { sessionStorage.setItem(ROUTE_IDENTITY_KEY,JSON.stringify({code:identity.roomCode,backendId:id,playerId:identity.playerId,role:identity.role??'player'})); }catch{/* Per-tab preference is optional. */}
}
/** A spectator opened in another tab must not replace this tab's player on refresh. */
export function readRouteIdentity(code:string,backendId?:BackendId):Identity|null {
  const parsed=parseRoomCode(code);if(!parsed)return null;
  try {
    const route=JSON.parse(sessionStorage.getItem(ROUTE_IDENTITY_KEY)??'null');
    let id=parsed.backendId??backendId??(isBackendId(route?.backendId)&&route.code===parsed.code?route.backendId:undefined);
    if(!id){
      const candidates=(['cloudflare','aliyun'] as const).filter(candidate=>readIdentity(code,undefined,candidate));
      if(candidates.length>1)return null;
      id=candidates[0];
    }
    const target=roomTarget(code,id),identity=route?.code===target.code&&backendOf(route)===target.backendId?readIdentity(code,route.role,target.backendId):null;
    if(identity&&identity.playerId===route?.playerId)return identity;
    const owned=ownedRecords().find(room=>sameRoom(room,target)),player=readIdentity(code,'player',target.backendId);
    return owned&&player?.playerId===owned.playerId?player:readIdentity(code,undefined,target.backendId);
  }catch{return readIdentity(code,undefined,backendId);}
}
export function forgetIdentity(code:string,identity=readIdentity(code)) {
  const target=roomTarget(code,identity?.backendId),key=identityKey(target.code,target.backendId);
  if(identity)localStorage.removeItem(`${key}:${identity.role??'player'}`);
  const current=readIdentity(code,undefined,target.backendId);if(!identity||current?.playerId===identity.playerId)localStorage.removeItem(key);
  // Remove migrated legacy credentials as well, so a departed seat cannot return.
  if(target.backendId==='cloudflare')for(const suffix of ['',`:${identity?.role??'player'}`])localStorage.removeItem(`magical-athlete:identity:${target.code}${suffix}`);
  if(!identity||ownedRecords().some(room=>sameRoom(room,target)&&room.playerId===identity.playerId))forgetOwnedRoom(target.code,target.backendId);
}
export function rememberOwnedRoom(room:Pick<RoomView,'code'|'hostId'|'ownerId'|'mode'|'phase'|'createdAt'|'hostLeftAt'|'expiresAt'|'closedAt'>,identity:Identity,touch=false):void {
  const target=roomTarget(room.code,backendOf(identity));
  if(room.closedAt!==undefined){forgetClosedRoom(target.code,'closed',target.backendId);return;}
  try {if(readClosedRoom(target.code,target.backendId))localStorage.setItem(CLOSED_ROOMS_KEY,JSON.stringify(closedRecords().filter(record=>!sameRoom(record,target))));}catch{/* The live server response remains authoritative. */}
  if(identity.role==='spectator')return;
  const records=ownedRecords(),old=records.find(record=>sameRoom(record,target));
  if((room.ownerId??room.hostId)!==identity.playerId){if(old?.playerId===identity.playerId)forgetOwnedRoom(target.code,target.backendId);return;}
  const now=Date.now(),record:OwnedRoom={...target,playerId:identity.playerId,mode:room.mode??'multiplayer',phase:room.phase,createdAt:room.createdAt??old?.createdAt??now,lastVisitedAt:touch?now:old?.lastVisitedAt??room.createdAt??now,...(room.hostLeftAt===undefined?{}:{hostLeftAt:room.hostLeftAt}),...(room.expiresAt===undefined||room.expiresAt===Number.MAX_SAFE_INTEGER?{}:{expiresAt:room.expiresAt})};
  writeOwnedRooms([record,...records.filter(previous=>!sameRoom(previous,target))]);
}
export function ownedRoomCandidates():Identity[] {
  const candidates=new Map<string,Identity>();
  const add=(code:string,id:BackendId)=>{const identity=readIdentity(code,'player',id);if(identity&&identity.role!=='spectator'&&!readClosedRoom(code,id))candidates.set(formatRoomCode(code,id),identity);};
  for(const room of ownedRecords().toSorted((a,b)=>b.lastVisitedAt-a.lastVisitedAt))add(room.code,backendOf(room));
  try {for(let index=localStorage.length-1;index>=0&&candidates.size<8;index--){const match=/^magical-athlete:identity:(?:(cloudflare|aliyun):)?([A-Z2-9]{6})(?::player)?$/.exec(localStorage.key(index)??'');if(match)add(match[2]!,match[1]==='aliyun'?'aliyun':'cloudflare');}}catch{/* Retain known records. */}
  return [...candidates.values()].slice(0,8);
}
export async function checkOwnedRoom(identity:Identity):Promise<OwnedRoom|null> {
  await loadBackends();const id=backendOf(identity),backend=getBackend(id);
  if(!backend.enabled)throw Error(`${backend.label}尚未部署或开放。`);
  if(httpEntryUrl(backend,identity.roomCode))throw Error('请从临时 HTTP 入口恢复原房间；本机凭据仍保留。');
  const prefix=roomApiPrefix(backend);
  const response=await fetch(`${prefix}/${encodeURIComponent(identity.roomCode)}/resume-status`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(wireIdentity(identity)),signal:AbortSignal.timeout(4500),cache:'no-store'});
  if([404,410].includes(response.status)){forgetClosedRoom(identity.roomCode,'closed',id);return null;}
  if(response.status===401){forgetIdentity(identity.roomCode,identity);return null;}
  const reply=await response.json().catch(()=>({}));
  if(!response.ok||!reply.ok||typeof reply.ownerId!=='string'||!Number.isFinite(reply.createdAt))throw Error(reply.error??'暂时无法确认原房间，请稍后重试。');
  if(reply.ownerId!==identity.playerId||identity.role==='spectator'){forgetOwnedRoom(identity.roomCode,id);return null;}
  rememberOwnedRoom({code:identity.roomCode,hostId:reply.ownerId,ownerId:reply.ownerId,mode:reply.mode,phase:reply.phase,createdAt:reply.createdAt,hostLeftAt:reply.hostLeftAt,expiresAt:reply.expiresAt},identity);
  return ownedRecords().find(room=>sameRoom(room,{code:identity.roomCode,backendId:id}))??null;
}
export interface JoinReply {identity:Identity;room:RoomView}
export interface RoomDirectoryReply {rooms:RoomSummary[];capacity?:{used:number;limit:number};backends?:{backendId:BackendId;available:boolean;error?:string;capacity?:{used:number;limit:number}}[]}
export async function listRoomDirectory():Promise<RoomDirectoryReply> {
  await loadBackends();
  const results=await Promise.all(getBackends().map(async backend=>{
    if(!backend.enabled)return {backendId:backend.id,available:false,error:'未部署',rooms:[] as RoomSummary[]};
    if(typeof location !== 'undefined' && backendEntryUrl(backend))return {backendId:backend.id,available:false,error:'请切换入口查看此服务器房间。',rooms:[] as RoomSummary[]};
    try {const response=await fetch(roomApiPrefix(backend),{cache:'no-store',signal:AbortSignal.timeout(4500)}),reply=await response.json();if(!response.ok||!Array.isArray(reply.rooms))throw Error();return {backendId:backend.id,available:true,rooms:(reply.rooms as RoomSummary[]).map(room=>({...room,backendId:backend.id})),capacity:reply.capacity as {used:number;limit:number}|undefined};}
    catch{return {backendId:backend.id,available:false,error:'连接失败',rooms:[] as RoomSummary[]};}
  }));
  const capacities=results.filter(result=>result.available&&result.capacity).map(result=>result.capacity!);
  return {rooms:results.flatMap(result=>result.rooms),backends:results.map(({rooms:_,...status})=>status),...(capacities.length?{capacity:{used:capacities.reduce((n,c)=>n+c.used,0),limit:capacities.reduce((n,c)=>n+c.limit,0)}}:{})};
}
export async function listRooms():Promise<RoomSummary[]>{return(await listRoomDirectory()).rooms;}
export async function leaveRoom(identity:Identity):Promise<void> {
  await loadBackends();const backend=getBackend(backendOf(identity));if(!backend.enabled||httpEntryUrl(backend))return;
  const prefix=roomApiPrefix(backend);let response:Response;
  try {response=await fetch(`${prefix}/${encodeURIComponent(identity.roomCode)}/leave`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(wireIdentity(identity)),signal:AbortSignal.timeout(4000)});}catch{return;}
  const reply=await response.json().catch(()=>({}));if([401,404,410].includes(response.status)){forgetIdentity(identity.roomCode,identity);return;}if(!response.ok)throw Error(reply.error||'退出房间未确认，请重试。');if(!reply.retainIdentity)forgetIdentity(identity.roomCode,identity);
}
type EntryData={name:string;maxPlayers?:number;timeoutSeconds?:number;mode?:GameMode;aiCount?:number;role?:RoomRole;characterPool?:CharacterPool;config?:import('../shared/room-config.js').RoomConfig;requestId?:string;backendId?:BackendId};
interface PendingCreation {backendId:BackendId;requestId:string;creation:Omit<EntryData,'backendId'|'role'>}
export function readPendingCreation():PendingCreation|null {try{const value=JSON.parse(sessionStorage.getItem(PENDING_CREATE_KEY)??'null');return value&&isBackendId(value.backendId)&&typeof value.requestId==='string'&&value.creation?value:null;}catch{return null;}}
export async function enterRoom(code:string|null,data:EntryData):Promise<JoinReply> {
  await loadBackends();const parsed=code?parseRoomCode(code):null;if(code&&!parsed)throw Error('请输入完整房间码，例如 C-ABC234。');
  const enabled=getBackends().filter(backend=>backend.enabled);
  if(code&&!parsed?.backendId&&!data.backendId&&enabled.length!==1)throw Error('六位旧房间码无法确定归属，请选择服务器。');
  const id=parsed?.backendId??data.backendId??enabled[0]?.id;if(!id)throw Error('请先选择可用的服务器。');
  const backend=getBackend(id);if(!backend.enabled)throw Error(`${backend.label}尚未部署或开放。`);
  if(httpEntryUrl(backend,code??undefined))throw Error(`${backend.label}使用临时 HTTP 入口，请打开入口后重试原房间。`);
  const pending=readPendingCreation();
  // Existing receipts/identities stay on their original origin. New seats and
  // rooms must be created at their server's own entry so reload can recover them.
  if(typeof location !== 'undefined' && backendEntryUrl(backend) && (code || pending?.backendId!==id))throw Error(`请先打开${backend.label}入口，再创建或加入房间。`);
  const {role,backendId:_,...creation}=data;
  let body:unknown=code?{name:data.name,...(role?{role}:{})}:creation;
  if(!code){
    if(pending&&pending.backendId!==id)throw Error(`原服务器${getBackend(pending.backendId).label}的建房结果尚未确认，请先在原服务器重试。`);
    if(!pending && (await probeBackend(id)).state!=='available')throw Error(`${backend.label}连接失败，请重新检测或选择服务器。`);
    const request=pending??{backendId:id,requestId:data.requestId??randomId(),creation};
    request.creation={...request.creation,requestId:request.requestId};body=request.creation;
    // This receipt survives reloads; uncertain requests must never move to another backend.
    sessionStorage.setItem(PENDING_CREATE_KEY,JSON.stringify(request));
  }
  const prefix=roomApiPrefix(backend),url=code?`${prefix}/${encodeURIComponent(parsed!.code)}/join`:prefix;
  let response:Response|undefined;
  for(let attempt=0;attempt<(code?1:2);attempt++){
    try {response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10_000)});break;}
    catch {if(attempt===(code?0:1))throw Error(code?`${backend.label}连接失败，请重试原房间。`:`建房结果尚未确认，请在${backend.label}重试；将使用同一请求编号。`);}
  }
  const reply=await response!.json().catch(()=>({}));
  if(!response!.ok){if(!code&&response!.status>=400&&response!.status<500&&response!.status!==408)sessionStorage.removeItem(PENDING_CREATE_KEY);throw Error(reply.error||'暂时无法进入房间，请稍后在原服务器重试。');}
  if(!reply.identity||!reply.room)throw Error('服务器未返回有效房间，请在原服务器重试。');
  reply.identity={...reply.identity,backendId:id};reply.room={...reply.room,backendId:id};saveIdentity(reply.identity);
  if(!code)sessionStorage.removeItem(PENDING_CREATE_KEY);
  if(backend.transport==='worker'&&!code)await prepareBrowserRoom((reply as RelayJoinReply).meta);
  rememberOwnedRoom(reply.room,reply.identity,true);return reply;
}
export type ConnectionState = 'connecting' | 'online' | 'offline' | 'error' | 'closed' | 'expired' | 'kicked';
export function connectRoom(identity: Identity, onSnapshot: (room: RoomView) => void, onStatus: (state: ConnectionState, message?: string) => void): RoomConnection {
  // On an invitation/reload the room may connect before Home has loaded the
  // deployment registry. Never send saved credentials to the page's default.
  let inner:RoomConnection|null=null,disposed=false,loading=false;
  const listeners=new Set<(state:CommunityState)=>void>(),unsubscribes=new Map<(state:CommunityState)=>void,()=>void>();
  const start=()=>{if(disposed||inner||loading)return;loading=true;onStatus('connecting');void loadBackends().then(()=>{
    loading=false;if(disposed)return;const backend=getBackend(backendOf(identity));if(!backend.enabled){onStatus('error',`${backend.label}尚未部署或开放。`);return;}
    if(httpEntryUrl(backend,identity.roomCode)){onStatus('error','请从临时 HTTP 入口恢复原房间；本机凭据仍保留。');return;}
    inner=connectConfiguredRoom(identity,onSnapshot,onStatus);for(const listener of listeners){const unsubscribe=inner.subscribeCommunity?.(listener);if(unsubscribe)unsubscribes.set(listener,unsubscribe);}
  }).catch(()=>{loading=false;if(!disposed)onStatus('error','无法读取服务器部署配置，请重试原房间。');});};
  start();
  const ready=()=>{if(!inner)throw Error('正在连接原房间服务器，请稍后重试。');return inner;};
  return {get connected(){return inner?.connected??false;},get canClose(){return inner?.canClose??false;},connect(){if(inner)inner.connect();else start();},disconnect(){disposed=true;for(const unsubscribe of unsubscribes.values())unsubscribe();listeners.clear();inner?.disconnect();},emit(event){return inner?.emit(event);},request(envelope){return ready().request(envelope);},acknowledgeEvents(cursor){inner?.acknowledgeEvents?.(cursor);},readEvents(afterId){return ready().readEvents!(afterId);},subscribeCommunity(listener){listeners.add(listener);if(inner){const unsubscribe=inner.subscribeCommunity?.(listener);if(unsubscribe)unsubscribes.set(listener,unsubscribe);}return()=>{listeners.delete(listener);unsubscribes.get(listener)?.();unsubscribes.delete(listener);};},sendChat(message){return ready().sendChat!(message);},rename(request){return ready().rename!(request);}};
}
function connectConfiguredRoom(identity: Identity, onSnapshot: (room: RoomView) => void, onStatus: (state: ConnectionState, message?: string) => void): RoomConnection {
  const backend=getBackend(backendOf(identity)),receive=(room:RoomView)=>onSnapshot({...room,backendId:backend.id});
  if (backend.transport==='worker') return new BrowserRelayConnection(identity, receive, onStatus, backend);
  const socket = io(backend.origin || (typeof location==='undefined' ? 'http://localhost' : location.origin), { auth: wireIdentity(identity), reconnection: true, reconnectionDelay: 800, reconnectionDelayMax: 5000, timeout: 10000 });
  const community = new CommunityFeed();
  const chatSync = () => { socket.timeout(6500).emit('chat-sync', {afterId: 0}, (error: Error | null, reply: {ok: boolean; messages?: RoomView['chat']; latestId?: number}) => { if (!error && reply.ok) community.update({messages: reply.messages, latestId: reply.latestId},'history'); }); };
  socket.on('chat', (payload: {messages: NonNullable<RoomView['chat']>; latestId: number}) => community.update(payload,'live'));
  socket.on('connect', () => { community.update({connected: true}); chatSync(); });
  socket.on('disconnect', () => community.update({connected: false}));
  socket.on('snapshot', (room: RoomView) => community.update({messages: room.chat, latestId: room.chatLatestId, renameRemaining: room.renameRemaining, name: room.players.find(player => player.id === identity.playerId)?.name ?? room.spectators?.find(viewer => viewer.id === identity.playerId)?.name},'history'));
  let closed = false;
  let expired = false;
  let kicked = false;
  let closedMessage='房间已解散，请创建或加入其他房间。';
  const readEvents:NonNullable<RoomConnection['readEvents']>=async afterId=>{
    const reply=await new Promise<PublicEventReply>((resolve,reject)=>socket.timeout(6500).emit('events',{afterId},(error:Error|null,value:PublicEventReply)=>error?reject(error):resolve(value)));
    if(!reply.ok||!reply.batch)throw Error(reply.error??'尚未取得完整动画记录。');return reply.batch;
  };
  const eventClient=new PresentationEventClient(readEvents,receive,error=>onStatus('error',error instanceof Error?error.message:'动画记录同步失败，请重新连接。'));
  const finishKicked = () => { kicked=true;closed=true;eventClient.reset();forgetIdentity(identity.roomCode,identity);socket.io.reconnection(false);socket.disconnect();onStatus('kicked','你已被房主踢出房间，原席位和准备状态已清除。'); };
  const finishClosed = () => { closed = true; forgetClosedRoom(identity.roomCode,'closed',backend.id); eventClient.reset(); socket.io.reconnection(false); socket.disconnect(); onStatus(expired ? 'expired' : 'closed', expired ? '房间已到期关闭，请重新创建。' : closedMessage); };
  socket.on('connect', () => { eventClient.reset(); if (closed) { finishClosed(); return; } onStatus('online'); socket.emit('sync'); });
  socket.on('snapshot', (room: RoomView) => { if(room.closedAt)receive(room);else eventClient.receive({...room,backendId:backend.id}); if (room.closedAt) { closed = true; socket.io.reconnection(false); onStatus('closed', '房间已解散，请创建或加入其他房间。'); } });
  socket.on('room-closed', (event: { code: string; reason?: 'expired'|'host-away'|'dismissed' }) => { if (event.code === identity.roomCode) { expired = event.reason === 'expired'; if(event.reason==='host-away')closedMessage='房主离线保留期限已到，房间已关闭。'; finishClosed(); } });
  socket.on('room-kicked',(event:{code:string})=>{if(event.code===identity.roomCode)finishKicked();});
  socket.on('disconnect', () => { if(kicked)onStatus('kicked');else if (closed) finishClosed(); else onStatus('offline'); });
  socket.on('connect_error', (error: Error & { data?: { code?: string } }) => { if (error.data?.code === 'ROOM_EXPIRED' || /3小时|已过期/.test(error.message)) { expired = true; finishClosed(); } else if (error.data?.code === 'ROOM_CLOSED' || /房间已解散|房间已关闭/.test(error.message)) {if(error.message.includes('房间已关闭'))closedMessage=error.message;finishClosed();} else onStatus('error', error.message); });
  return { get connected() { return !closed && socket.connected; }, subscribeCommunity: community.subscribe, readEvents,
    sendChat(message) { return new Promise((resolve,reject) => socket.timeout(6500).emit('chat-send', message, (error: Error | null, reply: ChatReply) => { if (error) reject(error); else { if (reply.message) community.update({messages: [reply.message]}); resolve(reply); } })); },
    rename(request) { return new Promise((resolve,reject) => socket.timeout(6500).emit('rename', request, (error: Error | null, reply: RenameReply) => { if (error) reject(error); else { if (reply.ok) community.update({name: reply.name, renameRemaining: reply.remaining}); resolve(reply); } })); },
    connect() { if (!closed) { if(socket.connected){eventClient.reset();onStatus('online');socket.emit('sync');chatSync();}else socket.connect(); } }, disconnect() { eventClient.reset(); socket.disconnect(); }, acknowledgeEvents(cursor){eventClient.acknowledge(cursor);}, emit(event) { if (!closed) socket.emit(event); }, async request(envelope) { try { return await socketRequest(socket, envelope); } catch (error) { if (closed && envelope.action.type === 'close') return { ok: true }; throw error; } } };
}
function socketRequest(socket: Socket, envelope: ActionEnvelope): Promise<ActionReply> {
  return new Promise((resolve, reject) => socket.timeout(6500).emit('action', envelope, (error: Error | null, reply: ActionReply) => error ? reject(error) : resolve(reply)));
}
export async function sendAction(socket: RoomConnection, room: RoomView, action: GameAction): Promise<ActionReply> {
  const envelope: ActionEnvelope = { actionId: randomId(), expectedVersion: room.version, action };
  // Retrying uses the same id so a lost acknowledgement cannot apply an action twice.
  const attempt = () => socket.request(envelope);
  try { return await attempt(); }
  catch {
    if (!socket.connected && !(action.type === 'close' && socket.canClose)) throw new Error('连接已中断。恢复连接后会同步对局。');
    try { return await attempt(); }
    catch { socket.emit('sync'); throw new Error('尚未收到操作确认，正在重新同步。请先查看最新局面。'); }
  }
}
