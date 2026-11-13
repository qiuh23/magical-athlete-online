import { BufferGeometry, Group, InstancedMesh, Line, LineDashedMaterial, Mesh, MeshBasicMaterial, Object3D, OctahedronGeometry, PlaneGeometry, TorusGeometry, ConeGeometry, DoubleSide, Vector3 } from 'three';
import type { Racer } from '../../../shared/types.js';
import type { TrackId } from '../../../shared/tracks.js';
import type { PresentationBeat } from '../../presentation.js';
import { pawnOccupancy } from '../camera.js';
import { boardPoint } from '../math.js';
import { mechanismActions, type MechanismAction } from '../mechanisms/events.js';
import {punchWindTravel} from './force-presentation.js';
import { fullCoveragePlacements } from './full-coverage.js';
import { scoreFlowCount, scoreFlowSample } from '../mechanisms/score-flow.js';

export type EventCue = { action: MechanismAction; targetId: string; points: Vector3[]; count: number; impulse?: {from:Vector3;to:Vector3} };
/** Cosmetic event projection only. No rig, mount, collision authorization or rule mutation. */
export function environmentEventCues(track: TrackId, beat: PresentationBeat | undefined, racers: Racer[], compact: boolean, low: boolean): EventCue[] {
  let budget = low ? 16 : 32;
  const placements=new Map(fullCoveragePlacements(track,compact).map(p=>[p.anchor.id,p]));
  const point = (node: number) => { const p = boardPoint(node, compact, track); return new Vector3(p[0], p[1] + .36, p[2]); };
  return mechanismActions(track, beat, racers).flatMap(action => {
    if (action.anchor.kind === 'warp' && action.role === 'destination') return [];
    return action.targets.flatMap(targetId => {
      const racer = racers.find(r => r.id === targetId); if (!racer) return [];
      const p = point(action.anchor.node), o = pawnOccupancy(racer, racers, action.anchor.node, compact, track);
      const target = p.clone().add(new Vector3(o.x, .22, o.z));
      const motion = action.motions.find(m => m.racerId === targetId);
      const mount=placements.get(action.anchor.id),outlet=mount?new Vector3(0,action.anchor.kind==='gain'?.14:1.05,1.20).applyMatrix4(mount.matrix):p.clone();
      const points = action.anchor.kind === 'punch' && motion ? motion.path.map(point)
        : action.anchor.kind === 'warp' && motion ? [point(motion.from), point(motion.to)]
        : [outlet, target];
      const count = ['gain', 'loss'].includes(action.anchor.kind) ? Math.min(budget, scoreFlowCount(action.scoreDelta, low)) : 0;
      budget -= count;
      const impulse=action.anchor.kind==='punch'&&mount?{
        // A pending asset uses its cabinet outlet. The mounted display layer
        // replaces this with the real sampled glove before the pressure flies.
        from:new Vector3(0,1.15,1.65).applyMatrix4(mount.matrix),
        to:new Vector3(p.x+o.x,p.y+(racer.tripped?.05:.55)*o.scale,p.z+o.z),
      }:undefined;
      return [{ action, targetId, points, count, ...(impulse?{impulse}:{}) }];
    });
  });
}
const colors = { trip: '#ffe08b', punch: '#ec947b', gain: '#ffe496', loss: '#e698d1', warp: '#8ddcdb' };
export function buildEnvironmentEventCueGeometry(cues: EventCue[]) {
  const root = new Group(); root.name = 'environment-non-contact-events';
  const lines = cues.map(cue => {
    const geometry = new BufferGeometry().setFromPoints(cue.points), material = new LineDashedMaterial({ color: colors[cue.action.anchor.kind], dashSize: .10, gapSize: .08, transparent: true, opacity: .8, depthWrite: false, toneMapped: false });
    const line = new Line(geometry, material); line.computeLineDistances(); line.raycast = () => {}; line.name = `event-cue:${cue.action.anchor.kind}:${cue.targetId}`;line.userData.trip=cue.action.anchor.kind==='trip'; line.visible = false; root.add(line); return line;
  });
  const labels = cues.filter(cue => cue.action.scoreDelta !== undefined).map(cue => {
    const mesh = new Mesh(new PlaneGeometry(.8, .34), new MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }));
    mesh.position.copy(cue.points.at(-1)!).add(new Vector3(0, .36, 0)); mesh.name = `event-score:${cue.targetId}:${cue.action.scoreDelta}`; mesh.raycast = () => {}; root.add(mesh); return { mesh, delta: cue.action.scoreDelta! };
  });
  const windGeometry=new TorusGeometry(.28,.048,8,20),windMaterial=new MeshBasicMaterial({color:'#ed7953',transparent:true,opacity:.96,depthWrite:false,toneMapped:false});
  const wind=cues.filter(c=>c.impulse).flatMap(cue=>Array.from({length:3},(_,index)=>{const mesh=new Mesh(windGeometry,windMaterial);mesh.name=`targeted-punch-wind:${cue.targetId}:${index}`;mesh.quaternion.setFromUnitVectors(new Vector3(0,0,1),cue.impulse!.to.clone().sub(cue.impulse!.from).normalize());mesh.visible=false;mesh.raycast=()=>{};root.add(mesh);return{mesh,cue,index};}));
  const plumeGeometry=new ConeGeometry(.34,1,16,1,true),plumeMaterial=new MeshBasicMaterial({color:'#fff0b2',transparent:true,opacity:.30,side:DoubleSide,depthWrite:false,toneMapped:false});
  const impactGeometry=new TorusGeometry(.24,.045,8,20),impactMaterial=new MeshBasicMaterial({color:'#fff7cf',transparent:true,opacity:.95,depthWrite:false,toneMapped:false});
  const impulses=cues.filter(c=>c.impulse).map(cue=>{const plume=new Mesh(plumeGeometry,plumeMaterial),impact=new Mesh(impactGeometry,impactMaterial),direction=cue.impulse!.to.clone().sub(cue.impulse!.from),length=direction.length();plume.quaternion.setFromUnitVectors(new Vector3(0,1,0),direction.clone().normalize());impact.quaternion.setFromUnitVectors(new Vector3(0,0,1),direction.clone().normalize());plume.name=`punch-air-volume:${cue.targetId}`;impact.name=`punch-impact:${cue.targetId}`;plume.raycast=impact.raycast=()=>{};plume.visible=impact.visible=false;root.add(plume,impact);return{plume,impact,cue,length};});
  const geometry = new OctahedronGeometry(1, 0), material = new MeshBasicMaterial({ color: '#ffe496', depthWrite: false, transparent: true, opacity: .85, toneMapped: false });
  const particles = new InstancedMesh(geometry, material, Math.max(1, cues.reduce((n, cue) => n + cue.count, 0))); particles.count = 0; particles.frustumCulled = false; particles.raycast = () => {}; particles.name = 'event-score-flow'; root.add(particles);
  const dummy = new Object3D(); let disposed = false;
  return { root, lines, labels, particles, wind, impulses, sample(progress: number, reduced: boolean) {
    let count = 0;
    for(const item of wind){const u=punchWindTravel(progress,item.index);item.mesh.visible=!reduced&&u>0&&u<1;if(item.mesh.visible){item.mesh.quaternion.setFromUnitVectors(new Vector3(0,0,1),item.cue.impulse!.to.clone().sub(item.cue.impulse!.from).normalize());item.mesh.position.lerpVectors(item.cue.impulse!.from,item.cue.impulse!.to,u);item.mesh.scale.setScalar(.8+u*.6);}}
    for(const item of impulses){const direction=item.cue.impulse!.to.clone().sub(item.cue.impulse!.from),length=direction.length();direction.normalize();item.plume.quaternion.setFromUnitVectors(new Vector3(0,1,0),direction);item.impact.quaternion.setFromUnitVectors(new Vector3(0,0,1),direction);const u=punchWindTravel(progress);item.plume.visible=!reduced&&progress>.22&&progress<.456;if(item.plume.visible){item.plume.position.lerpVectors(item.cue.impulse!.from,item.cue.impulse!.to,u*.5);item.plume.scale.set(1,length*Math.max(.02,u),1);}const hit=(progress-.40)/.13;item.impact.visible=!reduced&&hit>0&&hit<1;item.impact.position.copy(item.cue.impulse!.to);item.impact.scale.setScalar(.6+Math.max(0,hit)*1.3);}
    lines.forEach(line => { line.visible = !line.userData.trip&&(reduced || progress > 0 && progress < 1); });
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
    particles.dispose(); geometry.dispose(); material.dispose();windGeometry.dispose();windMaterial.dispose();plumeGeometry.dispose();plumeMaterial.dispose();impactGeometry.dispose();impactMaterial.dispose();
  } };
}
