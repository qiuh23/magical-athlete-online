import type {Racer} from '../../../shared/types.js';
import type {TrackId} from '../../../shared/tracks.js';
import type {PresentationBeat} from '../../presentation.js';
import {boardPoint} from '../math.js';
import {mechanismsEnabled} from './layout.js';
const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
export const TRIP_IDLE_ANGLE=Math.PI/4,TRIP_AIM_ANGLE=1.044169055361146;
export function tripPose(t:number,lowQuality=false){
 const angle=t<.08?TRIP_IDLE_ANGLE+(TRIP_AIM_ANGLE-TRIP_IDLE_ANGLE)*smooth(t/.08):t<.34?TRIP_AIM_ANGLE:TRIP_AIM_ANGLE+(TRIP_IDLE_ANGLE-TRIP_AIM_ANGLE)*smooth((t-.34)/.16);
 const extension=t<.08?0:t<.16?smooth((t-.08)/.08):t<.30?1-smooth((t-.16)/.14):0;
 return {angle,reach:(lowQuality?.4475:.4365)*extension};
}
export function residentReflow(t:number){const f=smooth(t/.35);return {x:.45*f,scale:1.65-.51*f};}
interface Plan{kind:'entry'|'trip';key:string;newId:string;oldId:string;chainId?:string}
export function tripEntryProfile(track:TrackId,compact:boolean,beat:PresentationBeat|undefined,racers:Racer[]){
 if(!mechanismsEnabled()||track!=='wild'||compact||beat?.kind!=='move'||beat.motions.length!==1||beat.motions[0]?.path.join(',')!=='4,5')return;
 const next=racers.find(r=>r.id===beat.motions[0]!.racerId),residents=racers.filter(r=>!r.eliminated&&r.position===5);
 if(!next||residents.length!==1)return;const old=residents[0]!;
 if(next.characterId!=='banana'||next.tripped||next.eliminated||old.characterId!=='banana'||!old.tripped||racers.indexOf(next)>racers.indexOf(old)||[next,old].some(r=>r.flags.form||r.flags.hogOwnerId))return;
 const p=boardPoint(5,false,track),from=boardPoint(4,false,track);
 if(Math.abs(Math.hypot(p[0]-from[0],p[2]-from[2])-2.05)>1e-5||racers.some(r=>r.id!==next.id&&r.id!==old.id&&!r.eliminated&&(()=>{const q=boardPoint(r.position,false,track);return Math.hypot(q[0]-p[0],q[2]-p[2])<6;})()))return;
 return {newId:next.id,oldId:old.id};
}
/** Native-pose profile only: one earlier-down right-slot banana and one new
 * left-slot arrival. Reflow changes display transforms, never rules state. */
export class TripController {
 plan:Plan|undefined;protectedIds:string[]=[];protects(id:string){return this.protectedIds.includes(id);}
 progress=0;pose={angle:TRIP_IDLE_ANGLE,reach:0};
 private key='';private fingerprint='';private start=0;private duration=1;private observed=0;
 enter(track:TrackId,compact:boolean,beat:PresentationBeat|undefined,racers:Racer[],now:number,start:number,duration:number,available:boolean){
  this.protectedIds=this.protectedIds.filter(id=>racers.some(r=>r.id===id&&!r.eliminated&&[4,5].includes(r.position)));
  const key=beat?.key??'',fingerprint=JSON.stringify([track,compact,beat?.events,beat?.cause,beat?.motions,beat?.targets,racers.map(r=>[r.id,r.position,r.tripped,r.eliminated,r.characterId,r.flags])]);if(key===this.key){if(fingerprint!==this.fingerprint){this.plan=undefined;this.pose={...this.pose,reach:0};}return this.plan;}
  const previous=this.plan,completed=this.observed>=.35&&now>=this.start+this.duration;
  this.key=key;this.fingerprint=fingerprint;this.start=start;this.duration=duration;this.observed=0;this.progress=0;this.plan=undefined;this.pose={...this.pose,reach:0};
  if(!available||!beat||track!=='wild'||compact||now-start>Math.max(8,duration*.02))return;
  if(previous?.kind==='entry'&&completed&&previous.chainId===beat.chainId&&beat.kind==='trip'&&beat.targets.length===1&&beat.targets[0]===previous.newId&&beat.events.some(e=>e.type==='trip'&&e.source==='track'&&e.targets?.length===1&&e.targets[0]===previous.newId)){
   const present=racers.filter(r=>r.position===5&&!r.eliminated);
   if(present.length===2&&present[0]?.id===previous.newId&&!present[0].tripped&&present[1]?.id===previous.oldId&&present[1].tripped&&present.every(r=>r.characterId==='banana'&&!r.flags.form&&!r.flags.hogOwnerId))this.plan={...previous,kind:'trip',key};
  }else {const entry=tripEntryProfile(track,compact,beat,racers);if(entry)this.plan={...entry,kind:'entry',key,chainId:beat.chainId};}
  if(this.plan)this.protectedIds=[this.plan.newId,this.plan.oldId];
  return this.plan;
 }
 validate(ready:boolean){if(this.plan&&!ready){this.plan=undefined;this.pose={...this.pose,reach:0};}}
 sample(t:number,lowQuality:boolean){if(!this.plan)return this.pose;this.progress=Math.max(0,Math.min(1,t));this.observed=Math.max(this.observed,this.progress);this.pose=this.plan.kind==='trip'?tripPose(t,lowQuality):{angle:TRIP_IDLE_ANGLE,reach:0};return this.pose;}
 involves(id:string){return this.plan?.newId===id||this.plan?.oldId===id;}
}
