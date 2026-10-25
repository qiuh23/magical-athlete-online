import { io } from 'socket.io-client';
import { PROTOCOL_VERSION, BACKEND_RULES_VERSION, type BackendId } from '../shared/backend-protocol.js';
export type { BackendId } from '../shared/backend-protocol.js';

export interface BackendDefinition { id: BackendId; label: string; origin: string; transport: 'worker' | 'socketio'; enabled: boolean; allowInsecureHttp?: true }
export interface BackendStatus { backend: BackendDefinition; state: 'checking' | 'available' | 'unavailable' | 'undeployed'; latencyMs?: number; error?: string; entryUrl?: string }
const labels: Record<BackendId,string> = { cloudflare: 'Cloudflare', aliyun: '阿里云内地' };
const preferenceKey = 'magical-athlete:backend-preference:v1';
const pageOrigin = () => typeof location === 'undefined' ? 'http://localhost' : location.origin;
let definitions: BackendDefinition[] = [
  {id:'cloudflare',label:labels.cloudflare,origin:'',transport:import.meta.env?.VITE_HOST_MODE === 'browser' ? 'worker' : 'socketio',enabled:true},
  {id:'aliyun',label:labels.aliyun,origin:'',transport:'socketio',enabled:false},
];
let loading: Promise<BackendDefinition[]> | undefined;
export function isBackendId(value: unknown): value is BackendId { return value === 'cloudflare' || value === 'aliyun'; }
export function parseRoomCode(value:string): {code:string;backendId?:BackendId} | null {
  const match = /^(?:([CA])-)?([A-Z2-9]{6})$/.exec(value.trim().toUpperCase());
  return match ? {code:match[2]!,...(match[1] ? {backendId:match[1] === 'C' ? 'cloudflare' as const : 'aliyun' as const} : {})} : null;
}
export function formatRoomCode(code:string, backendId:BackendId):string { return `${backendId === 'cloudflare' ? 'C' : 'A'}-${parseRoomCode(code)?.code ?? code.toUpperCase()}`; }
export function validateBackendConfig(value:unknown):BackendDefinition[] {
  const input = value as {backends?:unknown};
  if (!input || !Array.isArray(input.backends) || input.backends.length !== 2) throw Error('服务器部署配置无效。');
  const seen = new Set<BackendId>();
  const result = input.backends.map((entry:unknown):BackendDefinition => {
    const item = entry as Record<string,unknown>;
    if (!item || !isBackendId(item.id) || seen.has(item.id) || typeof item.origin !== 'string' || !['worker','socketio'].includes(String(item.transport)) || typeof item.enabled !== 'boolean') throw Error('服务器部署配置无效。');
    seen.add(item.id);
    if (item.origin !== '') {
      const url = new URL(item.origin);
      if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || (url.protocol !== 'https:' && !(url.protocol === 'http:' && (['localhost','127.0.0.1','[::1]'].includes(url.hostname) || item.allowInsecureHttp === true)))) throw Error('服务器地址必须是受信 HTTPS 来源；临时 HTTP 须在部署配置中明确启用。');
    }
    if (item.allowInsecureHttp !== undefined && item.allowInsecureHttp !== true) throw Error('临时 HTTP 配置无效。');
    return {id:item.id,label:labels[item.id],origin:item.origin === '' ? '' : new URL(item.origin).origin,transport:item.transport as BackendDefinition['transport'],enabled:item.enabled,...(item.allowInsecureHttp === true ? {allowInsecureHttp:true as const} : {})};
  });
  return result;
}
export function getBackends():BackendDefinition[] { return definitions.map(backend => ({...backend})); }
export function getBackend(id:BackendId):BackendDefinition { const backend = definitions.find(item => item.id === id); if (!backend) throw Error('服务器部署配置无效。'); return backend; }
/** The deployment owns this same-origin file. Room links can never supply URLs. */
export async function loadBackends(force=false):Promise<BackendDefinition[]> {
  if(force)loading=undefined;
  return loading ??= (async () => {
    const response = await fetch('/backends.json',{cache:'no-store',signal:AbortSignal.timeout(4500)});
    if (!response.ok) throw Error('无法读取服务器部署配置，请重新检测。');
    definitions = validateBackendConfig(await response.json());
    return getBackends();
  })().catch(error => { loading = undefined; throw error; });
}
export function backendUrl(backend:BackendDefinition, path:string):string { return new URL(path,backend.origin || pageOrigin()).toString(); }
/** HTTPS cannot fetch/ws a public HTTP origin. Only a deployment-owned entry
 * link may change pages; it carries a room code, never a token or endpoint. */
export function httpEntryUrl(backend:BackendDefinition, code?:string, fromOrigin=pageOrigin()):string|null {
  if (!backend.enabled || !fromOrigin.startsWith('https:') || !backend.origin.startsWith('http:')) return null;
  if (['localhost','127.0.0.1','[::1]'].includes(new URL(backend.origin).hostname)) return null;
  const parsed=code ? parseRoomCode(code) : typeof location === 'undefined' ? null : parseRoomCode(location.pathname.replace(/^\/room\//,''));
  return backendUrl(backend,parsed ? `/room/${formatRoomCode(parsed.code,parsed.backendId??backend.id)}` : '/');
}
export function temporaryHttpPage():boolean { return pageOrigin().startsWith('http:') && !['localhost','127.0.0.1','[::1]'].includes(new URL(pageOrigin()).hostname); }
export function roomApiPrefix(backend:BackendDefinition):string { return backendUrl(backend,backend.transport === 'worker' ? '/api/browser/rooms' : '/api/rooms'); }
export function readBackendPreference():BackendId|null { try { const value = localStorage.getItem(preferenceKey); return isBackendId(value) ? value : null; } catch { return null; } }
export function saveBackendPreference(id:BackendId):void { try { localStorage.setItem(preferenceKey,id); } catch { /* Optional preference. */ } }
function validProbe(value:unknown,id:BackendId):boolean { const item=value as Record<string,unknown>; return !!item && item.ok === true && item.backendId === id && item.protocolVersion === PROTOCOL_VERSION && item.rulesVersion === BACKEND_RULES_VERSION; }
export async function probeBackend(id:BackendId):Promise<BackendStatus> {
  const backend=getBackend(id);
  if (!backend.enabled) return {backend,state:'undeployed'};
  const entryUrl=httpEntryUrl(backend);
  if (entryUrl) return {backend,state:'unavailable',error:'HTTPS 页面无法连接此 HTTP 服务器，请打开临时入口。',entryUrl};
  const started=performance.now();
  try {
    const http = (async () => {
      const response=await fetch(backendUrl(backend,'/api/connectivity'),{cache:'no-store',signal:AbortSignal.timeout(4500)});
      if(!response.ok || !validProbe(await response.json(),id)) throw Error('连接失败或服务版本不一致。');
    })();
    const realtime = backend.transport === 'worker' ? probeWorker(backend) : probeSocket(backend);
    // Wait for both to settle so no failed HTTP probe leaves its realtime peer running.
    const results=await Promise.allSettled([http,realtime]);
    const failure=results.find(result => result.status === 'rejected');
    if(failure?.status === 'rejected') throw failure.reason;
    return {backend,state:'available',latencyMs:Math.max(1,Math.round(performance.now()-started))};
  } catch { return {backend,state:'unavailable',error:'连接失败'}; }
}
function probeWorker(backend:BackendDefinition):Promise<void> {
  return new Promise((resolve,reject) => {
    const url=new URL(backendUrl(backend,'/api/connectivity/ws'));url.protocol=url.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws=new WebSocket(url);
    let done=false;
    const finish=(error?:Error) => {if(done)return;done=true;clearTimeout(timer);ws.onmessage=null;ws.onerror=null;ws.onclose=null;ws.close();error?reject(error):resolve();};
    const timer=setTimeout(()=>finish(Error('实时连接超时。')),4500);
    ws.onmessage=event=>{try{finish(validProbe(JSON.parse(String(event.data)),backend.id)?undefined:Error('协议版本不一致。'));}catch{finish(Error('连接失败。'));}};
    ws.onerror=()=>finish(Error('连接失败。'));ws.onclose=()=>finish(Error('连接已关闭。'));
  });
}
function probeSocket(backend:BackendDefinition):Promise<void> {
  return new Promise((resolve,reject) => {
    const socket=io(backend.origin || pageOrigin(),{auth:{probe:true},transports:['websocket'],autoConnect:false,reconnection:false,forceNew:true,timeout:4500});
    let done=false;
    const finish=(error?:Error)=>{if(done)return;done=true;clearTimeout(timer);socket.removeAllListeners();socket.disconnect();error?reject(error):resolve();};
    const timer=setTimeout(()=>finish(Error('实时连接超时。')),4500);
    socket.on('connectivity',value=>finish(validProbe(value,backend.id)?undefined:Error('协议版本不一致。')));
    socket.on('connect_error',()=>finish(Error('连接失败。')));socket.on('disconnect',()=>finish(Error('连接已关闭。')));socket.connect();
  });
}
export async function probeBackends():Promise<BackendStatus[]> { await loadBackends();return Promise.all(getBackends().map(backend=>probeBackend(backend.id))); }
