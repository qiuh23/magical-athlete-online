import { useEffect, useId, useState } from 'react';
import { CHARACTERS } from '../shared/characters.js';
import { CHARACTER_PACK_IDS, legacyRoomConfig, characterResources, roomConfigError, type RoomConfig, type CharacterPackId, type ThreePlayerMode } from '../shared/room-config.js';
import type { GameAction, RoomView } from '../shared/types.js';
import './room-config.css';
import { RaceMenuConfigSummary } from './RaceMenuConfigSummary.js';
import { Icon } from './Icons.js';
import { Avatar } from './avatars.js';
import { CompetitionFields, SpecialEventFields, competitionSettingsError, competitionSummary, type CustomCompetitionDraft } from './CompetitionFields.js';

const PACK_INFO: Record<CharacterPackId,{ name:string; shortName:string; kind:string }> = {
  original:{name:'基础角色包',shortName:'基础角色',kind:'原版'},
  'second-wind':{name:'Second Wind',shortName:'Second Wind',kind:'网页适配'},
  'extra-mile':{name:'Extra Mile',shortName:'Extra Mile',kind:'非官方'},
  'leaf-fan':{name:'Leaf’s Fan Expansion',shortName:'Leaf',kind:'非官方'},
  wurstii:{name:'Wurstii A',shortName:'Wurstii A',kind:'非官方'},
};
export function packCount(id:CharacterPackId) { return CHARACTERS.filter(character=>(character.edition==='leaf'?'leaf-fan':character.edition??'original')===id).length; }
export function configSummary(config:RoomConfig,practice=false) { if(practice)return competitionSummary(config); return `${competitionSummary(config)} · ${config.quickMode ? '快速模式' : '选秀模式'}`; }
export function RoomConfigFields({config,onChange,disabled=false,players=6,practice=false,customDraft,onRememberCustom}:{config:RoomConfig;onChange:(config:RoomConfig)=>void;disabled?:boolean;players?:number;practice?:boolean;customDraft?:CustomCompetitionDraft;onRememberCustom?:(draft:CustomCompetitionDraft)=>void}) {
  const resources=characterResources(config,players,practice),error=roomConfigError(config,players,practice);
  const id=useId(),[localDraft,setLocalDraft]=useState<CustomCompetitionDraft>();
  function remember(draft:CustomCompetitionDraft){setLocalDraft(draft);onRememberCustom?.(draft);}
  return <div className="room-config-fields"><div className="config-main">
    <CompetitionFields config={config} onChange={onChange} disabled={disabled} customDraft={customDraft??localDraft} onRememberCustom={remember} />
    <fieldset className="pack-settings" disabled={disabled}><legend>角色包</legend>
      <div className="pack-options">{CHARACTER_PACK_IDS.map(pack=><label key={pack} className="pack-option"><input type="checkbox" aria-label={PACK_INFO[pack].name} checked={config.characterPacks[pack] === true} onChange={event=>onChange({...config,characterPacks:{...config.characterPacks,[pack]:event.target.checked}})} /><Avatar id={CHARACTERS.find(character=>(character.edition==='leaf'?'leaf-fan':character.edition??'original')===pack)!.id} /><span><strong>{PACK_INFO[pack].shortName}<b>{packCount(pack)}</b></strong><small>{PACK_INFO[pack].kind}</small></span></label>)}</div>
      <p className={`config-total${resources.available<resources.required?' is-insufficient':''}`}>可用 {resources.available} · 需要 {resources.required}</p>
    </fieldset>
    <fieldset className="player-settings" disabled={disabled}><legend>人数玩法</legend>
      {practice||players===2?<p className="player-mode-fixed">{practice?'单人练习 · 每场 1 位角色':'两人玩法 · 每人双角色'}</p>:<>
        <div className="player-mode-heading"><strong>三人入座时</strong><span>开局前房主确认</span></div>
        <div className="player-mode-options" role="radiogroup" aria-label="三人玩法">{(['single','double'] as ThreePlayerMode[]).map(mode=><label key={mode}><input type="radio" name={`${id}-three-player`} aria-label={mode==='single'?'三人单角色':'三人双角色'} checked={(config.threePlayerMode??'single')===mode} onChange={()=>onChange({...config,threePlayerMode:mode})} /><span>{mode==='single'?'每人单角色':'每人双角色'}{mode==='double'&&<small>非官方</small>}</span></label>)}</div>
      </>}
      {!practice&&<label className="quick-mode-toggle"><input type="checkbox" aria-label="快速模式" aria-describedby={`${id}-quick-mode-help`} checked={config.quickMode===true} onChange={event=>onChange({...config,quickMode:event.target.checked})} /><span><strong>快速模式</strong><small id={`${id}-quick-mode-help`}>跳过选秀，系统分配队伍；每场赛前自行选择上场选手。</small></span></label>}
      {players>=7&&!practice&&<p className="config-limitation">7–8 人 · 非官方</p>}
    </fieldset>
    <SpecialEventFields config={config} onChange={onChange} disabled={disabled} />
  </div>{error&&!competitionSettingsError(config)&&<p role="alert" className="form-error">{error}</p>}</div>;
}

export function RoomConfigPanel({room,busy,act,compact=false}:{room:RoomView;busy:boolean;act:(action:GameAction)=>void;compact?:boolean}) {
  const current=room.config??legacyRoomConfig(room.characterPool,room.mode==='practice');
  const key=JSON.stringify(current);
  const [draft,setDraft]=useState(current);
  useEffect(()=>setDraft(current),[key]);
  const canEdit=room.role!=='spectator'&&room.selfId===room.hostId&&(room.phase==='finished'||room.phase==='lobby'&&!room.configFrozen);
  const changed=JSON.stringify(draft)!==key;
  return <details className={`room-config-panel${compact?' race-menu-section':''}`} name={compact?'race-menu-sections':undefined} open={compact?undefined:true} data-unsaved={compact&&canEdit&&changed?true:undefined}><summary>{compact&&<Icon kind="flag" />}<strong>{room.phase==='finished'?'下一局玩法':compact?'比赛设置':'玩法'}</strong>{!compact&&<span>{configSummary(current,room.mode==='practice')}</span>}</summary>{canEdit?<><RoomConfigFields config={draft} onChange={setDraft} disabled={busy} players={room.maxPlayers} practice={room.mode==='practice'} /><div className="config-actions"><button type="button" className="button" disabled={busy||!changed||!!roomConfigError(draft,room.maxPlayers,room.mode==='practice')} onClick={()=>act({type:'configure',config:draft})}>保存本房间设置</button><p>{room.phase==='lobby'?'修改后全员需要重新准备；开局后锁定完整赛程。':'保存后下一局生效，上局结果保持可查。'}</p></div></>:compact?<RaceMenuConfigSummary room={room} config={current} />:<><p>{room.configFrozen?'本局配置已锁定至全部场次结束。':'房主可在开局前调整设置，修改后所有人重新准备。'}</p><RoomConfigFields config={current} onChange={()=>{}} disabled players={['lobby','finished'].includes(room.phase)?room.maxPlayers:room.players.length} practice={room.mode==='practice'} /></>}</details>;
}
