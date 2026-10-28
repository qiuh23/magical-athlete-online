import { useId } from 'react';
import type { GameAction, RoomView } from '../shared/types.js';
import { canPausePhase } from '../shared/room-pause.js';
import { ownerAwayLabel } from '../shared/room-lifecycle.js';
import './room-pause.css';

export function RoomPauseControl({ room, busy, act }: { room: RoomView; busy: boolean; act: (action: GameAction) => void }) {
  const descriptionId = useId();
  const paused = !!room.pause;
  const host = room.role !== 'spectator' && room.hostId === room.selfId;
  if (!host) return <span className="room-pause-hint" title="房主可以暂停选卡与比赛，恢复后接着进行">Ⅱ {paused ? '比赛已暂停' : '房主可暂停'}</span>;
  return <div className="room-pause-actions">
    <button type="button" className={`room-pause-control${paused ? ' is-paused' : ''}`} aria-label={paused ? '恢复比赛' : '暂停比赛'} aria-describedby={descriptionId} aria-pressed={paused} disabled={busy || !canPausePhase(room.phase) || (!!room.continuation && room.continuation.stage !== 'playing')} title={room.phase === 'lobby' ? '开局后可暂停选卡与比赛' : paused ? '从当前选卡、技能选择或动画继续' : '暂停所有人的选卡、操作与动画'} onClick={() => act({ type: paused ? 'resume' : 'pause' })}><span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>{paused ? '恢复比赛' : '暂停比赛'}</button>
    <span id={descriptionId} className="room-pause-description"><span>操作、计时与动画{paused ? '已暂停' : '将暂停'}</span><span>暂停后离线保留 {room.mode === 'practice' ? '10 分钟' : room.mode === 'ai' ? '30 分钟' : '4 小时'}</span></span>
  </div>;
}

export function RoomPauseNotice({ room, immersive }: { room: RoomView; immersive: boolean }) {
  if (!room.pause || room.continuation?.stage === 'voting') return null;
  const host = room.role !== 'spectator' && room.hostId === room.selfId;
  return <aside className={`room-pause-notice${immersive ? ' is-immersive' : ''}${host ? ' is-host' : ''}`} role="status" aria-live="polite" data-testid="room-pause-notice"><span className="pause-notice-symbol" aria-hidden="true">Ⅱ</span><div><strong>房主已暂停比赛</strong><p>操作、计时与动画已暂停，等待房主恢复。<br />{room.pause.offlineExpiresAt!==undefined?`本次暂停离线保留截止：${new Date(room.pause.offlineExpiresAt).toLocaleString('zh-CN')}（重连不顺延）`:`房主离线后最多保留 ${ownerAwayLabel(room)}，原浏览器返回可继续。`}</p></div></aside>;
}
