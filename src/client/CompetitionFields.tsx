import { useId } from 'react';
import { competitionConfig, expandedSchedule, PRESETS, presetCompetition, TRACK_CATALOG, unavailableMaps, validateCompetition, type CompetitionConfig, type MapId, type PresetId, type RaceCount } from '../shared/competition.js';
import { CHARACTER_PACK_IDS, type RoomConfig } from '../shared/room-config.js';
import { CHARACTERS } from '../shared/characters.js';
import { TRACKS, type TrackId } from '../shared/tracks.js';
import { trackSvgLayout } from './scene/math.js';
import { portalDescription, portalEndpoints } from './portal-guide.js';

export function TrackThumbnail({id}:{id:MapId}) {
  if(!(id in TRACKS))return null;
  const playable=id as TrackId, track=TRACKS[playable],layout=trackSvgLayout(playable,320,110,16);
  const radius=track.nodes?4.3:5.5,portals=new Map(portalEndpoints(playable).map(portal=>[portal.from,portal]));
  return <svg className="track-thumbnail" viewBox="0 0 320 110" role="img" data-track={id} data-node-count={layout.nodes.length} aria-label={`${TRACK_CATALOG[id].name} 实际路线与特殊格缩略图`}>
    {layout.edges.map(([from,to])=>{const a=layout.point(from),b=layout.point(to);return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#78967d" strokeWidth={radius*1.5} strokeLinecap="round" />;})}
    {[...layout.nodes].sort((a,b)=>(track.nodes?.[a]?.y??0)-(track.nodes?.[b]?.y??0)).map(index=>{const p=layout.point(index),special=track.specials[index],portal=portals.get(index);return <g key={index} data-map-node={index} data-portal-to={portal?.to}>{portal&&<title>{portalDescription(portal)}</title>}<rect x={p.x-radius} y={p.y-radius} width={radius*2} height={radius*2} rx={portal?radius:1.5} fill={index===0?'#edb65e':index===track.finish?'#db785b':portal?.color??track.nodes?.[index]?.color??(special?'#e4d77c':'#fff9db')} stroke={(track.nodes?.[index]?.y??0)>0?'#fff9db':'#567966'} strokeWidth={(track.nodes?.[index]?.y??0)>0?1.6:.6} /><text x={p.x} y={p.y+2.8} textAnchor="middle" fontSize={track.nodes?6.7:8} fill={portal?'#071b17':'#173f37'}>{index===0?'起':index===track.finish?'终':portal?portal.code:special?.kind==='star'?(special.points??1)===1?'★':String(special.points):special?.kind==='trip'?'!':special?.kind==='arrow'?(special.move!>0?'+':'−'):''}</text></g>;})}
    {track.twistBoundary&&(()=>{const a=layout.point(track.twistBoundary.before),b=layout.point(track.twistBoundary.after),x=(a.x+b.x)/2,y=(a.y+b.y)/2;return <g data-twist-boundary={`${track.twistBoundary.before}-${track.twistBoundary.after}`}><circle cx={x} cy={y} r="6" fill="#7850a2" stroke="#fff8df" /><text x={x} y={y+2.7} textAnchor="middle" fontSize="8" fontWeight="900" fill="#fff8df">扭</text></g>;})()}
  </svg>;
}
export function competitionSummary(config:RoomConfig):string {
  const c=competitionConfig(config),name=c.preset==='custom'?'自定义积分赛':PRESETS[c.preset].name;
  return `${name} · ${c.raceCount} 场比赛 · ${new Set(expandedSchedule(c)).size} 张地图 · ${CHARACTER_PACK_IDS.filter(id=>config.characterPacks[id]).length} 个角色包 · ${c.thrillingThirds.enabled?`特殊赛事第 ${c.thrillingThirds.rounds.join('、')} 场`:'特殊赛事关闭'}`;
}
// Presentation messages only: the shared validator remains the authority.
export function competitionSettingsError(config:RoomConfig):string {
  const c=competitionConfig(config),issues:string[]=[];
  if(c.rotation.length>c.raceCount)issues.push(`地图轮换有 ${c.rotation.length} 项，超过当前 ${c.raceCount} 场。请移除多余地图或增加场数；原列表已保留。`);
  const outside=c.thrillingThirds.rounds.filter(round=>round>c.raceCount);
  if(outside.length)issues.push(`特殊赛事的第 ${outside.join('、')} 场超出当前 ${c.raceCount} 场。请取消这些场次或增加场数；原设置已保留。`);
  if(issues.length)return issues.join(' ');
  try{validateCompetition(c);return '';}catch(error){return error instanceof Error?error.message:'赛程配置无效。';}
}

// Kept only in the editor, separately from the persisted room configuration.
export type CustomCompetitionDraft = Pick<CompetitionConfig,'raceCount'|'rotation'>;
type FieldsProps = {config:RoomConfig;onChange:(value:RoomConfig)=>void;disabled?:boolean};

export function CompetitionFields({config,onChange,disabled=false,customDraft,onRememberCustom}:{customDraft?:CustomCompetitionDraft;onRememberCustom:(draft:CustomCompetitionDraft)=>void}&FieldsProps) {
  const c=competitionConfig(config),id=useId(),error=competitionSettingsError(config);
  const blocked=[...new Set(c.rotation.flatMap(id=>id in TRACKS?TRACKS[id as TrackId].blockedCharacters??[]:[]))];
  function change(next:CompetitionConfig){if(!disabled)onChange({...config,competition:next});}
  function custom(patch:Partial<CompetitionConfig>){change({...c,...patch,preset:'custom'});}
  function reorder(index:number,offset:number){const rotation=[...c.rotation];[rotation[index],rotation[index+offset]]=[rotation[index+offset]!,rotation[index]!];custom({rotation});}
  function choosePreset(presetId:Exclude<PresetId,'custom'>){
    if(disabled)return;
    if(c.preset==='custom')onRememberCustom({raceCount:c.raceCount,rotation:[...c.rotation]});
    change({...presetCompetition(presetId),thrillingThirds:c.thrillingThirds});
  }
  return <>
  <fieldset className="competition-settings" disabled={disabled}><legend>比赛方案</legend>
    <div className="preset-options" role="radiogroup" aria-label="比赛方案">{(Object.keys(PRESETS) as Exclude<PresetId,'custom'>[]).filter(id=>!unavailableMaps(presetCompetition(id)).length).map(presetId=>{
      const preset=PRESETS[presetId],maps=new Set(preset.rotation).size;
      return <label key={presetId} className={`preset-option${c.preset===presetId?' is-selected':''}`}>
        <input type="radio" name={`${id}-preset`} aria-label={`${preset.name}，${preset.raceCount} 场，${maps} 张地图`} checked={c.preset===presetId} onChange={()=>choosePreset(presetId)} />
        <TrackThumbnail id={preset.rotation[0]!} /><span><strong>{preset.name}</strong><small>{preset.raceCount} 场 · {maps} 图{presetId==='extended'?' · 非官方':''}</small></span>
      </label>;
    })}<label className={`preset-option${c.preset==='custom'?' is-selected':''}`}>
      <input type="radio" name={`${id}-preset`} aria-label="自定义积分赛" checked={c.preset==='custom'} onChange={()=>change({...c,...customDraft,preset:'custom'})} />
      <span><strong>自定义</strong><small>{customDraft&&c.preset!=='custom'?'恢复已存草稿':'自由排列地图'}</small></span>
    </label></div>
    <div className="race-count-row"><label><span>比赛场数</span><select aria-label="比赛场数" value={c.raceCount} onChange={e=>custom({raceCount:Number(e.target.value) as RaceCount})}>{[4,6,8].map(n=><option key={n} value={n}>{n} 场{n===4?'':' · 非官方'}</option>)}</select></label>
      {customDraft&&c.preset!=='custom'&&<span className="draft-retained" role="status">自定义草稿已保留</span>}
    </div>
    {error&&error!=='请选择至少一场特殊赛事。'&&<p className="form-error competition-error" role="alert">{error}</p>}
  </fieldset>
  <fieldset className="map-settings" disabled={disabled}><legend>地图</legend>
    <div className="map-options" aria-label="添加地图">{(Object.keys(TRACK_CATALOG) as MapId[]).filter(map=>TRACK_CATALOG[map].available&&map in TRACKS).map(map=>{
      const count=c.rotation.filter(value=>value===map).length,tag=TRACK_CATALOG[map].kind==='粉丝地图'?'非官方':map==='whirly-world'?'网页适配':'';
      return <button key={map} type="button" className={`map-card${count?' is-selected':''}`} aria-label={`添加 ${TRACK_CATALOG[map].name}`} aria-describedby={`${id}-${map}-state`} onClick={()=>custom({rotation:[...c.rotation,map]})}>
        <TrackThumbnail id={map} /><strong>{TRACK_CATALOG[map].name}</strong><span className="map-card-meta"><span id={`${id}-${map}-state`}>{count?`✓ 已添加 ×${count}`:'+ 添加'}</span>{tag&&<small>{tag}</small>}</span>
      </button>;
    })}</div>
    {c.preset==='custom'&&<><div className="rotation-heading"><h3>地图顺序</h3></div>
    <ol className="rotation-list" aria-label="地图轮换顺序">{c.rotation.map((map,i)=><li key={i}>
      <span><b>{i+1}</b>{TRACK_CATALOG[map].name}{!TRACK_CATALOG[map].available&&'（待开放）'}</span>
      <div><button type="button" aria-label={`上移第${i+1}项`} disabled={disabled||i===0} onClick={()=>reorder(i,-1)}>↑</button><button type="button" aria-label={`下移第${i+1}项`} disabled={disabled||i===c.rotation.length-1} onClick={()=>reorder(i,1)}>↓</button><button type="button" aria-label={`移除第${i+1}项`} onClick={()=>custom({rotation:c.rotation.filter((_,j)=>i!==j)})}>×</button></div>
    </li>)}</ol></>}
    {!!blocked.length&&<p className="competition-limitation" role="note">整局禁用：{blocked.map(value=>CHARACTERS.find(character=>character.id===value)?.nameZh??value).join('、')}</p>}
  </fieldset></>;
}

export function SpecialEventFields({config,onChange,disabled=false}:FieldsProps) {
  const c=competitionConfig(config);
  // Out-of-range choices remain directly removable after shortening a match.
  const eventRounds=[...new Set([...Array.from({length:c.raceCount},(_,i)=>i+1),...c.thrillingThirds.rounds])].sort((a,b)=>a-b);
  function change(thrillingThirds:CompetitionConfig['thrillingThirds']){if(!disabled)onChange({...config,competition:{...c,preset:'custom',thrillingThirds}});}
  return <fieldset className="special-event-settings" disabled={disabled}><legend>特殊赛事 <span className="config-tag">非官方 · 网页适配</span></legend>
    <label className="event-toggle"><input type="checkbox" aria-label="启用特殊赛事" checked={c.thrillingThirds.enabled} onChange={event=>change({enabled:event.target.checked,rounds:event.target.checked?[3]:[]})} /><strong>启用特殊赛事</strong></label>
    {c.thrillingThirds.enabled&&<p className="event-round-label">适用场次</p>}
    {c.thrillingThirds.enabled&&<div className="event-rounds" role="group" aria-label="特殊赛事适用场次">{eventRounds.map(round=><label key={round} className={round>c.raceCount?'event-round-outside':undefined}><input type="checkbox" checked={c.thrillingThirds.rounds.includes(round)} onChange={event=>change({enabled:true,rounds:event.target.checked?[...c.thrillingThirds.rounds,round].sort((a,b)=>a-b):c.thrillingThirds.rounds.filter(n=>n!==round)})} />第 {round} 场{round>c.raceCount&&`（超出当前 ${c.raceCount} 场）`}</label>)}</div>}
    {c.thrillingThirds.enabled&&!c.thrillingThirds.rounds.length&&<p className="form-error competition-error" role="alert">请选择至少一场特殊赛事。</p>}
  </fieldset>;
}
