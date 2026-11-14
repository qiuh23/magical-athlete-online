import type { TrackId } from '../shared/tracks.js';
import { useEffect, useRef } from 'react';
import type { PresentationBeat } from './presentation.js';
import { portalCaption, portalConnections, portalDescription, portalEndpoints, portalPanelPlacement } from './portal-guide.js';

function positionPanel(details:HTMLDetailsElement|null) {
  if(!details?.open)return;
  const panel=details.querySelector<HTMLElement>('.portal-pair-panel');if(!panel)return;
  const summary=details.querySelector('summary')!.getBoundingClientRect(),board=details.closest('.board-scene')?.getBoundingClientRect();
  const placement=portalPanelPlacement(summary.top,summary.bottom,Math.max(0,board?.top??0),Math.min(window.innerHeight,board?.bottom??window.innerHeight),panel.scrollHeight);
  panel.style.top=placement.upward?'auto':'100%';panel.style.bottom=placement.upward?'100%':'auto';panel.style.maxHeight=`${placement.maxHeight}px`;
}

/** Static directions stay usable even if the 3D canvas or a device fails. */
export function PortalPairList({ track }: { track: TrackId }) {
  const connections = portalConnections(track);
  return <ul className="portal-pair-list" aria-label="传送去向">{connections.map(connection => <li key={connection.key} data-portal-pair={connection.key} aria-label={portalDescription(connection)}>
    <b className="portal-pair-mark" style={{ backgroundColor: connection.color }} aria-hidden="true">{connection.code}</b>
    <span>{portalCaption(connection)}</span>
  </li>)}</ul>;
}

export function PortalLegend({ track, beat }: { track: TrackId; beat?: PresentationBeat }) {
  const details=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{const update=()=>positionPanel(details.current);window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update);},[track]);
  const connections = portalConnections(track);
  if (!connections.length) return null;
  // Use the current presentation beat, not a second timer or future room logs.
  const active = beat?.kind === 'warp' && beat.cause === 'track-whirl' ? beat.motions.filter(motion => portalEndpoints(track).some(edge => edge.from === motion.from && edge.to === motion.to)) : [];
  const routes = [...new Set(active.map(motion => `${motion.from}→${motion.to}`))];
  return <><details key={track} ref={details} onToggle={()=>positionPanel(details.current)} className="portal-legend" data-testid="portal-legend">
    <summary><span>传送配对</span><small>{connections.length}组</small><span className="portal-legend-chevron" aria-hidden="true">⌄</span></summary>
    <div className="portal-pair-panel"><strong>同字母是一组</strong><PortalPairList track={track} /><p>停下才传送 · 经过不触发<br />↔ 双向，→ 单向</p></div>
  </details>{!!routes.length && <span className="portal-active-route" role="status">传送 {routes.join('、')}</span>}</>;
}

/** No permanent connecting lines: letters and colors match the main board. */
export function PortalMapMarkers({ track, point }: { track: TrackId; point: (node: number) => { x: number; y: number } }) {
  return <g className="minimap-portals">{portalEndpoints(track).map(connection => {
    const p = point(connection.from);
    return <g key={connection.from} data-portal-node={connection.from} data-portal-to={connection.to} transform={`translate(${p.x},${p.y})`}>
      <title>{portalDescription(connection)}</title><circle r="5.5" fill={connection.color} stroke="#173f37" strokeWidth="1.2" />
      <text textAnchor="middle" dominantBaseline="central">{connection.code}</text>
    </g>;
  })}</g>;
}
