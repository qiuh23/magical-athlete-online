import { assignFixedNickname, migrateCnRoom, requestedNickname, readSiteEdition, CN_COMMUNICATION_DISABLED, CN_NICKNAME_FIXED, type SiteEdition } from '../shared/site-policy.js';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { secureRandomSeed } from '../shared/random.js';
import type { ActionEnvelope, ActionReply, CharacterPool, ChatReply, GameMode, Identity, Player, RenameReply, Room, RoomRole, RoomSummary, RoomView } from '../shared/types.js';
import { appendChat, appendPlayerChat, chatBatch, deduplicateStoredNicknames, uniqueNickname, validateChatSend, validateNickname } from '../shared/chat.js';
import { immediateRoomAction } from '../shared/automation.js';
import { projectRoom, reduceRoomAction, setRoomDeadline, updateOwnerPresence } from '../shared/room-core.js';
import { createGame, startGame } from '../engine/index.js';
import { timeoutRoomAction as timeoutAction, LEGACY_RULES_VERSION } from '../engine/runtime.js';
import { Store } from './store.js';
import { MAX_SPECTATORS, ROOM_TTL_MS } from '../shared/constants.js';
import { roomExpiry, type RoomCloseReason, type RoomClosure } from '../shared/room-lifecycle.js';
import { continuationAction, continuationPaused, offerContinuation, updateContinuation } from '../shared/room-continuation.js';
import { legacyRoomConfig, legacyPoolForConfig, validateRoomConfigForPlayers, type RoomConfig } from '../shared/room-config.js';
import { redactChat, type ModerationAction } from '../shared/security.js';

export const PLAYER_COLORS = ['#df3c32','#175bd1','#159269','#b34fa6','#eb8a19','#6d57c7','#008eaa','#77503c'];
export { ROOM_TTL_MS } from '../shared/constants.js';
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
type PresenceRoom = Room & {hostSeenAt?:number};
export class Rooms {
  readonly rooms = new Map<string, Room>();
  onExpired?: (code:string, expiresAt:number, reason?:RoomCloseReason) => void;
  onChanged?: (code:string) => void;
  constructor(readonly store: Store, readonly defaultTimeout = 120, readonly now=Date.now, readonly siteEdition:SiteEdition=readSiteEdition(process.env.SITE_EDITION,process.env.NODE_ENV==='production')) {
    if(siteEdition==='cn')store.security.enabled=false;
    const restoredAt=this.now();
    for(const room of store.load()) {
      if(room.siteEdition&&room.siteEdition!==siteEdition)throw Error('存档站点策略与 SITE_EDITION 不匹配。');
      if(store.security.targets(room.code,'closed').size){store.closeRoom({code:room.code,closedAt:restoredAt,reason:'dismissed'});continue;}
      this.redact(room);
      room.game.rulesVersion??=LEGACY_RULES_VERSION;
      const healed=this.siteEdition==='cn'?[...room.game.players,...(room.spectators??[])]:deduplicateStoredNicknames([...room.game.players,...(room.spectators??[])]);
      room.game.players=room.game.players.map(player=>({...player,name:healed.find(member=>member.id===player.id)!.name}));
      room.spectators=room.spectators?.map(spectator=>({...spectator,name:healed.find(member=>member.id===spectator.id)!.name}));
      room.ownerId??=room.game.players.find(player=>player.seat===0)?.id??room.hostId;
      room.hostId=room.ownerId;
      if(room.closedAt!==undefined){store.closeRoom({code:room.code,closedAt:room.closedAt,reason:room.closeReason??'dismissed',hostId:room.hostId,version:room.version});continue;}
      // A restart ends all Node connections. Preserve an existing absence;
      // rooms whose owner was online begin their absence at this restart.
      if(room.closedAt===undefined)room.hostLeftAt??=(room as PresenceRoom).hostSeenAt??room.updatedAt;
      updateOwnerPresence(room,false,restoredAt);
      if(roomExpiry(room)<=restoredAt){store.closeRoom({code:room.code,closedAt:room.closedAt??roomExpiry(room),reason:room.closeReason??'host-away'});continue;}
      if(room.closedAt===undefined){room.game.players.forEach(p => p.connected = !!p.isAI);room.spectators?.forEach(p=>p.connected=false);store.save(room);}
      this.rooms.set(room.code, room);
    }
  }
  private redact(room:Room):Room {
    const security=this.store.security,names=security.targets(room.code,'name');
    room.chat=redactChat(room.chat,new Set([...security.targets(room.code,'hidden')].map(Number)),names);
    for(const member of [...room.game.players,...(room.spectators??[])])if(names.has(member.id)){if(this.siteEdition==='global')member.name='成员'+member.id.slice(0,8);if('renameUsed' in member)member.renameUsed=true;}
    const through=Math.max(0,...[...security.targets(room.code,'events')].map(Number));
    if(through)room.game.logs=room.game.logs.map(event=>event.id<=through?{...event,text:'[历史文字记录的昵称已由站长处理]'}:event);
    if(this.siteEdition==='cn')migrateCnRoom(room);
    return room;
  }
  private publication(code:string,id:string,operation:string):void {
    if(this.store.security.isRestricted(code,id))throw Error('此成员已被站长限制聊天和改名。');
    this.store.security.append({kind:'security',operation,outcome:'authorized',roomCode:code,playerId:id});
  }
  moderate(code:string,input:ModerationAction):unknown {
    if(this.siteEdition==='cn')throw Error('当前站点已停用交流处置和安全审计。');
    const original=this.get(code);
    if(input.action==='inspect')return {code:original.code,members:[...original.game.players,...(original.spectators??[])].map(({id,name})=>({id,name,restricted:this.store.security.isRestricted(original.code,id)})),messages:this.redact(structuredClone(original)).chat?.messages??[]};
    const target=input.action==='hide-chat'?String(input.seq):input.action==='close-room'?original.code:input.memberId;
    if('memberId' in input&&![...original.game.players,...(original.spectators??[])].some(p=>p.id===input.memberId))throw Error('成员不存在。');
    const kind=input.action==='hide-chat'?'hidden':input.action==='restrict-member'?'restricted':input.action==='reset-name'?'name':'closed';
    const message=input.action==='hide-chat'?original.chat?.messages.find(message=>message.id===input.seq&&!message.hidden):undefined;
    if(input.action==='hide-chat'&&!message)throw Error('当前聊天窗口中没有这条消息，或已经隐藏。');
    const evidence=message?{seq:message.id,text:message.text,senderId:message.senderId,senderName:message.senderName,sentAt:message.sentAt}:input.action==='reset-name'?{memberId:input.memberId,name:[...original.game.players,...(original.spectators??[])].find(p=>p.id===input.memberId)!.name,eventThrough:original.game.logs.at(-1)?.id??0}:undefined;
    const recordId=this.store.security.disposition(original.code,kind,target,input.reason,evidence);
    if(input.action==='close-room'){
      const closedAt=this.now();this.rooms.delete(original.code);
      try{this.store.closeRoom({code:original.code,closedAt,reason:'dismissed',hostId:original.hostId,version:original.version});}catch{console.error('MODERATION_CLOSE_ROOM_SAVE_FAILED: durable ledger forbids reopening.');}
      this.onExpired?.(original.code,closedAt,'dismissed');
    }
    else {const room=this.redact(structuredClone(original));room.version++;room.updatedAt=this.now();this.rooms.set(room.code,room);try{
      this.store.save(room);
      if(input.action==='reset-name')this.store.db.prepare("DELETE FROM member_receipts WHERE room_code=? AND kind='rename'").run(room.code);
      if(input.action==='hide-chat'&&message?.senderId&&message.clientMessageId)this.store.db.prepare("UPDATE member_receipts SET request='',result=? WHERE room_code=? AND player_id=? AND kind='chat' AND request_id=?").run(JSON.stringify({ok:false,error:'此消息已由站长隐藏。'}),room.code,message.senderId,message.clientMessageId);
    }catch{console.error('MODERATION_ROOM_SAVE_FAILED: durable ledger remains authoritative; retry room persistence.');}this.onChanged?.(room.code);}
    return {ok:true,recordId};
  }
  expire(code:string,now=this.now()):boolean {
    const room=this.rooms.get(code);
    if(!room)return false;
    if(updateContinuation(room,now)){this.store.save(room);if(room.closedAt===undefined)this.onChanged?.(code);}
    if(room.closedAt===undefined&&roomExpiry(room)>now)return false;
    if(offerContinuation(room,now)){this.store.save(room);this.onChanged?.(code);return false;}
    const at=room.closedAt??roomExpiry(room),reason=room.closeReason??'host-away';
    this.closePersonal(room,reason,at);
    this.onExpired?.(code,at,reason);return true;
  }
  closed(code:string):RoomClosure|undefined {const closed=this.store.closed(code);if(closed)return closed;const at=this.store.security.closedAt(code);return at===undefined?undefined:{code,closedAt:at,reason:'dismissed'};}
  private closePersonal(room:Room,reason:RoomCloseReason,closedAt:number,actionId?:string):void {
    this.store.security.append({kind:'security',operation:'room-close',outcome:reason,roomCode:room.code});
    this.store.closeRoom({code:room.code,closedAt,reason,hostId:room.hostId,version:room.version,actionId});this.rooms.delete(room.code);
  }
  get(code: string): Room { code=code.toUpperCase();this.expire(code);const room = this.rooms.get(code); if(!room) {const closed=this.closed(code);throw Error(closed?.reason==='host-away'?'房主离线保留期限已到，房间已关闭。':closed?'房间已关闭。请创建或加入其他房间。':'房间不存在或已过期，请检查房间码。');}return this.redact(room); }
  list(now=this.now()):RoomSummary[] {
    for(const code of this.rooms.keys())this.expire(code,now);
    return [...this.rooms.values()].filter(room=>room.closedAt===undefined&&room.mode!=='practice'&&room.game.config?.visibility!=='private').sort((a,b)=>b.createdAt-a.createdAt).map(room=>({
      code:room.code,hostName:room.game.players.find(p=>p.id===(room.ownerId??room.hostId))?.name??'房主',phase:room.game.phase,
      playerCount:room.game.players.length,maxPlayers:room.maxPlayers,spectatorCount:room.spectators?.filter(p=>p.connected).length??0,
      createdAt:room.createdAt,expiresAt:roomExpiry(room),authorityOnline:true,mode:room.mode??'multiplayer',
    }));
  }
  player(name: string, seat: number): Player { return {id:randomUUID(),name,seat,color:PLAYER_COLORS[seat]!,ready:false,connected:false,score:0,hand:[],used:[],selection:[]}; }
  capacity(){return this.store.capacity(this.now());}
  create(name: string, maxPlayers: number, timeoutSeconds?: number, mode:GameMode='multiplayer', aiCount=3, characterPool:CharacterPool='original', config?:RoomConfig, requestId?:string, nicknameId?:string): {identity:Identity;room:RoomView} {
    for(const code of this.rooms.keys())this.expire(code);
    if(this.rooms.size >= 500) throw Error('当前房间较多，请稍后重试。');
    let code: string; do { code = Array.from(randomBytes(6), b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 31]).join(''); } while(this.rooms.has(code)||this.closed(code));
    if(!['multiplayer','practice','ai'].includes(mode))throw Error('比赛模式无效。');
    if(mode==='ai'&&(!Number.isInteger(aiCount)||aiCount<1||aiCount>7))throw Error('AI人数需为1～7。');
    if(mode!=='multiplayer')maxPlayers=mode==='practice'?1:aiCount+1;
    if(!['original','second-wind','mixed','wurstii','all'].includes(characterPool))throw Error('角色牌池无效。');
    if(requestId!==undefined&&!/^[a-zA-Z0-9_-]{16,100}$/.test(requestId))throw Error('建房请求编号无效。');
    const rules=validateRoomConfigForPlayers(config??legacyRoomConfig(characterPool,mode==='practice'),maxPlayers,mode==='practice');
    if(config)characterPool=legacyPoolForConfig(rules);
    const request=JSON.stringify({name,maxPlayers,timeoutSeconds:timeoutSeconds??this.defaultTimeout,mode,aiCount,characterPool,config:rules});
    const prior=requestId?this.store.creationReceipt<{identity:Identity;room:RoomView}>(requestId):undefined;
    if(prior){if(prior.request!==request)throw Error('同一建房请求编号不能用于不同设置。');const code=prior.result.identity.roomCode;if(this.siteEdition==='cn'||this.store.security.targets(code,'name').size||this.store.security.targets(code,'closed').size){const room=this.get(code);return {...prior.result,room:this.view(room,prior.result.identity.playerId)};}return prior.result;}
    const fixedId=this.siteEdition==='cn'?requestedNickname(name,nicknameId):undefined;
    const p = this.player(uniqueNickname(name,[]),0);if(this.siteEdition==='cn')Object.assign(p,assignFixedNickname([],fixedId)); const now=this.now();
    this.store.security.append({kind:'security',operation:'create',outcome:'authorized',roomCode:code,playerId:p.id});
    const players=[p,...Array.from({length:mode==='ai'?aiCount:0},(_,i)=>({...this.player(`电脑${i+1}`,i+1),isAI:true,ready:true,connected:true}))];
    for(let i=1;i<players.length;i++)players[i]!.name=uniqueNickname(players[i]!.name,players.slice(0,i).map(person=>person.name));
    if(this.siteEdition==='cn'){for(let i=1;i<players.length;i++)Object.assign(players[i]!,assignFixedNickname(players.slice(0,i)));}
    const room:Room = {siteEdition:this.siteEdition,mode,code,hostId:p.id,ownerId:p.id,hostLeftAt:now,createdAt:now,updatedAt:now,version:1,maxPlayers,timeoutSeconds:timeoutSeconds??this.defaultTimeout,deadline:null,game:createGame(players,secureRandomSeed(),mode,characterPool)};
    room.game.config=rules;room.configFrozen=false;
    if(mode!=='multiplayer'){p.ready=true;room.game.players[0]!.ready=true;startGame(room.game);room.configFrozen=true;this.deadline(room);}
    const token = randomBytes(32).toString('base64url');
    const result=this.store.createRoom(room,p.id,hash(token),{identity:{roomCode:code,playerId:p.id,token,role:'player' as const},room:this.view(room,p.id)},now,requestId,request);
    if(result.identity.roomCode===code)this.rooms.set(code,room);
    return result;
  }
  join(code: string, name: string,role:RoomRole='player',nicknameId?:string): {identity:Identity;room:RoomView} {
    const original=this.get(code); if(original.closedAt!==undefined) throw Error('房间已解散。请创建或加入其他房间。');
    this.store.security.append({kind:'security',operation:'join',outcome:'authorized',roomCode:original.code});
    const occupied=[...original.game.players,...(original.spectators??[])];
    const fixed=this.siteEdition==='cn'?assignFixedNickname(occupied,requestedNickname(name,nicknameId)):undefined;
    name=fixed?.name??uniqueNickname(name,occupied.map(person=>person.name));
    if(role==='spectator') {
      if((original.spectators?.length??0)>=MAX_SPECTATORS)throw Error('观战人数已满，请稍后再试。');
      const room=structuredClone(original),spectator={id:randomUUID(),name,connected:false,...fixed};
      room.spectators=[...(room.spectators??[]),spectator];room.version++;room.updatedAt=Date.now();
      const token=randomBytes(32).toString('base64url');this.store.addIdentity(room,spectator.id,hash(token));this.rooms.set(room.code,room);
      return{identity:{roomCode:room.code,playerId:spectator.id,token,role},room:this.view(room,spectator.id)};
    }
    if(role!=='player')throw Error('加入身份无效。');
    if(original.mode==='practice'||original.mode==='ai')throw Error('此对局为自己练习或人机模式。');
    if(original.game.phase!=='lobby') throw Error('比赛已经开始，席位已锁定。原玩家请使用原浏览器重连。');
    if(original.game.players.length >= original.maxPlayers) throw Error('房间已满。');
    const room=structuredClone(original);let seat=0;while(room.game.players.some(p=>p.seat===seat))seat++;
    const p={...this.player(name,seat),...fixed}; room.game.players.push(p);room.game.players.sort((a,b)=>a.seat-b.seat);room.version++; room.updatedAt=Date.now();
    const token=randomBytes(32).toString('base64url'); this.store.addIdentity(room,p.id,hash(token)); this.rooms.set(room.code,room);
    return {identity:{roomCode:room.code,playerId:p.id,token,role},room:this.view(room,p.id)};
  }
  authenticate(identity: Identity): Room {
    const room=this.get(identity.roomCode); if(room.closedAt!==undefined) throw Error('房间已解散。请创建或加入其他房间。');
    const expected=this.store.identity(room.code,identity.playerId);
    const role=room.game.players.some(p=>p.id===identity.playerId)?'player':room.spectators?.some(p=>p.id===identity.playerId)?'spectator':undefined;
    if(!expected || !role || (identity.role!==undefined&&identity.role!==role)) throw Error('身份已失效。请使用原浏览器和邀请链接恢复。');
    const actual=hash(identity.token); if(!timingSafeEqual(Buffer.from(expected),Buffer.from(actual))) throw Error('重连凭据无效。请使用原浏览器。'); return room;
  }
  presence(code: string, id: string, connected: boolean): void {
    if(this.expire(code))return;
    const original=this.rooms.get(code);if(!original||original.closedAt!==undefined)return;
    const member=original.game.players.find(p=>p.id===id)??original.spectators?.find(p=>p.id===id);
    if(!member||(member.connected===connected&&!(original.ownerId===id&&connected&&original.hostLeftAt!==undefined)))return;
    const room=structuredClone(original);(room.game.players.find(p=>p.id===id)??room.spectators!.find(p=>p.id===id)!).connected=connected;
    if(room.ownerId===id){updateOwnerPresence(room,connected,this.now());if(connected)(room as PresenceRoom).hostSeenAt=this.now();}
    room.version++;room.updatedAt=this.now(); this.store.save(room); this.rooms.set(code,room);
  }
  leave(identity:Identity):{ok:true;retainIdentity:boolean} {
    const original=this.authenticate(identity),room=structuredClone(original),id=identity.playerId;
    const spectator=room.spectators?.some(p=>p.id===id)??false;
    const retainIdentity=!spectator&&(room.game.phase!=='lobby'||room.ownerId===id);
    if(spectator)room.spectators=room.spectators!.filter(p=>p.id!==id);
    else if(retainIdentity)room.game.players.find(p=>p.id===id)!.connected=false;
    else room.game.players=room.game.players.filter(p=>p.id!==id);
    if(room.ownerId===id)updateOwnerPresence(room,false,this.now());
    room.version++;room.updatedAt=Date.now();
    if(retainIdentity)this.store.transaction(()=>this.store.save(room));else this.store.removeIdentity(room,id);
    this.rooms.set(room.code,room);return{ok:true,retainIdentity};
  }
  act(code: string, id: string, envelope: ActionEnvelope, automatic=false): ActionReply {
    const closed=this.closed(code);
    if(closed)return closed.actionId===envelope.actionId&&closed.hostId===id&&envelope.action.type==='close'?{ok:true,duplicate:true,version:closed.version}:{ok:false,error:'房间已关闭。请创建或加入其他房间。',version:closed.version};
    const original=this.get(code); const request=JSON.stringify(envelope.action);
    const receipt=this.store.receipt(code,id,envelope.actionId);
    if(receipt) return receipt.request===request ? {...receipt.result,duplicate:true} : {ok:false,error:'同一操作编号不能用于不同操作。'};
    if(original.closedAt!==undefined) return {ok:false,error:'房间已解散。请创建或加入其他房间。',version:original.version};
    if(original.version!==envelope.expectedVersion&&!(continuationAction(envelope.action)&&envelope.expectedVersion<=original.version)) return {ok:false,error:'画面已更新，请同步后重试。',version:original.version};
    try {
      const room=reduceRoomAction(original,id,envelope.action,{now:this.now(),rematchSeed:envelope.action.type==='rematch'?secureRandomSeed():0,automatic});
      if(envelope.action.type==='transfer')(room as PresenceRoom).hostSeenAt=this.now();
      if(room.closedAt!==undefined){this.closePersonal(room,room.closeReason??'dismissed',room.closedAt,envelope.actionId);return{ok:true,version:room.version};}
      const result={ok:true,version:room.version};this.store.commitAction(room,id,envelope.actionId,request,result,envelope.action.type==='kick'?envelope.action.playerId:undefined);this.rooms.set(code,room);return result;
    }catch(e){return{ok:false,error:e instanceof Error?e.message:'操作失败，请重试。',version:original.version};}
  }
  chat(code:string,id:string,input:unknown):ChatReply {
    if(this.siteEdition==='cn')return {ok:false,error:CN_COMMUNICATION_DISABLED};
    try {
      const original=this.get(code),person=original.game.players.find(p=>p.id===id)??original.spectators?.find(p=>p.id===id);
      if(!person||('isAI' in person&&person.isAI))throw Error('只有当前房间内的真人成员可以聊天。');
      if(this.store.security.isRestricted(code,id))throw Error('此成员已被站长限制聊天和改名。');
      const message=validateChatSend(input),prior=this.store.memberReceipt<ChatReply>(code,id,'chat',message.clientMessageId);
      if(prior){if(prior.result.message&&this.store.security.targets(code,'hidden').has(String(prior.result.message.id)))return {ok:false,error:'此消息已由站长隐藏。'};return prior.request===message.text?{...prior.result,duplicate:true}:{ok:false,error:'同一消息编号不能用于不同内容。'};}
      this.publication(code,id,'chat');
      const room=structuredClone(original);room.chat=appendPlayerChat(room.chat,id,person.name,message,this.now());
      const result:ChatReply={ok:true,message:room.chat.messages.at(-1)!};
      this.store.commitMember(room,id,'chat',message.clientMessageId,message.text,result);this.rooms.set(code,room);return result;
    }catch(error){return{ok:false,error:error instanceof Error?error.message:'消息发送失败。'};}
  }
  chatHistory(code:string,id:string,afterId=0){
    if(this.siteEdition==='cn')return {messages:[],latestId:0};
    const room=this.get(code);if(!room.game.players.some(p=>p.id===id)&&!room.spectators?.some(p=>p.id===id))throw Error('你不是当前房间成员。');
    return chatBatch(room.chat,afterId);
  }
  rename(code:string,id:string,requestId:unknown,name:unknown):RenameReply {
    if(this.siteEdition==='cn')return {ok:false,error:CN_NICKNAME_FIXED};
    try {
      if(typeof requestId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(requestId))throw Error('改名请求编号无效。');
      const original=this.get(code),player=original.game.players.find(p=>p.id===id);
      if(!player||player.isAI)throw Error('只有真人参赛玩家可以修改昵称。');
      const requested=validateNickname(name);
      this.publication(code,id,'rename');
      const prior=this.store.memberReceipt<RenameReply>(code,id,'rename',requestId);
      if(prior)return prior.request===requested?{...prior.result,duplicate:true}:{ok:false,error:'同一请求编号不能用于不同昵称。'};
      if(original.game.phase==='lobby')throw Error('请在对局开始后修改昵称。');
      if(player.renameUsed)throw Error('本局已修改过昵称。');
      const finalName=uniqueNickname(requested,[...original.game.players,...(original.spectators??[])].filter(p=>p.id!==id).map(p=>p.name));
      if(finalName===player.name)throw Error('新昵称与当前昵称相同。');
      const room=structuredClone(original),next=room.game.players.find(p=>p.id===id)!;
      next.name=finalName;next.renameUsed=true;next.renameRequestId=requestId;room.version++;room.updatedAt=this.now();
      room.chat=appendChat(room.chat,{senderId:id,senderName:'系统',text:`${player.name} 已改名为 ${finalName}`,sentAt:this.now(),kind:'system'});
      const result:RenameReply={ok:true,name:finalName,remaining:0};
      this.store.commitMember(room,id,'rename',requestId,requested,result);this.rooms.set(code,room);return result;
    }catch(error){return{ok:false,error:error instanceof Error?error.message:'修改昵称失败。'};}
  }
  deadline(room: Room): void { setRoomDeadline(room,this.now()); }
  tick(now=this.now()): string[] {
    const updated:string[]=[];
    for(const cached of this.rooms.values()){
      if(this.expire(cached.code,now))continue;
      const original=this.rooms.get(cached.code)!;
      if(original.closedAt!==undefined)continue;
      if(continuationPaused(original))continue;
      // Persist owner liveness independently of AI turns. After a crash the
      // restart can count downtime instead of resetting the thirty-minute clock.
      if(original.game.players.some(p=>p.id===original.ownerId&&p.connected)&&now-((original as PresenceRoom).hostSeenAt??0)>=15_000){
        (original as PresenceRoom).hostSeenAt=now;this.store.save(original);
      }
      // Local server bots pause when the human leaves; no unattended match
      // consumes their remaining turns while they are disconnected.
      if((original.mode==='ai'||original.mode==='practice')&&!original.game.players.some(p=>!p.isAI&&p.connected))continue;
      if(original.pause)continue;
      const immediate=immediateRoomAction(original,now);
      if(!immediate&&(!original.deadline||original.deadline>now))continue;
      const a=immediate??timeoutAction(original.game);if(!a)continue;
      const result=this.act(original.code,a.playerId,{actionId:randomUUID(),expectedVersion:original.version,action:a.action},!immediate);
      if(result.ok)updated.push(original.code);
    }
    return updated;
  }
  view(room: Room, id: string): RoomView {
    return {...projectRoom(this.redact(room),id,{authorityId:room.hostId,authorityOnline:true}),...(this.siteEdition==='cn'?{chat:[],chatLatestId:0,renameRemaining:0}:{}),contentRevision:this.store.security.revision(room.code),hosting:'local'};
  }
}
