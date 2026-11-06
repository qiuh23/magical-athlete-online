import { CHARACTER_BY_ID } from './characters.js';
import type { GameEvent, Room } from './types.js';

export type SiteEdition = 'cn' | 'global';
export const CN_COMMUNICATION_DISABLED = '当前站点不提供玩家交流功能。';
export const CN_NICKNAME_FIXED = '当前站点仅使用固定随机昵称，加入房间后不能改名。';
export const FOREIGN_INVITATION = '此邀请不属于当前站点，请向房主确认原始邀请链接。';
export const SITE_NICKNAMES = ['追风','冲线','接力','晨跑','竞走','弯道','跨栏','助跑','腾空','跃动','挥拍','网前','上旋','弧线','落点','发球','三分','上篮','远投','妙传','空切','篮板','泳道','划桨','冲浪','领骑','滑板','雪道','滑翔','飞盘','跳绳','秒表'].map((name,index)=>({id:`athlete-${String(index+1).padStart(2,'0')}`,name}));
export function readSiteEdition(value:unknown,production=false):SiteEdition {
  if(value==='cn'||value==='global')return value;
  if(value!==undefined&&value!=='')throw Error('SITE_EDITION 必须为 cn 或 global。');
  if(production)throw Error('生产部署必须明确配置 SITE_EDITION。');
  return 'global';
}
export const nicknameById = (id:unknown) => SITE_NICKNAMES.find(item=>item.id===id);
export interface FixedNickname { nicknameId?:string; nicknameBadge?:number; name:string }
// Web Crypto is independent of every game's deterministic random stream.
function randomIndex(length:number):number { const bytes=new Uint32Array(1);crypto.getRandomValues(bytes);return bytes[0]!%length; }
export function requestedNickname(name:unknown,id?:unknown):string {
  const entry=id===undefined?SITE_NICKNAMES.find(item=>item.name===name):nicknameById(id);
  if(!entry||(name!==undefined&&name!==entry.name))throw Error(CN_NICKNAME_FIXED);
  return entry.id;
}
export function assignFixedNickname(occupied:Iterable<FixedNickname>,preferred?:string):Required<FixedNickname> {
  const members=[...occupied],available=SITE_NICKNAMES.filter(item=>!members.some(member=>member.nicknameId===item.id));
  const entry=available.find(item=>item.id===preferred)??(available.length?available[randomIndex(available.length)]!:nicknameById(preferred)??SITE_NICKNAMES[randomIndex(SITE_NICKNAMES.length)]!);
  let nicknameBadge=0;
  if(!available.length){nicknameBadge=1;while(members.some(member=>member.nicknameId===entry.id&&(member.nicknameBadge??0)===nicknameBadge))nicknameBadge++;}
  return {name:entry.name,nicknameId:entry.id,nicknameBadge};
}
export function migrateCnMembers<T extends FixedNickname>(members:T[]):void {
  const allocated:FixedNickname[]=[];
  // Existing stable IDs take precedence over allocation for legacy members.
  const reserved=members.filter(member=>nicknameById(member.nicknameId));
  for(const member of members){
    const entry=nicknameById(member.nicknameId);
    if(entry){member.name=entry.name;member.nicknameBadge??=0;}
    else Object.assign(member,assignFixedNickname([...reserved,...allocated]));
    allocated.push(member);
  }
}
export function redactLegacyEvent(event:GameEvent):GameEvent { return {...event,text:'历史游戏记录（昵称已更新）',...(event.rollReason!==undefined?{rollReason:'游戏掷骰'}:{}),...(event.actor?{actor:{...event.actor,name:'游戏角色'}}:{})}; }
/** Retains identity, cards, resources, scores, clocks, RNG and event metadata. */
export function migrateCnRoom(room:Room):Room {
  const members=[...room.game.players,...(room.spectators??[])];
  const legacy=room.cnPolicyVersion!==1||members.some(member=>!nicknameById(member.nicknameId)||nicknameById(member.nicknameId)?.name!==member.name);
  migrateCnMembers(members);
  if(legacy){
    // Earlier rename history has no authenticated actor IDs. Keep the event's
    // animation/score metadata, but do not publish unreconstructable old text.
    room.game.logs=room.game.logs.map(event=>{
      const racer=room.game.racers.find(racer=>racer.id===event.source);
      const player=members.find(member=>member.id===racer?.playerId);
      return {...redactLegacyEvent(event),...(player?{text:`${player.name}：历史游戏记录`}:{})};
    });
    // Pending prompts may predate multiple renames. Rebuild from trusted IDs,
    // rather than replacing only the most recently saved nickname.
    if(room.game.pending){
      const labels:Record<string,string>={yes:'是',no:'否',skip:'跳过',roll:'掷骰',block:'阻止技能',allow:'允许结算'};
      room.game.pending.title='请根据技能说明选择操作。';
      room.game.pending.options=room.game.pending.options.map((option,index)=>{
        const racer=room.game.racers.find(racer=>racer.id===option.id);
        const owner=members.find(member=>member.id===(racer?.playerId??option.id));
        const character=CHARACTER_BY_ID[racer?.characterId??option.id];
        const label=character?`${owner?owner.name+' · ':''}${character.nameZh}`:owner?.name??labels[option.id]??`选项${index+1}`;
        return {...option,label};
      });
    }
  }
  room.siteEdition='cn';room.cnPolicyVersion=1;
  room.chat={messages:[],latestId:0,windows:{}};
  return room;
}


/** Legacy browser hosts may submit game state, but never arbitrary display IDs. */
export function validateCnLegacyDisplay(value:unknown):void {
  const cards=new Set(['characterId','offeredCharacterId','sourceCardId','eggCardId','selectedCardId','cardId']);
  const cardLists=new Set(['characterIds','market','hand','selection','used','powers','ownedPowers','acquired','grantedPowerIds']);
  const numbers=new Set(['score','points','handCount','position','rank','round','turnCount','face','distance']);
  const visit=(item:unknown):void=>{
    if(!item||typeof item!=='object')return;
    if(Array.isArray(item)){for(const child of item)visit(child);return;}
    for(const [key,child] of Object.entries(item)){
      if(cards.has(key)&&child!==undefined&&(typeof child!=='string'||!Object.hasOwn(CHARACTER_BY_ID,child)))throw Error('旧版游戏状态包含无效角色编号。');
      if(cardLists.has(key)&&child!==undefined&&(!Array.isArray(child)||child.some(id=>typeof id!=='string'||!Object.hasOwn(CHARACTER_BY_ID,id))))throw Error('旧版游戏状态包含无效卡牌编号。');
      if(numbers.has(key)&&child!==undefined&&(typeof child!=='number'||!Number.isFinite(child)))throw Error('旧版游戏状态包含无效数值。');
      visit(child);
    }
  };
  visit(value);
}


export function validateSiteRegistry(value:string|undefined,edition:SiteEdition,transport:'worker'|'socketio'):void {
  if(value===undefined)return;
  try{
    const config=JSON.parse(value),entry=config.backends?.[0];
    if(config.siteEdition!==edition||config.backends.length!==1||entry.id!==(edition==='cn'?'aliyun':'cloudflare')||entry.origin!==''||entry.transport!==transport||entry.enabled!==true)throw Error();
  }catch{throw Error('公开入口配置与 SITE_EDITION 不匹配。');}
}
