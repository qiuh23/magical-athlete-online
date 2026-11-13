import { BufferGeometry, Group, InstancedMesh, Line, LineDashedMaterial, Mesh, MeshBasicMaterial, Object3D, OctahedronGeometry, PlaneGeometry, Vector3 } from 'three';
import type { Racer } from '../../../shared/types.js';
import type { TrackId } from '../../../shared/tracks.js';
import type { PresentationBeat } from '../../presentation.js';
import { pawnOccupancy } from '../camera.js';
import { boardPoint } from '../math.js';
import { mechanismActions, type MechanismAction } from '../mechanisms/events.js';
import { scoreFlowCount, scoreFlowSample } from '../mechanisms/score-flow.js';

export type EventCue = { action: MechanismAction; targetId: string; points: Vector3[]; count: number };
/** Cosmetic event projection only. No rig, mount, collision authorization or rule mutation. */
export function environmentEventCues(track: TrackId, beat: PresentationBeat | undefined, racers: Racer[], compact: boolean, low: boolean): EventCue[] {
  let budget = low ? 16 : 32;
  const point = (node: number) => { const p = boardPoint(node, compact, track); return new Vector3(p[0], p[1] + .36, p[2]); };
  return mechanismActions(track, beat, racers).flatMap(action => {
    if (action.anchor.kind === 'warp' && action.role === 'destination') return [];
    return action.targets.flatMap(targetId => {
      const racer = racers.find(r => r.id === targetId); if (!racer) return [];
      const p = point(action.anchor.node), o = pawnOccupancy(racer, racers, action.anchor.node, compact, track);
      const target = p.clone().add(new Vector3(o.x, .22, o.z));
      const motion = action.motions.find(m => m.racerId === targetId);
      const points = action.anchor.kind === 'punch' && motion ? motion.path.map(point)
        : action.anchor.kind === 'warp' && motion ? [point(motion.from), point(motion.to)]
        : [p.clone().add(new Vector3(compact ? 0 : -.6, .08, compact ? .6 : 0)), target];
      const count = ['gain', 'loss'].includes(action.anchor.kind) ? Math.min(budget, scoreFlowCount(action.scoreDelta, low)) : 0;
      budget -= count;
      return [{ action, targetId, points, count }];
    });
  });
}
const colors = { trip: '#ffe08b', punch: '#ec947b', gain: '#ffe496', loss: '#e698d1', warp: '#8ddcdb' };
export function buildEnvironmentEventCueGeometry(cues: EventCue[]) {
  const root = new Group(); root.name = 'environment-non-contact-events';
  const lines = cues.map(cue => {
    const geometry = new BufferGeometry().setFromPoints(cue.points), material = new LineDashedMaterial({ color: colors[cue.action.anchor.kind], dashSize: .10, gapSize: .08, transparent: true, opacity: .8, depthWrite: false, toneMapped: false });
    const line = new Line(geometry, material); line.computeLineDistances(); line.raycast = () => {}; line.name = `event-cue:${cue.action.anchor.kind}:${cue.targetId}`; line.visible = false; root.add(line); return line;
  });
  const labels = cues.filter(cue => cue.action.scoreDelta !== undefined).map(cue => {
    const mesh = new Mesh(new PlaneGeometry(.8, .34), new MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }));
    mesh.position.copy(cue.points.at(-1)!).add(new Vector3(0, .36, 0)); mesh.name = `event-score:${cue.targetId}:${cue.action.scoreDelta}`; mesh.raycast = () => {}; root.add(mesh); return { mesh, delta: cue.action.scoreDelta! };
  });
  const geometry = new OctahedronGeometry(1, 0), material = new MeshBasicMaterial({ color: '#ffe496', depthWrite: false, transparent: true, opacity: .85, toneMapped: false });
  const particles = new InstancedMesh(geometry, material, Math.max(1, cues.reduce((n, cue) => n + cue.count, 0))); particles.count = 0; particles.frustumCulled = false; particles.raycast = () => {}; particles.name = 'event-score-flow'; root.add(particles);
  const dummy = new Object3D(); let disposed = false;
  return { root, lines, labels, particles, sample(progress: number, reduced: boolean) {
    let count = 0;
    lines.forEach(line => { line.visible = reduced || progress > 0 && progress < 1; });
    labels.forEach(({mesh}) => { mesh.visible = reduced || progress < 1; });
    if (!reduced) for (const cue of cues) for (let i = 0; i < cue.count; i++) {
      const sample = scoreFlowSample(progress, i, cue.count); if (!sample) continue;
      // Direction follows the authoritative sign, not the tile's printed value.
      const [a, b] = [cue.points[0]!, cue.points.at(-1)!], gain = (cue.action.scoreDelta ?? 0) > 0;
      dummy.position.lerpVectors(gain ? a : b, gain ? b : a, sample.u); dummy.position.y += sample.arc; dummy.scale.setScalar(sample.scale); dummy.updateMatrix(); particles.setMatrixAt(count++, dummy.matrix);
    }
    particles.count = count; particles.instanceMatrix.needsUpdate = true;
  }, dispose() {
    if (disposed) return; disposed = true;
    lines.forEach(line => { line.geometry.dispose(); line.material.dispose(); });
    labels.forEach(({mesh}) => { mesh.geometry.dispose(); mesh.material.dispose(); });
    particles.dispose(); geometry.dispose(); material.dispose();
  } };
}
