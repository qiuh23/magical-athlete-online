import { useId } from 'react';
import { competitionConfig, expandedSchedule, PRESETS, presetCompetition, REWARD_TIERS, TRACK_CATALOG, unavailableMaps, validateCompetition, type CompetitionConfig, type MapId, type PresetId, type RaceCount } from '../shared/competition.js';
import { CHARACTER_PACK_IDS, type RoomConfig } from '../shared/room-config.js';
import { CHARACTERS } from '../shared/characters.js';
import { TRACKS, RACE_POINTS, type TrackId } from '../shared/tracks.js';
import { trackSvgLayout } from './scene/math.js';

export function TrackThumbnail({id}:{id:MapId}) {
  if(!(id in TRACKS))return null;
  const playable=id as TrackId, track=TRACKS[playable],layout=trackSvgLayout(playable,320,110,16);
  const radius=track.nodes?4.3:5.5;
  return <svg className="track-thumbnail" viewBox="0 0 320 110" role="img" data-track={id} data-node-count={layout.nodes.length} aria-label={`${TRACK_CATALOG[id].name} 实际路线与特殊格缩略图`}>
    {layout.edges.map(([from,to])=>{const a=layout.point(from),b=layout.point(to);return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#78967d" strokeWidth={radius*1.5} strokeLinecap="round" />;})}
    {[...layout.nodes].sort((a,b)=>(track.nodes?.[a]?.y??0)-(track.nodes?.[b]?.y??0)).map(index=>{const p=layout.point(index),special=track.specials[index];return <g key={index} data-map-node={index}><rect x={p.x-radius} y={p.y-radius} width={radius*2} height={radius*2} rx="1.5" fill={index===0?'#edb65e':index===track.finish?'#db785b':track.nodes?.[index]?.color??(special?'#e4d77c':'#fff9db')} stroke={(track.nodes?.[index]?.y??0)>0?'#fff9db':'#567966'} strokeWidth={(track.nodes?.[index]?.y??0)>0?1.6:.6} /><text x={p.x} y={p.y+2.8} textAnchor="middle" fontSize={track.nodes?6.7:8} fill="#173f37">{index===0?'起':index===track.finish?'终':special?.kind==='star'?(special.points??1)===1?'★':String(special.points):special?.kind==='trip'?'!':special?.kind==='arrow'?(special.move!>0?'+':'−'):special?.kind==='warp'?'↪':''}</text></g>;})}
    {track.twistBoundary&&(()=>{const a=layout.point(track.twistBoundary.before),b=layout.point(track.twistBoundary.after),x=(a.x+b.x)/2,y=(a.y+b.y)/2;return <g data-twist-boundary={`${track.twistBoundary.before}-${track.twistBoundary.after}`}><circle cx={x} cy={y} r="6" fill="#7850a2" stroke="#fff8df" /><text x={x} y={y+2.7} textAnchor="middle" fontSize="8" fontWeight="900" fill="#fff8df">扭</text></g>;})()}
  </svg>;
}
export function competitionSummary(config:RoomConfig):string {
  const c=competitionConfig(config),name=c.preset==='custom'?'自定义积分赛':PRESETS[c.preset].name;
  return `${name} · ${c.raceCount} 场比赛 · ${new Set(expandedSchedule(c)).size} 张地图 · ${CHARACTER_PACK_IDS.filter(id=>config.characterPacks[id]).length} 个角色包 · ${c.thrillingThirds.enabled?`特殊赛事第 ${c.thrillingThirds.rounds.join('、')} 场`:'特殊赛事关闭'}`;
}
export function SchedulePreview({competition}:{competition:CompetitionConfig}) {
  const maps=expandedSchedule(competition);
  return <ol className="schedule-preview" aria-label="完整逐场安排">{maps.map((id,i)=><li key={i}>
    <span className="race-number">{i+1}</span><span><strong>{TRACK_CATALOG[id].name}</strong><small>{!TRACK_CATALOG[id].available?'地图尚未开放':competition.thrillingThirds.enabled&&competition.thrillingThirds.rounds.includes(i+1)?'Thrilling Thirds · 网页适配':'特殊赛事关闭'}</small></span>
    <span className="race-rewards">第 1 名 <b>{RACE_POINTS[REWARD_TIERS[competition.raceCount][i]!]![0]}</b> 分<br />第 2 名 <b>{RACE_POINTS[REWARD_TIERS[competition.raceCount][i]!]![1]}</b> 分</span>
  </li>)}</ol>;
}
// Presentation messages only: the shared validator remains the authority.
export function competitionSettingsError(config:RoomConfig):string {
  const c=competitionConfig(config),issues:string[]=[];
  if(c.rotation.length>c.raceCount)issues.push(`地图轮换有 ${c.rotation.length} 项，超过当前 ${c.raceCount} 场。请在「调整赛程」中移除多余地图，或增加场数；原列表已保留。`);
  const outside=c.thrillingThirds.rounds.filter(round=>round>c.raceCount);
  if(outside.length)issues.push(`特殊赛事的第 ${outside.join('、')} 场超出当前 ${c.raceCount} 场。请在「调整赛程 → 特殊赛事」中取消这些场次，或增加场数；原设置已保留。`);
  if(issues.length)return issues.join(' ');
  try{validateCompetition(c);return '';}catch(error){return error instanceof Error?error.message:'赛程配置无效。';}
}

const PRESET_NOTES = {
  classic:'基础两图轮换，累计积分决定胜负。',
  official:'沿用官方顺序；Whirly 为网页适配。',
  extended:'含粉丝地图与项目赛制；Whirly 为网页适配。',
};

export function CompetitionFields({config,onChange,disabled=false}:{config:RoomConfig;onChange:(value:RoomConfig)=>void;disabled?:boolean}) {
  const c=competitionConfig(config),id=useId(),error=competitionSettingsError(config);
  const blocked=[...new Set(c.rotation.flatMap(id=>id in TRACKS?TRACKS[id as TrackId].blockedCharacters??[]:[]))];
  const customNotes=['自定地图轮换',...(c.rotation.some(id=>TRACK_CATALOG[id].kind==='粉丝地图')?['含粉丝地图']:[]),...(c.raceCount!==4?[`${c.raceCount} 场为项目赛制`]:[]),...(c.rotation.includes('whirly-world')?['Whirly 为网页适配']:[])];
  // Keep out-of-range choices visible and removable after shortening a match.
  const eventRounds=[...new Set([...Array.from({length:c.raceCount},(_,i)=>i+1),...c.thrillingThirds.rounds])].sort((a,b)=>a-b);
  function change(next:CompetitionConfig){if(!disabled)onChange({...config,competition:next});}
  function custom(patch:Partial<CompetitionConfig>){change({...c,...patch,preset:'custom'});}
  function reorder(index:number,offset:number){const rotation=[...c.rotation];[rotation[index],rotation[index+offset]]=[rotation[index+offset]!,rotation[index]!];custom({rotation});}
  return <fieldset className="competition-settings" disabled={disabled}><legend>比赛方案</legend>
    <div className="preset-options" role="radiogroup" aria-label="比赛方案" aria-describedby={`${id}-description`}>{(Object.keys(PRESETS) as Exclude<PresetId,'custom'>[]).filter(id=>!unavailableMaps(presetCompetition(id)).length).map(presetId=>{
      const preset=PRESETS[presetId],maps=new Set(preset.rotation).size;
      return <label key={presetId} className={`preset-option${c.preset===presetId?' is-selected':''}`}>
        <input type="radio" name={`${id}-preset`} aria-label={`${preset.name}，${preset.raceCount} 场，${maps} 张地图`} checked={c.preset===presetId} onChange={()=>change({...presetCompetition(presetId),thrillingThirds:c.thrillingThirds})} />
        <strong>{preset.name}</strong><span className="preset-count">{preset.raceCount} 场 · {maps} 图</span><span className="preset-check" aria-hidden="true">{c.preset===presetId?'✓':''}</span>
      </label>;
    })}</div>
    <p className="preset-description" id={`${id}-description`}>{c.preset==='custom'?`${customNotes.join('；')}。`:PRESET_NOTES[c.preset]}</p>
    {!!blocked.length&&<p className="competition-limitation" role="note">当前地图禁用：{blocked.map(id=>CHARACTERS.find(character=>character.id===id)?.nameZh??id).join('、')}（整局牌池）。</p>}
    <p className="competition-current" role="status">{c.preset==='custom'?'自定义积分赛':PRESETS[c.preset].name} · {c.raceCount} 场 · {new Set(expandedSchedule(c)).size} 图 · {c.thrillingThirds.enabled?`特殊赛事第 ${c.thrillingThirds.rounds.join('、')||'待选'} 场`:'特殊赛事关闭'}</p>
    {error&&<p className="form-error competition-error" role="alert">{error}</p>}
    <details className="schedule-settings config-disclosure"><summary>调整赛程</summary>
      <div className="custom-schedule">
        <label>比赛场数<select aria-label="比赛场数" value={c.raceCount} onChange={e=>custom({raceCount:Number(e.target.value) as RaceCount})}>{[4,6,8].map(n=><option key={n} value={n}>{n} 场{n===4?'':' · 项目规则'}</option>)}</select></label>
        <p>地图按顺序循环，可重复添加；修改场数会保留原设置。</p>
        <ol className="rotation-list">{c.rotation.map((map,i)=><li key={i}>
          <span>{i+1}. {TRACK_CATALOG[map].name}{!TRACK_CATALOG[map].available&&'（待开放）'}</span>
          <div><button type="button" aria-label={`上移第${i+1}项`} disabled={disabled||i===0} onClick={()=>reorder(i,-1)}>↑</button><button type="button" aria-label={`下移第${i+1}项`} disabled={disabled||i===c.rotation.length-1} onClick={()=>reorder(i,1)}>↓</button><button type="button" aria-label={`移除第${i+1}项`} onClick={()=>custom({rotation:c.rotation.filter((_,j)=>i!==j)})}>移除</button></div>
        </li>)}</ol>
        <details className="map-library config-disclosure"><summary>添加地图 <span>可重复添加</span></summary>
          <div className="map-options">{(Object.keys(TRACKS) as TrackId[]).filter(id=>TRACK_CATALOG[id].available).map(map=><div key={map}><TrackThumbnail id={map} /><strong>{TRACK_CATALOG[map].name}</strong><small>{TRACK_CATALOG[map].kind}</small><p>{TRACK_CATALOG[map].description}</p><button type="button" onClick={()=>custom({rotation:[...c.rotation,map]})}>添加 {TRACK_CATALOG[map].name}</button></div>)}</div>
        </details>
      </div>
      <details className="config-disclosure event-settings"><summary>特殊赛事 <span>{c.thrillingThirds.enabled?`非官方粉丝事件 · 第 ${c.thrillingThirds.rounds.join('、')||'待选择'} 场`:'未开启'}</span></summary>
        <fieldset className="special-event-settings" disabled={disabled}><legend>Thrilling Thirds · 非官方粉丝事件</legend>
          <label className="event-toggle"><input type="checkbox" checked={c.thrillingThirds.enabled} onChange={e=>custom({thrillingThirds:{enabled:e.target.checked,rounds:e.target.checked?[3]:[]}})} />启用 36 项粉丝事件（网页适配）</label>
          <p>指定场次选角结束后，从 36 项中自动抽取 1 项公共规则，本场结束后失效。默认第 3 场，至少选择一场。</p>
          {c.thrillingThirds.enabled?<><p className="event-status" role="status">{c.thrillingThirds.rounds.length?`已开启：第 ${c.thrillingThirds.rounds.join('、')} 场各抽取 1 项事件。`:'请在下方至少勾选一场，才能保存或开始。'}</p><div className="event-rounds" role="group" aria-label="特殊赛事适用场次">{eventRounds.map(round=><label key={round} className={round>c.raceCount?'event-round-outside':undefined}><input type="checkbox" checked={c.thrillingThirds.rounds.includes(round)} onChange={e=>custom({thrillingThirds:{enabled:true,rounds:e.target.checked?[...c.thrillingThirds.rounds,round].sort((a,b)=>a-b):c.thrillingThirds.rounds.filter(n=>n!==round)}})} />第 {round} 场{round>c.raceCount&&`（超出当前 ${c.raceCount} 场）`}</label>)}</div></>:<p className="event-status" role="status">当前关闭：所有场次按原赛程进行，不抽取特殊事件。</p>}
        </fieldset>
      </details>
      <details className="config-disclosure schedule-preview-settings"><summary>逐场地图与积分 <span>{c.raceCount} 场</span></summary><SchedulePreview competition={c} /></details>
    </details>
  </fieldset>;
}
