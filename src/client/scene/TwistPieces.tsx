import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Billboard } from '@react-three/drei';
import type { RoomView } from '../../shared/types.js';
import { TRACKS, type TrackId } from '../../shared/tracks.js';
import { boardPoint, TILE } from './math.js';
import { ToyCharacter } from './ToyCharacter.js';

function labelTexture(label: string) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#66498c'; context.beginPath(); context.roundRect(0, 0, 512, 128, 16); context.fill();
  context.fillStyle = '#fff7dc'; context.font = '900 66px "Microsoft YaHei",sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(label, 256, 64);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

export function TwistBoundary({ track, compact, triggered = false }: { track: TrackId; compact: boolean; triggered?:boolean }) {
  const boundary = TRACKS[track].twistBoundary;
  const texture = useMemo(() => labelTexture(triggered?'TWIST ✓':'TWIST'), [triggered]);
  useEffect(() => () => texture.dispose(), [texture]);
  if (!boundary) return null;
  const a = boardPoint(boundary.before, compact, track), b = boardPoint(boundary.after, compact, track);
  return <group name="twist-crossing-line" userData={{triggered}} position={[(a[0] + b[0]) / 2, .247, (a[2] + b[2]) / 2]} rotation={[0, Math.atan2(b[0] - a[0], b[2] - a[2]), 0]}>
    {[-1,1].map(side=><group key={side} position={[side*TILE*.62,0,0]}>
      <mesh position={[0,.08,0]}><cylinderGeometry args={[.16,.2,.16,12]}/><meshStandardMaterial color="#aa91be" roughness={.7}/></mesh>
      <mesh position={[0,.19,0]}><octahedronGeometry args={[.13,0]}/><meshStandardMaterial color={triggered?'#edc56c':'#d9cce5'} roughness={.55}/></mesh>
    </group>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[TILE * 1.07, .28]} /><meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} /></mesh>
  </group>;
}

/** Public temporary pieces have no player seat and never enter the racer list. */
export function TwistPieces({ room, compact, lowQuality, reducedMotion }: { room: RoomView; compact: boolean; lowQuality: boolean; reducedMotion: boolean }) {
  const twist = room.trackState?.twist, monster = twist?.monster;
  const texture = useMemo(() => labelTexture('游荡巨口'), []);
  const chipTexture=useMemo(()=>labelTexture('+1'),[]);
  useEffect(() => () => {texture.dispose();chipTexture.dispose();}, [texture,chipTexture]);
  const wandering = monster && !monster.racerId && !monster.finished ? boardPoint(monster.position, compact, room.track) : undefined;
  const event=room.trackState?.event,npc=event?.npc,marker=npc&&!npc.finished?boardPoint(npc.position,compact,room.track):undefined;
  return <group name="public-twist-pieces">
    <TwistBoundary track={room.track} compact={compact} triggered={!!twist?.triggered} />
    {twist?.chips?.map(position => { const point = boardPoint(position, compact, room.track); return <group key={position} name={`twist-chip-${position}`} position={[point[0] + .55, point[1] + .1, point[2] + .55]}>
      <mesh><cylinderGeometry args={[.22, .22, .09, 20]} /><meshStandardMaterial color="#ffd15b" metalness={.45} roughness={.3} /></mesh>
      <mesh position={[0,.047,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.33,.12]}/><meshBasicMaterial map={chipTexture} transparent depthWrite={false}/></mesh>
    </group>; })}
    {event?.trampolines?.map(position=>{const point=boardPoint(position,compact,room.track);return <group key={`event-${position}`} name={`event-trampoline-${position}`} position={point}><mesh position={[0,.055,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.65,.055,8,24]}/><meshStandardMaterial color="#df69aa" roughness={.4}/></mesh><mesh position={[0,.045,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.59,24]}/><meshStandardMaterial color="#444b66" roughness={.95}/></mesh>{Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return <mesh key={i} position={[Math.sin(a)*.62,.05,Math.cos(a)*.62]} rotation={[0,a,0]}><boxGeometry args={[.035,.025,.16]}/><meshStandardMaterial color="#c4ced3" metalness={.55}/></mesh>;})}</group>;})}
    {marker&&npc&&<group name={`event-marker-${npc.id}`} position={[marker[0]-.6,marker[1]+.01,marker[2]-.5]}><ToyCharacter characterId={npc.id} color="#d56cbb" lowQuality={lowQuality} motionEnabled={!reducedMotion} /><mesh position={[0,.02,0]}><cylinderGeometry args={[.55,.55,.08,20]} /><meshStandardMaterial color="#d56cbb" /></mesh></group>}
    {wandering && <group name="twist-neutral-monster" position={[wandering[0] - .55, wandering[1] + .005, wandering[2] - .45]}>
      <group scale={1.4}><ToyCharacter characterId="mouth" color="#9272bd" lowQuality={lowQuality} motionEnabled={!reducedMotion} /></group>
      <Billboard position={[0, 2.45, 0]}><mesh><planeGeometry args={[2.1, .525]} /><meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} /></mesh></Billboard>
    </group>}
  </group>;
}
