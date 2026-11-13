import {Box3,Matrix4,Vector3} from 'three';
import type {Racer} from '../../../shared/types.js';
import type {TrackId} from '../../../shared/tracks.js';
import type {PresentationBeat} from '../../presentation.js';
import {boardPoint} from '../math.js';
import {pawnOccupancy} from '../camera.js';
import {CertifiedTripController,TRIP_CERTIFICATES} from '../mechanisms/certified-trip.js';
import {GuardedCertifiedTripController} from '../mechanisms/runtime-entry-guards.js';
import {mechanismActions,type MechanismAction} from '../mechanisms/events.js';
import data from './scene-mechanisms-manifest.json' with {type:'json'};
export const SCENE_MECHANISMS=data;
const vec=(p:number[])=>new Vector3(p[0],p[1],p[2]);
function bounds(points:number[][],compact=false){const box=new Box3(vec(points[0]!),vec(points[1]!));return compact?box.applyMatrix4(new Matrix4().makeRotationY(-Math.PI/2)):box;}
/** Old source plans are inputs, not authorization for this new environment. This
 * consumer requires the independently sampled scene/actor/layout allowlist. */
export class SceneMechanismController extends GuardedCertifiedTripController {
 readonly actorRadius=new Map<string,number>();
 override acceptActor(id:string,hash:string,vertices:ArrayLike<number>){super.acceptActor(id,hash,vertices);let radius=0;for(let i=0;i<vertices.length;i+=3)radius=Math.max(radius,Math.hypot(vertices[i]!,vertices[i+1]!,vertices[i+2]!));this.actorRadius.set(id,radius);}
 private spacingMatches(){return typeof window!=='undefined'&&!new URLSearchParams(window.location.search).has('mechanismSpacing');}
 private clearOthers(box:Box3,except:Set<string>,track:TrackId,compact:boolean,racers:Racer[],beat?:PresentationBeat){return racers.filter(r=>!r.eliminated&&!except.has(r.id)).every(r=>{const actor=this.actors.get(r.id),radius=this.actorRadius.get(r.id);if(!actor?.ready||!actor.staticBind||radius===undefined)return false;const motion=beat?.kind==='warp'?beat.motions.find(m=>m.racerId===r.id):undefined;const nodes=new Set([r.position,...(motion?[motion.from,motion.to]:[])]);return [...nodes].every(node=>{const residents=racers.map(x=>x.id===r.id?{...x,position:node}:x),moving={...r,position:node},p=boardPoint(node,compact,track),o=pawnOccupancy(moving,residents,node,compact,track),point=new Vector3(p[0]+o.x,p[1]+.005,p[2]+o.z);return box.distanceToPoint(point)>2*radius*o.scale;});});}
 override enter(...args:Parameters<CertifiedTripController['enter']>){const[track,compact,beat,racers,now,start,duration,available,low,reduced]=args;const target=beat?.targets.length===1?racers.find(r=>r.id===beat.targets[0]):undefined;const fixture=target&&TRIP_CERTIFICATES.fixtures.find(f=>f.track===track&&f.node===target.position&&f.layout===(compact?'compact':'desktop')&&f.actor.runtimeGeometryFingerprint===this.actors.get(target.id)?.hash);const proof=fixture&&data.fixtures.find(f=>f.key===fixture.key);const allowed=!!proof&&this.clearOthers(bounds(proof.envelope),new Set([target!.id]),track,compact,racers);if(!available||!this.spacingMatches()||!allowed)this.sample(this.progress,false);super.enter(track,compact,beat,racers,now,start,duration,available&&this.spacingMatches()&&allowed,low,reduced);}
 hardwareVisible(anchor:string,track:TrackId,compact:boolean,racers:Racer[],beat?:PresentationBeat){const proof=data.approved.find(p=>p.anchor===anchor);if(!proof||!this.spacingMatches())return false;if(beat?.motions.length&&(beat.kind!=='warp'||beat.motions.length!==1))return false;const node=Number(anchor.split(':')[1]),occupants=racers.filter(r=>!r.eliminated&&r.position===node),except=new Set<string>();
  for(const r of racers.filter(r=>!r.eliminated)){const actor=this.actors.get(r.id);if(!actor?.ready||!actor.staticBind)return false;const motion=beat?.kind==='warp'?beat.motions.find(m=>m.racerId===r.id):undefined;const belongs=r.position===node||motion?.from===node||motion?.to===node;if(!belongs)continue;
   const single=occupants.every(x=>x.id===r.id)&&!racers.some(other=>other.id!==r.id&&!other.eliminated&&other.position===node);
   if(!single)return false;
   if(proof.kind==='trip'){const fixture=data.fixtures.find(f=>f.key.startsWith(`${track}/${node}/${compact?'compact':'desktop'}/`)&&f.hash===actor.hash);if(!fixture||r.tripped&&!this.protects(r.id))return false;if(beat?.kind==='trip'&&beat.targets.includes(r.id)&&this.active?.racerId!==r.id)return false;}
   else if(r.tripped||!proof.actorLayouts.some(f=>f.layout===(compact?'compact':'desktop')&&f.hash===actor.hash))return false;
   except.add(r.id);
  }
  return this.clearOthers(bounds(proof.envelope,compact),except,track,compact,racers,beat);
 }
 actionAllowed(action:MechanismAction,track:TrackId,compact:boolean,racers:Racer[],beat?:PresentationBeat){if(!this.hardwareVisible(action.anchor.id,track,compact,racers,beat)||action.targets.length!==1)return false;const actions=mechanismActions(track,beat,racers);if(action.anchor.kind!=='warp'&&new Set(actions.map(a=>a.anchor.id)).size!==1)return false;const target=racers.find(r=>r.id===action.targets[0]);if(!target||target.tripped)return false;const proof=data.approved.find(p=>p.anchor===action.anchor.id)!;return proof.actorLayouts.some(f=>f.layout===(compact?'compact':'desktop')&&f.hash===this.actors.get(target.id)?.hash);}
}
