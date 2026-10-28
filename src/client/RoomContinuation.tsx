import { useEffect, useRef, useState } from 'react';
import type { GameAction, RoomView } from '../shared/types.js';

export function RoomContinuationNotice({room, busy, resultsVisible, act}: {room:RoomView; busy:boolean; resultsVisible:boolean; act:(action:GameAction)=>Promise<boolean>}) {
  const c = room.continuation;
  const actRef=useRef(act);actRef.current=act;
  const seen=c?.seen.includes(room.selfId);
  const [now,setNow] = useState(Date.now);
  useEffect(()=>{if(!c)return;setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[c?.id]);
  useEffect(()=>{
    if(c?.stage!=='results'||!resultsVisible||busy||room.role==='spectator'||seen)return;
    // Only acknowledge after the last animation queue is empty and the actual
    // ranking has stayed on screen long enough to read, including reconnects.
    let timer:ReturnType<typeof setTimeout>|undefined;
    const schedule=()=>{clearTimeout(timer);if(!document.hidden)timer=setTimeout(()=>void actRef.current({type:'results-seen',continuationId:c.id}),8_000);};
    schedule();document.addEventListener('visibilitychange',schedule);
    return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',schedule);};
  },[c?.id,c?.stage,seen,resultsVisible,busy,room.selfId,room.role]);
  if(!c)return null;
  if(c.stage==='voting')return <div className="modal-backdrop"><section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="continue-title"><header className="modal-header"><h2 id="continue-title">房主已离开，是否继续？</h2></header><div className="end-room-confirm">
    <p>房主离线保留期限已到，当前比赛尚未完成。所有在场真人选手同意后只打完当前这一场，本场结果显示后解散。离线席位由 AI 临时代打，回来后可接手。房主在正式关闭前返回会取消此限制，继续完整对局。</p>
    <p role="status">{Math.max(0,Math.ceil((c.deadline-now)/1000))} 秒内确认 · 已同意 {c.accepted.length}/{c.voters.length} 人；有人拒绝或超时未确认即关闭。</p>
    <ul>{c.voters.map(id=><li key={id}>{room.players.find(p=>p.id===id)?.name}：{c.accepted.includes(id)?'已同意':'等待确认'}</li>)}</ul>
    {c.voters.includes(room.selfId)?<div className="end-room-confirm-actions"><button className="button button-danger" disabled={busy} onClick={()=>void act({type:'continue-vote',continuationId:c.id,continue:false})}>不继续，解散房间</button><button className="button" disabled={busy||c.accepted.includes(room.selfId)} onClick={()=>void act({type:'continue-vote',continuationId:c.id,continue:true})}>{c.accepted.includes(room.selfId)?'已同意，等待其他人':'继续比赛'}</button></div>:<p>正在等待参赛选手确认。</p>}
  </div></section></div>;
  return <div className="continuation-notice" role="status">{c.stage==='playing'?'已全员同意续赛 · 本场结果显示后解散房间':resultsVisible?'本场结果已显示 · 阅读结束后自动解散房间':'正在播放最后的赛况 · 显示本场结果后解散房间'}</div>;
}
