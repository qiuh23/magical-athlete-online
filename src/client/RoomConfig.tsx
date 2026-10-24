import { useEffect, useState } from 'react';
import { CHARACTERS } from '../shared/characters.js';
import { CHARACTER_PACK_IDS, legacyRoomConfig, characterResources, roomConfigError, type RoomConfig, type CharacterPackId } from '../shared/room-config.js';
import type { GameAction, RoomView } from '../shared/types.js';
import './room-config.css';
import { CompetitionFields, competitionSummary, SchedulePreview } from './CompetitionFields.js';
import { competitionConfig } from '../shared/competition.js';

const PACK_INFO: Record<CharacterPackId,{ name:string; kind:string; description:string; source:string }> = {
  original:{name:'基础角色包',kind:'原版',description:'CMYK 基础角色与已采用 FAQ 裁定。',source:'https://www.cmyk.games/products/magical-athlete'},
  'second-wind':{name:'Second Wind',kind:'续作 · 实验性实现',description:'沿用项目已实现的规则版本；详情注明核验缺口。',source:'https://www.cmyk.games/products/magical-athlete'},
  'extra-mile':{name:'Extra Mile',kind:'非官方粉丝扩展',description:'作者网页 v13 名单；仅加入卡文已核实且技能已完成的角色。Box 的实体骰子规则尚未适配，不参与分配。',source:'https://johnnlds.github.io/Magical-Athlete-Racers/?v=13'},
  'leaf-fan':{name:'Leaf’s Fan Expansion',kind:'非官方粉丝扩展',description:'根据作者卡牌、规则书与 PNG 核验，只有已完成的角色参与分配。',source:'https://boardgamegeek.com/filepage/327878/leafs-fan-expansion-for-magical-athlete'},
  wurstii:{name:'Wurstii A',kind:'非官方粉丝扩展',description:'Wurstii v1.0 中已适配的30名角色，含中文卡文、独立立绘和模型；混合强度尚待实战验证。',source:'/rules/wurstii-a.md'},
};
export function packCount(id:CharacterPackId) { return CHARACTERS.filter(character=>(character.edition==='leaf'?'leaf-fan':character.edition??'original')===id).length; }
export function configSummary(config:RoomConfig) { return competitionSummary(config); }
export function RoomConfigFields({config,onChange,disabled=false,players=6,practice=false}:{config:RoomConfig;onChange:(config:RoomConfig)=>void;disabled?:boolean;players?:number;practice?:boolean}) {
  const resources=characterResources(config,players,practice),error=roomConfigError(config,players,practice);
  return <div className="room-config-fields"><div className="config-main">
    <CompetitionFields config={config} onChange={onChange} disabled={disabled} />
    <fieldset disabled={disabled}><legend>角色包</legend><p className="config-intro">角色包只改变角色牌池，与地图方案独立；粉丝包默认关闭。</p>
      <div className="pack-options">{CHARACTER_PACK_IDS.map(id=><div key={id} className="pack-option"><label><input type="checkbox" aria-label={PACK_INFO[id].name} checked={config.characterPacks[id] === true} onChange={event=>onChange({...config,characterPacks:{...config.characterPacks,[id]:event.target.checked}})} /><span><strong>{PACK_INFO[id].name}<b>{packCount(id)} 位可用</b></strong><small>{PACK_INFO[id].kind}</small></span></label><p>{PACK_INFO[id].description} <a href={PACK_INFO[id].source} target="_blank" rel="noreferrer">来源 ↗</a></p></div>)}</div>
    </fieldset>
    <fieldset disabled={disabled}><legend>人数与房规</legend>
      <p>两人每场两名选手，按自己安排的固定顺序行动；黏液怪不减速同玩家的另一名选手为项目房规。7–8 人为项目变体。</p>
    </fieldset>
  </div><details className="config-summary" open><summary>这场怎么跑 · 总摘要</summary><p className="summary-line">{configSummary(config)}</p><p>{CHARACTER_PACK_IDS.filter(id=>config.characterPacks[id]).map(id=>`${PACK_INFO[id].name}（${PACK_INFO[id].kind}）`).join('、')}</p><p>{config.visibility==='private'?'私密 · 凭链接或房间码进入':'公开房间'}</p><p>{practice?'个人练习':`${players} 人${players===2?' · 每人双选手':players>=7?' · 项目变体':''}`}</p><p className="config-total" role="status">当前牌池 {resources.available} 位 · 选秀 {resources.drafted} 位 · 技能预留 {resources.reserve} 位</p><details><summary>查看逐场安排</summary><SchedulePreview competition={competitionConfig(config)} /></details>{error&&<p role="alert" className="form-error">{error}</p>}</details></div>;
}

export function RoomConfigPanel({room,busy,act}:{room:RoomView;busy:boolean;act:(action:GameAction)=>void}) {
  const current=room.config??legacyRoomConfig(room.characterPool,room.mode==='practice');
  const key=JSON.stringify(current);
  const [draft,setDraft]=useState(current);
  useEffect(()=>setDraft(current),[key]);
  const canEdit=room.role!=='spectator'&&room.selfId===room.hostId&&['lobby','finished'].includes(room.phase);
  const changed=JSON.stringify(draft)!==key;
  return <details className="room-config-panel"><summary><strong>{room.phase==='finished'?'下一局角色包与玩法':'本房间角色包与玩法'}</strong><span>{configSummary(current)}</span><small>{CHARACTER_PACK_IDS.filter(id=>current.characterPacks[id]).map(id=>`${PACK_INFO[id].name}（${PACK_INFO[id].kind}）`).join("、")}</small></summary>{canEdit?<><RoomConfigFields config={draft} onChange={setDraft} disabled={busy} players={room.maxPlayers} practice={room.mode==='practice'} /><div className="config-actions"><button type="button" className="button" disabled={busy||!changed||!!roomConfigError(draft,room.maxPlayers,room.mode==='practice')} onClick={()=>act({type:'configure',config:draft})}>保存本房间设置</button><p>{room.phase==='lobby'?'修改后全员需要重新准备；开始选秀后锁定完整赛程。':'保存后下一局生效，上局结果保持可查。'}</p></div></>:<><p>{room.configFrozen?'本局配置已锁定至全部场次结束。':'房主可在开始选秀前调整设置，修改后所有人重新准备。'}</p><RoomConfigFields config={current} onChange={()=>{}} disabled players={room.maxPlayers} practice={room.mode==='practice'} /></>}<details className="source-details"><summary>规则版本详情</summary>{room.rulesVersion??'legacy-base-v1'}</details></details>;
}
