import { competitionConfig, expandedSchedule, PRESETS, TRACK_CATALOG } from '../shared/competition.js';
import { CHARACTER_PACK_IDS, type RoomConfig } from '../shared/room-config.js';
import type { RoomView } from '../shared/types.js';

const packNames = { original: '基础角色', 'second-wind': 'Second Wind', 'extra-mile': 'Extra Mile', 'leaf-fan': 'Leaf', wurstii: 'Wurstii A' };

/** Locked match settings are information, not a screen of disabled controls. */
export function RaceMenuConfigSummary({ room, config }: { room: RoomView; config: RoomConfig }) {
  const competition = competitionConfig(config);
  const nextMatch = room.phase === 'finished';
  const schedule = (!nextMatch ? room.matchPlan : undefined)?.races.map(race => ({ round: race.round, map: race.map, special: !!race.specialEvent }))
    ?? expandedSchedule(competition).map((map, index) => ({ round: index + 1, map, special: competition.thrillingThirds.enabled && competition.thrillingThirds.rounds.includes(index + 1) }));
  return <div className="race-menu-section-body race-menu-config-summary">
    <p className="race-menu-config-title">{competition.preset === 'custom' ? '自定义积分赛' : PRESETS[competition.preset].name}<span>{schedule.length} 场 · {!nextMatch && room.configFrozen ? '已锁定' : '由房主设置'}</span></p>
    <ol className="race-menu-schedule" aria-label={nextMatch ? '下一局赛程' : '本局赛程'}>{schedule.map(race => <li key={race.round} aria-current={!nextMatch && race.round === room.round ? 'step' : undefined}>
      <span className="race-menu-round">{race.round}</span><span>{TRACK_CATALOG[race.map].name}{race.special && <small>特殊赛事</small>}</span>{!nextMatch && race.round === room.round && <b>本场</b>}
    </li>)}</ol>
    <dl className="race-menu-config-facts">
      <dt>角色包</dt><dd>{CHARACTER_PACK_IDS.filter(pack => config.characterPacks[pack]).map(pack => packNames[pack]).join('、')}</dd>
      <dt>人数玩法</dt><dd>{room.mode === 'practice' ? '单人练习 · 每场 1 位角色' : room.players.length === 2 ? '两人双角色' : room.players.length === 3 ? config.threePlayerMode === 'double' ? '三人双角色 · 非官方' : '三人单角色' : `${room.players.length} 人 · 每人单角色${room.players.length >= 7 ? ' · 非官方' : ''}`}</dd>
      {room.mode !== 'practice' && <><dt>快速模式</dt><dd>{config.quickMode ? '开启 · 系统分配队伍，赛前自选上场选手' : '关闭 · 通过选秀组队'}</dd></>}
      <dt>特殊赛事</dt><dd>{schedule.some(race => race.special) ? `第 ${schedule.filter(race => race.special).map(race => race.round).join('、')} 场 · 非官方` : '关闭'}</dd>
    </dl>
  </div>;
}
