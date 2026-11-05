import { useEffect, useState } from 'react';
import { CHARACTERS } from '../shared/characters.js';
import { CHARACTER_PACK_IDS, legacyRoomConfig, characterResources, racersPerPlayer, roomConfigError, type RoomConfig, type CharacterPackId, type ThreePlayerMode } from '../shared/room-config.js';
import type { GameAction, RoomView } from '../shared/types.js';
import './room-config.css';
import { CompetitionFields, competitionSummary } from './CompetitionFields.js';

const PACK_INFO: Record<CharacterPackId,{ name:string; kind:string; description:string; source:string }> = {
  original:{name:'基础角色包',kind:'原版',description:'CMYK 基础角色与已采用 FAQ 裁定。',source:'https://www.cmyk.games/products/magical-athlete'},
  'second-wind':{name:'Second Wind',kind:'续作 · 部分规则待确认',description:'技能参考玩家图鉴，尚未逐张与官方规则核对。',source:'https://www.cmyk.games/products/magical-athlete'},
  'extra-mile':{name:'Extra Mile',kind:'非官方粉丝扩展',description:'可用 31 位。Box 需要实体骰子入盒，网页版暂不可用。',source:'https://johnnlds.github.io/Magical-Athlete-Racers/?v=13'},
  'leaf-fan':{name:'Leaf’s Fan Expansion',kind:'非官方粉丝扩展',description:'可用 18 位，角色能力与特殊规则可在详情查看。',source:'https://boardgamegeek.com/filepage/327878/leafs-fan-expansion-for-magical-athlete'},
  wurstii:{name:'Wurstii A',kind:'非官方粉丝扩展',description:'可用 30 位；与其他角色包混用的平衡性尚待实战验证。',source:'/rules/wurstii-a.md'},
};
export function packCount(id:CharacterPackId) { return CHARACTERS.filter(character=>(character.edition==='leaf'?'leaf-fan':character.edition??'original')===id).length; }
export function configSummary(config:RoomConfig) { return competitionSummary(config); }
export function RoomConfigFields({config,onChange,disabled=false,players=6,practice=false}:{config:RoomConfig;onChange:(config:RoomConfig)=>void;disabled?:boolean;players?:number;practice?:boolean}) {
  const resources=characterResources(config,players,practice),error=roomConfigError(config,players,practice);
  const packs=CHARACTER_PACK_IDS.filter(id=>config.characterPacks[id]);
  return <div className="room-config-fields"><div className="config-main">
    <CompetitionFields config={config} onChange={onChange} disabled={disabled} />
    <details className="config-disclosure pack-settings"><summary>角色包 <span>{packs.map(id=>PACK_INFO[id].name).join('、')||'尚未选择'}</span></summary>
    <fieldset disabled={disabled}><legend>选择角色包</legend><p className="config-intro">与地图独立选择；粉丝扩展默认关闭。</p>
      <div className="pack-options">{CHARACTER_PACK_IDS.map(id=><div key={id} className="pack-option"><label><input type="checkbox" aria-label={PACK_INFO[id].name} checked={config.characterPacks[id] === true} onChange={event=>onChange({...config,characterPacks:{...config.characterPacks,[id]:event.target.checked}})} /><span><strong>{PACK_INFO[id].name}<b>{packCount(id)} 位可用</b></strong><small>{PACK_INFO[id].kind}</small></span></label><p>{PACK_INFO[id].description} <a href={PACK_INFO[id].source} target="_blank" rel="noreferrer">来源 ↗</a></p></div>)}</div>
      <p className="config-total">牌池 {resources.available} 位 · 选秀需 {resources.drafted} 位 · 技能预留 {resources.reserve} 位</p>
    </fieldset></details>
    {config.characterPacks['second-wind']&&<p className="config-limitation">Second Wind：部分技能尚未逐张与官方规则核对。</p>}
    {packs.some(id=>!['original','second-wind'].includes(id))&&<p className="config-limitation">已启用非官方粉丝扩展{config.characterPacks.wurstii?'；Wurstii 与其他包混用的平衡性尚待实战验证':''}。</p>}
    <details className="config-disclosure"><summary>人数玩法 <span>{practice?'单人练习':`${players} 人上限 · ${racersPerPlayer(players,config)===2?'每人双角色':'每人单角色'}`}</span></summary>
    <fieldset disabled={disabled}><legend>人数与房规</legend>
      {players===3&&!practice&&<label>三人玩法<select aria-label="三人玩法" value={config.threePlayerMode??'single'} onChange={event=>onChange({...config,threePlayerMode:event.target.value as ThreePlayerMode})}><option value="single">每人单角色 · 共3名选手</option><option value="double">每人双角色 · 共6名选手</option></select></label>}
      <p>两人每场每人双角色；实际入座三人时，由房主在开局前选择单角色或双角色。双角色按自己安排的顺序行动，黏液怪不减速同玩家的另一位选手。三人双角色及 7–8 人为非官方变体，平衡性尚未验证。</p>
    </fieldset>
    </details>
    {(players>=7||players===3&&config.threePlayerMode==='double')&&!practice&&<p className="config-limitation">{players>=7?'7–8 人':'三人双角色'}为非官方变体，平衡性尚未验证。</p>}
  </div>{error&&<p role="alert" className="form-error">{error}</p>}</div>;
}

export function RoomConfigPanel({room,busy,act}:{room:RoomView;busy:boolean;act:(action:GameAction)=>void}) {
  const current=room.config??legacyRoomConfig(room.characterPool,room.mode==='practice');
  const key=JSON.stringify(current);
  const [draft,setDraft]=useState(current);
  useEffect(()=>setDraft(current),[key]);
  const canEdit=room.role!=='spectator'&&room.selfId===room.hostId&&['lobby','finished'].includes(room.phase);
  const changed=JSON.stringify(draft)!==key;
  return <details className="room-config-panel"><summary><strong>{room.phase==='finished'?'下一局角色包与玩法':'本房间角色包与玩法'}</strong><span>{configSummary(current)}</span><small>{CHARACTER_PACK_IDS.filter(id=>current.characterPacks[id]).map(id=>`${PACK_INFO[id].name}（${PACK_INFO[id].kind}）`).join('、')}</small></summary>{canEdit?<><RoomConfigFields config={draft} onChange={setDraft} disabled={busy} players={room.maxPlayers} practice={room.mode==='practice'} /><div className="config-actions"><button type="button" className="button" disabled={busy||!changed||!!roomConfigError(draft,room.maxPlayers,room.mode==='practice')} onClick={()=>act({type:'configure',config:draft})}>保存本房间设置</button><p>{room.phase==='lobby'?'修改后全员需要重新准备；开始选秀后锁定完整赛程。':'保存后下一局生效，上局结果保持可查。'}</p></div></>:<><p>{room.configFrozen?'本局配置已锁定至全部场次结束。':'房主可在开始选秀前调整设置，修改后所有人重新准备。'}</p><RoomConfigFields config={current} onChange={()=>{}} disabled players={['lobby','finished'].includes(room.phase)?room.maxPlayers:room.players.length} practice={room.mode==='practice'} /></>}</details>;
}
