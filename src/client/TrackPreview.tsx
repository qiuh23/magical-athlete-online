import { TRACK_CATALOG } from '../shared/competition.js';
import { TRACKS } from '../shared/tracks.js';
import type { RoomView } from '../shared/types.js';
import { TrackThumbnail } from './CompetitionFields.js';
import './track-preview.css';
import { PortalPairList } from './PortalGuide.js';

/** The same authoritative route thumbnail used when configuring a race. */
export function TrackPreview({ room }: { room: Pick<RoomView, 'track' | 'round'> }) {
  const track = TRACKS[room.track], catalog = TRACK_CATALOG[room.track];
  const kinds = new Set(Object.values(track.specials).map(space => space.kind));
  const corners = [track.firstCorner >= 0 ? `第一弯道 ${track.firstCorner} 格` : '', track.secondCorner >= 0 ? `第二弯道 ${track.secondCorner} 格` : ''].filter(Boolean);
  return <section className="selection-track-preview" data-testid="selection-track-preview" data-track={room.track} aria-label="本场地图预览">
    <div className="selection-track-map"><TrackThumbnail id={room.track} /></div>
    <div className="selection-track-copy">
      <p className="selection-track-kicker">第 {room.round} 场 · 本场地图</p>
      <h2>{track.name} <small>{catalog.name}</small></h2>
      <p className="selection-track-description">{catalog.description}</p>
      {!!corners.length && <p className="selection-track-corners">{corners.join(' · ')}</p>}
      <div className="selection-track-legend" aria-label="地图图例">
        <span><b className="preview-start">起</b>起点</span><span><b className="preview-finish">终</b>终点</span>
        {kinds.has('star') && <span><b>★ / 数字</b>积分</span>}
        {kinds.has('trip') && <span><b>!</b>绊倒</span>}
        {kinds.has('arrow') && <span><b>＋ / −</b>位移</span>}
        {kinds.has('warp') && <span><b>↔</b>同字母配对传送</span>}
        {track.twistBoundary && <span><b className="preview-twist">扭</b>变化卡边界</span>}
        {!!track.bridges?.length && <span><b className="preview-bridge">▣</b>白边为高架路段</span>}
      </div>
      {kinds.has('warp') && <PortalPairList track={room.track}/>}
    </div>
  </section>;
}
