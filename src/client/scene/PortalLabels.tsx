import { useMemo, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { TrackId } from '../../shared/tracks.js';
import { portalCaption, portalEndpoints } from '../portal-guide.js';
import { placePortalLabels, portalSignPoint } from './portal-labels.js';
type Labels = RefObject<Map<number, HTMLSpanElement>>;

export function PortalLabels({ track, labels }: { track: TrackId; labels: Labels }) {
  return <div className="portal-signs" aria-hidden="true">{portalEndpoints(track).map(connection => <span className="portal-sign" key={`${track}:${connection.from}`} data-portal-node={connection.from} data-portal-to={connection.to} ref={element => { if (element) labels.current.set(connection.from, element); else labels.current.delete(connection.from); }}>
    <b className="portal-pair-mark" style={{ backgroundColor: connection.color }}>{connection.code}</b><span>{portalCaption(connection)}</span>
  </span>)}</div>;
}

export function PortalLabelProjector({ track, compact, labels, root }: { track: TrackId; compact: boolean; labels: Labels; root: RefObject<HTMLElement | null> }) {
  const { camera, size } = useThree(), point = useMemo(() => new Vector3(), []);
  const endpoints = useMemo(() => portalEndpoints(track).map(connection=>({...connection,point:portalSignPoint(track,connection.from,compact)})), [track,compact]);
  useFrame(() => {
    if (!endpoints.length || !root.current) return;
    const rect = root.current.getBoundingClientRect();
    const blocked = [...root.current.querySelectorAll<HTMLElement>('.scene-camera-toolbar,.board-minimap,.prediction-hud,.race-intro,.scene-action-banner,.dice-spotlight,.pawn-seat,.score-float,.portal-pair-panel')].flatMap(element => {
      if (getComputedStyle(element).visibility === 'hidden') return [];
      const r = element.getBoundingClientRect(); return r.width && r.height ? [{ left:r.left-rect.left, right:r.right-rect.left, top:r.top-rect.top, bottom:r.bottom-rect.top }] : [];
    });
    const candidates = endpoints.map(connection => {
      // At the outer edge of this exact cell, clear of the central pawn crowd.
      point.fromArray(connection.point).project(camera);
      const label = labels.current.get(connection.from);
      return { node:connection.from, x:(point.x+1)*size.width/2, y:(1-point.y)*size.height/2, depth:point.z, width:label?.offsetWidth??80, height:label?.offsetHeight??24 };
    });
    const placed = new Map(placePortalLabels(candidates, size.width, size.height, blocked).map(c => [c.node, c]));
    for (const [node, label] of labels.current) {
      const p = placed.get(node); label.style.visibility = p ? 'visible' : 'hidden';
      if (p) label.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%)`;
    }
  });
  return null;
}
