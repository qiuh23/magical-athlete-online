import {Matrix4,Vector3,type Object3D}from'three';
import type{Racer}from'../../../../shared/types.js';import type{TrackId}from'../../../../shared/tracks.js';import type{PresentationBeat}from'../../../presentation.js';
import {boardPoint}from'../../math.js';import{pawnOccupancy}from'../../camera.js';import{mechanismActions}from'../events.js';import type{ActorGeometrySnapshot}from'../actor-snapshot.js';import{r1Mount,r1Pose,r1Route,r1Signature,verifyR1Witness,R1_PARK,type R1Solution}from'./plan.js';
export interface R1EvidenceFixture{node:number;compact:boolean;lowQuality:boolean;actorHash:string;path:number[];mount:number[];solutionSignature:string;solution:R1Solution;sceneHash:string;foundationBottom?:number;foundationCenterBottom?:number}
export interface R1Evidence{version:string;productionApproved:boolean;sceneHash:string;fixtures:R1EvidenceFixture[]}
export interface R1Context{track:TrackId;compact:boolean;lowQuality:boolean;beat?:PresentationBeat;racers:Racer[];now:number;start:number;duration:number;available:boolean;sceneHash:string;reducedMotion:boolean;paused?:boolean}
interface Actor{hash:string;snapshot:ActorGeometrySnapshot}
interface Plan{racerId:string;node:number;key:string;solution:R1Solution;path:number[];actorHash:string;context:string}
const spacingMatches=()=>typeof window==='undefined'||!new URLSearchParams(window.location.search).has('mechanismSpacing');
const clamp=(t:number)=>Math.max(0,Math.min(1,t)),equal=(a:readonly number[],b:readonly number[])=>a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i]!)<1e-7);
/** Only exact finite evidence authorizes the surface-query candidate. Unknown
 * shape/scene/path gets a rule-preserving cue, never unverified physical contact. */
export class R1PunchController{
 ready=false;reason='not-ready';active:Plan|undefined;progress=0;readonly actors=new Map<string,Actor>();readonly disabled=new Set<number>();private rig:Object3D|undefined;private key='';private context='';private seen=new Set<string>();private paused=false;private ledger:{key:string;racerId:string;path:string}|undefined;
 constructor(readonly scope:string,readonly evidence:R1Evidence){}
 bindRig(scene:Object3D){this.rig=scene;this.ready=true;}
 invalidateRig(){this.ready=false;this.cancel('rig-unavailable');}
 acceptActor(id:string,hash:string,snapshot:ActorGeometrySnapshot){if(snapshot.requiresSkeletonFreeze)return;this.actors.set(id,{hash,snapshot});}
 invalidateActor(id:string){this.actors.delete(id);if(this.active?.racerId===id)this.cancel('actor-changed');}
 private cancel(reason:string){if(this.active)this.disabled.add(this.active.node);this.active=undefined;this.reason=reason;}
 protects(id:string){return this.ledger?.racerId===id;}
 route(id:string,t:number){return this.ledger?.racerId===id?r1Route(this.paused?this.progress:t):undefined;}
 pose(node:number,t:number){return this.active?.node===node?r1Pose(this.active.solution,t):{...R1_PARK};}
 enter(input:R1Context){
  const {track,compact,lowQuality,beat,racers,now,start,duration,available,sceneHash,reducedMotion}=input,key=beat?.key??'';this.paused=!!input.paused;
  const context=JSON.stringify([track,compact,lowQuality,sceneHash,reducedMotion,start,duration,beat?.kind,beat?.cause,beat?.targets,beat?.events,beat?.motions,racers.map(r=>[r.id,r.position,r.characterId,r.tripped,r.eliminated,r.flags])]);
  if(key===this.key){if(context!==this.context||!available||!this.ready){this.cancel('changed-context');this.context=context;}return;}
  if(this.active&&this.progress<1)this.disabled.add(this.active.node);
  this.active=undefined;this.ledger=undefined;this.key=key;this.context=context;this.progress=0;this.reason='cue-only';
  if(key&&this.seen.has(key))return;if(key)this.seen.add(key);
  if(!spacingMatches()||this.paused||!this.evidence.productionApproved||sceneHash!==this.evidence.sceneHash||!available||!this.ready||!this.rig||reducedMotion||duration<650||!beat||beat.kind!=='move'||beat.cause!=='track-arrow'||beat.motions.length!==1||beat.targets.length!==1||now-start>Math.max(8,duration*.02)||now<start)return;
  const actions=mechanismActions(track,beat,racers);if(actions.length!==1||actions[0]!.anchor.kind!=='punch'||actions[0]!.targets.length!==1)return;
  const action=actions[0]!,motion=beat.motions[0]!,r=racers.find(r=>r.id===action.targets[0]);if(!r||r.id!==motion.racerId||r.tripped||r.eliminated||r.flags.form||r.flags.hogOwnerId||this.disabled.has(motion.from))return;
  const mount=r1Mount(track,motion.from,compact),actor=this.actors.get(r.id);if(!mount||!actor||actor.snapshot.requiresSkeletonFreeze)return;
  const from=pawnOccupancy(r,racers,motion.from,compact,track),destinations=racers.map(p=>p.id===r.id?{...p,position:motion.to}:p),to=pawnOccupancy(r,destinations,motion.to,compact,track);
  if(from.scale!==1.65||to.scale!==1.65||from.x!==0||from.z!==0||to.x!==0||to.z!==0)return;
  const path=motion.path.map(n=>new Vector3(...boardPoint(n,compact,track)));
  // A conservative 6 m corridor includes every segment, not only its nodes.
  if(racers.some(other=>other.id!==r.id&&!other.eliminated&&path.some((p,i)=>{const q=new Vector3(...boardPoint(other.position,compact,track));if(!i)return q.distanceTo(p)<6;const a=path[i-1]!,d=p.clone().sub(a),u=clamp(q.clone().sub(a).dot(d)/d.lengthSq());return q.distanceTo(a.clone().addScaledVector(d,u))<6;})))return;
  const matches=this.evidence.fixtures.filter(f=>f.sceneHash===sceneHash&&f.node===motion.from&&f.compact===compact&&f.lowQuality===lowQuality&&f.actorHash===actor.hash&&equal(f.path,motion.path)&&equal(f.mount,mount.matrix.elements));if(!matches.length)return;
  const world=new Matrix4().makeScale(1.65,1.65,1.65).setPosition(path[0]!.clone().add(new Vector3(0,.005,0))),inverse=mount.matrix.clone().invert(),direction=path[1]!.clone().sub(path[0]!).normalize().transformDirection(inverse);
  if(Math.abs(direction.y)>1e-6)return;const local=inverse.multiply(world),solution=matches.map(f=>verifyR1Witness(this.rig!,actor.snapshot,local,f.solution)).find(s=>s&&matches.some(f=>f.solutionSignature===r1Signature(s)));if(!solution)return;
  this.active={racerId:r.id,node:motion.from,key,solution,path:[...motion.path],actorHash:actor.hash,context};this.ledger={key,racerId:r.id,path:motion.path.join(',')};this.reason='finite-contact';
 }
 sample(t:number,available:boolean){this.progress=clamp(t);if(this.active&&(!available||this.actors.get(this.active.racerId)?.hash!==this.active.actorHash))this.cancel('load-or-geometry-changed');}
 parkVisible(node:number,input:Pick<R1Context,'track'|'compact'|'lowQuality'|'sceneHash'|'available'|'racers'|'beat'>){
  if(!spacingMatches()||!input.available||!this.ready||!this.evidence.productionApproved||input.sceneHash!==this.evidence.sceneHash||this.disabled.has(node))return false;if(this.active?.node===node)return true;
  const mount=r1Mount(input.track,node,input.compact);if(!mount||!this.evidence.fixtures.some(f=>f.node===node&&f.compact===input.compact&&f.lowQuality===input.lowQuality&&equal(f.mount,mount.matrix.elements)))return false;
  // Idle hardware is hidden for any incoming/outgoing route near this mount,
  // including actors whose pre-beat node is farther away.
  if(input.beat?.motions.some(m=>m.path.some((n,i)=>{const p=new Vector3(...boardPoint(n,input.compact,input.track));if(!i)return p.distanceTo(mount.origin)<6;const a=new Vector3(...boardPoint(m.path[i-1]!,input.compact,input.track)),d=p.clone().sub(a),u=clamp(mount.origin.clone().sub(a).dot(d)/d.lengthSq());return mount.origin.distanceTo(a.addScaledVector(d,u))<6;})))return false;
  const near=input.racers.filter(r=>!r.eliminated&&new Vector3(...boardPoint(r.position,input.compact,input.track)).distanceTo(mount.origin)<6);
  if(!near.length)return true;if(near.length!==1)return false;const r=near[0]!,actor=this.actors.get(r.id);if(!actor||r.position!==node||r.tripped||r.flags.form||r.flags.hogOwnerId||input.beat?.motions.some(m=>m.racerId===r.id))return false;
  return this.evidence.fixtures.some(f=>f.node===node&&f.compact===input.compact&&f.lowQuality===input.lowQuality&&f.actorHash===actor.hash&&equal(f.mount,mount.matrix.elements));
 }
}
export function needsR1Bind(track:TrackId,r:Racer,beat:PresentationBeat|undefined){return !r.eliminated&&!![r.position,...(beat?.motions.filter(m=>m.racerId===r.id).flatMap(m=>[m.from,m.to])??[])].find(n=>r1Mount(track,n,false));}
