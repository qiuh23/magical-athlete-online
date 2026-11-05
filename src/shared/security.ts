import type { ChatMessage, ChatState } from './types.js';

export const SECURITY_UNAVAILABLE = '必要安全记录暂时无法保存，已暂停新的发布操作，请联系站长。';
export const STATIONMASTER_CONTACT = 'qiutian0808@163.com';
export type SecurityKind = 'network' | 'security' | 'admin';
export interface SecurityEvent {
  kind: SecurityKind; at: number; expiresAt: number;
  operation: string; outcome: string; transport?: 'http' | 'socketio' | 'worker-websocket';
  ip?: string; roomCode?: string; playerId?: string; target?: string; reason?: string;
}
/** Add calendar months in UTC, clamping month-end rather than overflowing. */
export function networkExpiry(at:number):number {
  const date=new Date(at),day=date.getUTCDate();date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+6);
  const end=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();date.setUTCDate(Math.min(day,end));return date.getTime();
}
export function securityEvent(input:Omit<SecurityEvent,'at'|'expiresAt'>,at=Date.now()):SecurityEvent {
  // Explicit allowlist: never spread a request, identity, exception or game state.
  const event:SecurityEvent={kind:input.kind,at,expiresAt:input.kind==='admin'?at+90*86400000:networkExpiry(at),operation:String(input.operation).slice(0,64),outcome:String(input.outcome).slice(0,32)};
  if(input.transport)event.transport=input.transport;
  if(input.ip)event.ip=input.ip.slice(0,64);
  if(input.roomCode&&/^[A-Z2-9]{6}$/.test(input.roomCode))event.roomCode=input.roomCode;
  if(input.playerId&&/^[\da-f-]{36}$/i.test(input.playerId))event.playerId=input.playerId;
  if(input.target)event.target=input.target.slice(0,100);
  if(input.reason)event.reason=input.reason.trim().slice(0,200);
  return event;
}
export type ModerationAction = {action:'inspect'} | {action:'hide-chat';seq:number;reason:string} | {action:'restrict-member'|'reset-name';memberId:string;reason:string} | {action:'close-room';reason:string};
export function moderationAction(value:unknown):ModerationAction {
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('处置格式错误。');
  const input=value as Record<string,unknown>,action=input.action;
  const keys=action==='inspect'?['action']:action==='hide-chat'?['action','seq','reason']:action==='restrict-member'||action==='reset-name'?['action','memberId','reason']:action==='close-room'?['action','reason']:[];
  if(!keys.length||Object.keys(input).some(key=>!keys.includes(key)))throw Error('处置格式错误。');
  if(action==='inspect')return {action};
  if(typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>200||/[\p{Cc}\p{Cf}]/u.test(input.reason))throw Error('请填写1～200字的处置原因，不要填写秘密。');
  const reason=input.reason.trim();
  if(action==='hide-chat'){if(!Number.isSafeInteger(input.seq)||(input.seq as number)<1)throw Error('消息编号错误。');return {action,seq:input.seq as number,reason};}
  if(action==='close-room')return {action,reason};
  if(typeof input.memberId!=='string'||!/^[\da-f-]{36}$/i.test(input.memberId))throw Error('成员编号错误。');
  return {action:action as 'restrict-member'|'reset-name',memberId:input.memberId,reason};
}
export function hiddenMessage(message:ChatMessage):ChatMessage {return {id:message.id,sentAt:message.sentAt,senderName:'站长',text:'[此内容已由站长隐藏]',kind:'system',hidden:true};}
export function redactChat(state:ChatState|undefined,hidden:ReadonlySet<number>,reset:ReadonlySet<string>):ChatState|undefined {
  if(!state)return state;
  return {...state,messages:state.messages.map(message=>hidden.has(message.id)||message.hidden?hiddenMessage(message):message.senderId&&reset.has(message.senderId)?{...message,moderated:true,senderName:'成员'+message.senderId.slice(0,8),...(message.kind==='system'?{text:'昵称已由站长处理。'}:{})}:message)};
}
export function adminTokenConfigured(secret:unknown):secret is string {return typeof secret==='string'&&/^[A-Za-z0-9_-]{32,256}$/.test(secret);}
export function routeOperation(path:string):string {return path.includes('/stationmaster/')?'stationmaster':path.includes('/join')?'join':path.includes('/resume-status')?'resume':path.includes('/leave')?'leave':path.includes('/ws/')?'websocket':/\/rooms\/?$/.test(path)?'rooms':'api-other';}
