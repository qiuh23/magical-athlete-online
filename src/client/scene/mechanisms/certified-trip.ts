import type {Racer} from '../../../shared/types.js';
import type {TrackId} from '../../../shared/tracks.js';
import type {PresentationBeat} from '../../presentation.js';
import {boardPoint} from '../math.js';
import {pawnOccupancy} from '../camera.js';
import {mechanismActions} from './events.js';
import {mechanismPlacements} from './placements.js';
import {sampleContactPlan,validateContactPlan,type ContactDomain,type ContactPlan} from './contact-plan.js';
import {buildFallSupport,sampleSupportedFall,type FallSupport} from './down-pose.js';
import {telescopicTripPose,type TelescopicTripPose} from './telescopic-trip.js';
import data from './certified-trip-manifest.json' with {type:'json'};
export interface CertifiedFixture {key:string;track:TrackId;node:number;layout:string;actor:{id:string;form:string;mounted:boolean;lowQuality:boolean;geometryFingerprint:string;runtimeGeometryFingerprint:string};mount:number[];target:{position:number[];scale:number};plan:ContactPlan;actorFall:{start:number;end:number;angleFrom:number;angleTo:number;support:FallSupport}}
export const TRIP_CERTIFICATES=data as unknown as {domain:ContactDomain;fixtures:CertifiedFixture[]};
export const CERTIFIED_TRIP_URL='/models/mechanisms/trip_telescopic_v1.2f331432.glb';
const park=()=>telescopicTripPose(0,0,.2),same=(a:readonly number[],b:readonly number[])=>a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i]!)<1e-7);
const form=(r:Racer)=>typeof r.flags.form==='string'?r.flags.form:'normal';
export function certifiedTripMount(track:TrackId,node:number){return TRIP_CERTIFICATES.fixtures.some(f=>f.track===track&&f.node===node);}
export function needsCertifiedBind(track:TrackId,r:Racer,beat:PresentationBeat|undefined,lowQuality:boolean){return TRIP_CERTIFICATES.fixtures.some(f=>f.track===track&&[r.position,beat?.motions.find(m=>m.racerId===r.id)?.to].includes(f.node)&&f.actor.id===r.characterId&&f.actor.form===form(r)&&f.actor.mounted===!!r.flags.hogOwnerId&&f.actor.lowQuality===lowQuality);}
export interface RenderedActorCertificate {hash:string;ready:boolean;staticBind:boolean}
interface Active {fixture:CertifiedFixture;plan:ContactPlan;racerId:string;anchorId:string;key:string;context:string}
interface Saved {fixture:CertifiedFixture;angle:number;beatKey?:string;replacementSupport?:FallSupport}
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
/** Finite offline-certified plans, NOT an arbitrary-character collision solver.
 * No IO, BVH, timer or RAF occurs in the presentation window. A missing exact
 * rendered-geometry hash, pending loader, late beat or changed context is cue-only.
 * Interruptions hide that hardware for this scope rather than reset through a
 * pawn. A completed fall remains a per-racer pose until recovery. */
export class CertifiedTripController {
 active:Active|undefined;progress=0;ready=false;reason='not-prepared';
 readonly poses=new Map<string,TelescopicTripPose>();readonly disabled=new Set<string>();
 readonly actors=new Map<string,RenderedActorCertificate>();private saved=new Map<string,Saved>();private key='';private context='';private end=0;
 constructor(readonly scope:string){}
 private cancel(){if(this.active){this.disabled.add(this.active.anchorId);this.active=undefined;}this.reason='interrupted-cue-only';}
 enter(track:TrackId,compact:boolean,beat:PresentationBeat|undefined,racers:Racer[],now:number,start:number,duration:number,available:boolean,lowQuality:boolean,reducedMotion:boolean){
  const key=beat?.key??'',context=JSON.stringify([track,compact,lowQuality,reducedMotion,beat?.events,beat?.motions,beat?.targets,racers.map(r=>[r.id,r.characterId,r.position,r.tripped,r.eliminated,r.flags])]);
  for(const[id]of this.saved){const r=racers.find(r=>r.id===id);if(!r||r.eliminated||(!r.tripped&&!(beat?.kind==='trip'&&beat.targets.includes(id))))this.saved.delete(id);}
  if(key===this.key){if(context!==this.context){this.cancel();this.context=context;}return;}
  if(this.active){if(now>=this.end&&this.progress>=.8){this.saved.set(this.active.racerId,{fixture:this.active.fixture,angle:Math.PI/2});this.poses.set(this.active.anchorId,park());this.active=undefined;}else this.cancel();}
  this.key=key;this.context=context;this.progress=0;this.end=start+duration;
  for(const[id]of this.saved){const r=racers.find(r=>r.id===id);if(!r||r.eliminated||(!r.tripped&&!(beat?.kind==='trip'&&beat.targets.includes(id))))this.saved.delete(id);else if(r.tripped){const saved=this.saved.get(id)!;saved.angle=Math.PI/2;saved.beatKey=undefined;}}
  this.reason='no-exact-certificate';
  if(!available||!this.ready||reducedMotion||lowQuality||!beat||beat.kind!=='trip'||beat.motions.length||duration<650||now-start>Math.max(8,duration*.02))return;
  const actions=mechanismActions(track,beat,racers);if(actions.length!==1||actions[0]!.anchor.kind!=='trip'||actions[0]!.targets.length!==1||beat.targets.length!==1)return;
  const action=actions[0]!,r=racers.find(r=>r.id===action.targets[0])!,mount=mechanismPlacements(track,compact).find(p=>p.anchor.id===action.anchor.id)!;
  if(this.disabled.has(action.anchor.id)||this.saved.has(r.id)||r.tripped||r.eliminated)return;
  const o=pawnOccupancy(r,racers,r.position,compact,track),p=boardPoint(r.position,compact,track),position=[p[0]+o.x,p[1]+.005,p[2]+o.z];
  if(racers.filter(x=>!x.eliminated&&x.position===r.position).length!==1||racers.some(x=>!x.eliminated&&x.id!==r.id&&(()=>{const q=boardPoint(x.position,compact,track);return Math.hypot(q[0]-p[0],q[2]-p[2])<6;})()))return;
  const actual=this.actors.get(r.id);if(!actual?.ready||!actual.staticBind)return;
  const fixture=TRIP_CERTIFICATES.fixtures.find(f=>f.track===track&&f.node===r.position&&f.layout===(compact?'compact':'desktop')&&f.actor.runtimeGeometryFingerprint===actual.hash&&same(f.mount,mount.matrix.elements)&&same(f.target.position,position)&&Math.abs(f.target.scale-o.scale)<1e-7);
  if(!fixture)return;
  const previous=this.poses.get(action.anchor.id)??park();if(previous.yaw!==0||previous.headHeight!==.2||previous.stages.some(s=>s!==0))return;
  const plan:ContactPlan={...fixture.plan,identity:{...fixture.plan.identity,scope:this.scope,beatKey:key,targets:[r.id]},phases:fixture.plan.phases.map(ph=>({...ph,targetId:r.id})),evidence:{...fixture.plan.evidence,targets:[r.id]}};
  const error=validateContactPlan(plan,plan.identity,TRIP_CERTIFICATES.domain,duration);if(error){this.reason=error;return;}
  this.active={fixture,plan,racerId:r.id,anchorId:action.anchor.id,key,context};this.saved.set(r.id,{fixture,angle:0,beatKey:key});this.reason='certified-contact';
 }
 sample(t:number,valid=true){this.progress=Math.max(0,Math.min(1,t));if(!this.active)return;if(!valid){this.cancel();return;}this.progress=Math.max(0,Math.min(1,t));const sample=sampleContactPlan(this.active.plan,this.progress);this.poses.set(this.active.anchorId,sample.pose as TelescopicTripPose);const f=this.active.fixture.actorFall;this.saved.set(this.active.racerId,{fixture:this.active.fixture,angle:Math.PI/2*smooth((this.progress-f.start)/(f.end-f.start)),beatKey:this.active.key});}
 pose(anchor:string){return this.poses.get(anchor)??park();}
 protects(id:string){return this.saved.has(id);}
 geometry(id:string){return this.saved.get(id)?.fixture.actor;}
 acceptActor(id:string,hash:string,vertices:ArrayLike<number>){this.actors.set(id,{hash,ready:true,staticBind:true});const saved=this.saved.get(id);if(saved&&hash===saved.fixture.actor.runtimeGeometryFingerprint)delete saved.replacementSupport;if(saved&&hash!==saved.fixture.actor.runtimeGeometryFingerprint){saved.replacementSupport=buildFallSupport(vertices,saved.fixture.actorFall.support.direction);if(this.active?.racerId===id)this.cancel();}}
 parkVisible(track:TrackId,node:number,compact:boolean,racers:Racer[],beat?:PresentationBeat){
  const anchor=`${track}:${node}`;if(this.disabled.has(anchor))return false;
  const occupants=racers.filter(r=>!r.eliminated&&r.position===node);
  if(occupants.length&&![1,2,4,8].includes(occupants.length))return false;
  if(beat?.kind==='trip'&&beat.targets.some(id=>occupants.some(r=>r.id===id))&&this.active?.anchorId!==anchor)return false;
  for(const r of occupants){const saved=this.saved.get(r.id);if(saved&&(saved.replacementSupport||saved.fixture.track!==track||saved.fixture.node!==node||saved.fixture.layout!==(compact?'compact':'desktop')))return false;}
  const unknownNative=track==='squiggle'&&node===5&&compact||track==='boardwalks'&&(node===19&&!compact||node===23&&compact);
  return !(unknownNative&&occupants.length!==2&&occupants.some(r=>r.tripped&&!this.saved.has(r.id)));
 }
 fall(id:string,beat:PresentationBeat|undefined,t:number){const saved=this.saved.get(id);if(!saved)return;const activeFall=saved.beatKey===beat?.key&&beat?.kind==='trip',f=saved.fixture.actorFall;const angle=activeFall?Math.PI/2*smooth((this.progress-f.start)/(f.end-f.start)):beat?.kind==='recover'&&beat.targets.includes(id)?saved.angle*(1-smooth(t)):saved.angle;return sampleSupportedFall(saved.replacementSupport??saved.fixture.actorFall.support,angle);}
 /** Session cache contains completed displays only; no active authorization. */
 dump(){return JSON.stringify({scope:this.scope,poses:[...this.saved].filter(([,s])=>s.angle===Math.PI/2&&!s.replacementSupport).map(([id,s])=>[id,s.fixture.key])});}
 restore(text:string){try{const state=JSON.parse(text);if(state.scope!==this.scope||!Array.isArray(state.poses))return;for(const[id,key]of state.poses){const f=TRIP_CERTIFICATES.fixtures.find(f=>f.key===key);if(typeof id==='string'&&f)this.saved.set(id,{fixture:f,angle:Math.PI/2});}}catch{/* Optional local display cache is never rules state. */}}
}
