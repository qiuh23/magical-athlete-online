import type { Racer } from '../../../shared/types.js';
import type { TrackId } from '../../../shared/tracks.js';
import type { PresentationBeat } from '../../presentation.js';
import { boardPoint } from '../math.js';
import { mechanismsEnabled } from './layout.js';
const clamp=(t:number)=>Math.max(0,Math.min(1,t));
const smooth=(t:number)=>{const x=clamp(t);return x*x*(3-2*x);};
export interface PunchPose {boom:number;counter:number;slider:number;spring:number;route:number}
/** Exact normalized contact source (f33..126). Retraction precedes rotation. */
export function punchPose(t:number):PunchPose {
 const extension=t<=12/93?smooth(t/(12/93)):t<=26/93?1-smooth((t-12/93)/(14/93)):0;
 const yaw=t<51/93?1:1-smooth((t-51/93)/(25/93));
 return {boom:Math.PI/2*yaw,counter:-Math.PI/2*yaw,slider:.35+.35*extension,spring:extension,route:smooth((t-11/93)/(60/93))};
}
export const PUNCH_CONTACT_NODE=24;
export const PUNCH_PREPARE_FRACTION=.25;
interface Plan {kind:'prepare'|'fire';key:string;racerId:string;chainId?:string;initialYaw:number}
/** Profile is intentionally narrow: native-facing standing banana, original
 * Wild24 +X path only. No transformed form, mount, occupied path or neighbour.
 * A wide six-metre exclusion also covers idle banana stride/body extents. */
export function punchProfile(track:TrackId,beat:PresentationBeat|undefined,racers:Racer[],entry=false){
 if(!mechanismsEnabled()||track!=='wild'||beat?.kind!=='move'||beat.motions.length!==1)return;
 if(!entry&&beat.cause!=='track-arrow')return;
 const motion=beat.motions[0]!,racer=racers.find(r=>r.id===motion.racerId);
 if(motion.path.join(',')!==(entry?'23,24':'24,23,22'))return;
 if(!racer||racer.characterId!=='banana'||racer.tripped||racer.eliminated||racer.flags.form||racer.flags.hogOwnerId)return;
 const origin=boardPoint(24,false,track);
 if(racers.some(r=>r.id!==racer.id&&!r.eliminated&&(()=>{const p=boardPoint(r.position,false,track);return Math.hypot(p[0]-origin[0],p[2]-origin[2])<6||!!r.flags.form||!!r.flags.hogOwnerId;})()))return;
 const from=boardPoint(motion.from,false,track),next=boardPoint(motion.path[1]!,false,track);
 // The source proves 2.05 m pitch, not an arbitrary comparison-layout override.
 if(Math.abs(Math.hypot(next[0]-from[0],next[2]-from[2])-2.05)>1e-5)return;
 return {racerId:racer.id,node:24,motion};
}
/** Per-board lifecycle, shared by Pawn and Layer. No timers and no replay of
 * historical events. An interrupted extension retracts without sweeping; an
 * interrupted deployment holds its angle until another empty-cell preparation.
 * Only an observed preparation can authorize the immediately following arrow. */
export class PunchController {
 plan:Plan|undefined;
 protectedRacerId:string|undefined;
 protects(id:string){return this.protectedRacerId===id;}
 pose:PunchPose={boom:0,counter:0,slider:.35,spring:0,route:0};
 private key='';private fingerprint='';private observed=0;private start=0;private duration=1;
 enter(track:TrackId,beat:PresentationBeat|undefined,racers:Racer[],now:number,start:number,duration:number,available:boolean){
  if(this.protectedRacerId&&!racers.some(r=>r.id===this.protectedRacerId&&!r.eliminated&&[23,24].includes(r.position)))this.protectedRacerId=undefined;
  const key=beat?.key??'',fingerprint=JSON.stringify([beat?.events,beat?.cause,beat?.motions,racers.map(r=>[r.id,r.position,r.tripped,r.eliminated,r.characterId,r.flags])]);if(key===this.key){if(fingerprint!==this.fingerprint){this.plan=undefined;this.pose={...this.pose,slider:.35,spring:0};}return this.plan;}
  const previous=this.plan,completed=this.observed>=PUNCH_PREPARE_FRACTION&&now>=this.start+this.duration;
  this.pose={...this.pose,slider:.35,spring:0}; // Safe interrupted retraction; never a reset rotation.
  this.plan=undefined;this.key=key;this.fingerprint=fingerprint;this.observed=0;this.start=start;this.duration=duration;
  if(!available||!beat||now-start>Math.max(8,duration*.02))return;
  const fire=punchProfile(track,beat,racers);
  if(fire&&previous?.kind==='prepare'&&previous.racerId===fire.racerId&&previous.chainId===beat.chainId&&completed&&Math.abs(this.pose.boom-Math.PI/2)<1e-6){
   this.plan={kind:'fire',key,racerId:fire.racerId,chainId:beat.chainId,initialYaw:this.pose.boom};
  }else{
   const entry=punchProfile(track,beat,racers,true);
   if(entry)this.plan={kind:'prepare',key,racerId:entry.racerId,chainId:beat.chainId,initialYaw:this.pose.boom};
  }
  if(this.plan)this.protectedRacerId=this.plan.racerId;
  return this.plan;
 }
 validate(ready:boolean){if(this.plan&&!ready){this.plan=undefined;this.pose={...this.pose,slider:.35,spring:0};}}
 sample(t:number){
  if(!this.plan)return this.pose;
  this.observed=Math.max(this.observed,clamp(t));
  if(this.plan.kind==='fire'){this.pose=punchPose(t);if(t>=1)this.protectedRacerId=undefined;}
  else {const boom=this.plan.initialYaw+(Math.PI/2-this.plan.initialYaw)*smooth(t/PUNCH_PREPARE_FRACTION);this.pose={boom,counter:-boom,slider:.35,spring:0,route:smooth((t-PUNCH_PREPARE_FRACTION)/(1-PUNCH_PREPARE_FRACTION))};}
  return this.pose;
 }
 route(_t:number,id:string){return this.plan?.racerId===id?this.pose.route:undefined;}
}
