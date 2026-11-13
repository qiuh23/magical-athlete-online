import { RebuiltScenery } from './environment/RebuiltScenery.js';
import { ExpansionScenery } from './ExpansionScenery.js';
import { expansionTileSize } from './expansion-layout.js';
import { BridgesRoads, BridgeRouteBadges } from './BridgesStructure.js';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TRACKS, type TrackId } from '../../shared/tracks.js';
import { nextTrackNodes } from '../../shared/track-topology.js';
import { boardBounds, boardPoint, TILE, trackConnections, trackNodeIds } from './math.js';
import { specialTileTexture } from './tile-art.js';

function nodeTexture(id: number, finish: number, remaining?: number) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d')!;
  if(remaining!==undefined){context.strokeStyle='rgba(116,81,45,.14)';context.lineWidth=2;for(let y=15;y<256;y+=36){context.beginPath();context.moveTo(0,y);context.lineTo(256,y);context.stroke()}}
  context.fillStyle = '#173f37'; context.textAlign = 'center'; context.textBaseline = 'middle';
  context.font = '900 55px "Microsoft YaHei", sans-serif';
  context.fillText(id === 0 ? '起点' : id === finish ? '终点' : String(id), 128, 94);
  if (remaining !== undefined && id !== 0 && id !== finish) {
    context.font = '700 26px "Microsoft YaHei", sans-serif'; context.fillText(`距终点 ${remaining}`, 128, 185);
  }
  if (id === 0 || id === finish) for (let i = 0; i < 10; i++) {
    context.fillStyle = i % 2 ? '#fff9db' : '#173f37'; context.fillRect(18 + i * 22, 213, 22, 17);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function TopologyTile({ track, id, triggered }: { track: TrackId; id: number; triggered: boolean }) {
  const definition = TRACKS[track], point = boardPoint(id, false, track), special = definition.specials[id];
  const next = nextTrackNodes(definition, id, Math.sign(special?.move ?? 1))[0];
  const toward = boardPoint(next ?? id, false, track);
  const angle = Math.atan2(-(toward[0] - point[0]), -(toward[2] - point[2]));
  const texture = useMemo(() => special ? specialTileTexture(special.kind, special.move, id, angle, special.points, special.to) : nodeTexture(id, definition.finish, track === 'boardwalks' ? definition.remaining?.[id] : undefined), [id, track, special, angle, definition.finish]);
  useEffect(() => () => texture.dispose(), [texture]);
  const size = expansionTileSize(track,id);
  const source = definition.nodes?.[id]?.color;
  const soft:Record<string,string>={'#f34b22':'#e99d7e','#639fd0':'#97beca','#509542':'#9eba84','#e9b51b':'#e9c77b','#ce85ba':'#c6a5c7'};
  const color = id===0?'#82c5ae':id===definition.finish?'#efb15a':track==='bridges'?point[1]>.3?'#e7c68f':'#90b7b4':soft[source??'']??'#ead3a2';
  const geometry = useMemo(() => new RoundedBoxGeometry(size, .14, size, 2, .04), [size]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group name={`track-node-${id}`} position={point}>
    <mesh geometry={geometry} position={[0, -.07, 0]} receiveShadow castShadow>
      <meshStandardMaterial color={color} roughness={.74} emissive={color} emissiveIntensity={triggered ? .24 : 0} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .01, 0]}>
      <planeGeometry args={[size * .92, size * .92]} /><meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} />
    </mesh>
    {track !== 'bridges' && (definition.nodes?.[id]?.y ?? 0) > 0 && [-1, 1].map(side => <mesh key={side} position={[side * size * .39, -(point[1] - .12) / 2, 0]} castShadow>
      <boxGeometry args={[.13, point[1] - .12, size * .8]} /><meshStandardMaterial color="#738e74" roughness={.8} />
    </mesh>)}
  </group>;
}

/** Independent courses retain every source fork and bridge; node IDs never draw the edges. */
export function TopologyStadium({ track, compact, triggered, lowQuality, environmentReady=false }: { track: TrackId; compact: boolean; triggered: Set<number>; lowQuality:boolean; environmentReady?:boolean }) {
  const definition = TRACKS[track];
  return <group rotation={[0, compact ? -Math.PI / 2 : 0, 0]} name={`topology-stadium-${track}`}>
    {environmentReady ? <RebuiltScenery track={track} lowQuality={lowQuality} mode="route"/> : <ExpansionScenery track={track} lowQuality={lowQuality}/>}
    {track === 'bridges' && <><BridgesRoads/><BridgeRouteBadges/></>}
    {trackNodeIds(track).sort((a, b) => (definition.nodes?.[a]?.y ?? 0) - (definition.nodes?.[b]?.y ?? 0)).map(id => <TopologyTile key={id} {...{ track, id }} triggered={triggered.has(id)} />)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.925, 0]} receiveShadow><planeGeometry args={[240, 240]} /><meshStandardMaterial color="#e3dcca" roughness={1} /></mesh>
  </group>;
}
