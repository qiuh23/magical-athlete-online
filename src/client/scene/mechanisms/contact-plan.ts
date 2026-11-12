/** Unconnected planner/executor boundary. A versioned joint domain is NOT a
 * collision certificate. Mount transforms never appear in animated phases. */
export type FiveStages = [number,number,number,number,number];
export type JointPose =
 | {rig:'trip-joint-v1';angle:number;reach:number}
 | {rig:'punch-joint-v2';boom:number;counter:number;slider:number;spring:number}
 | {rig:'trip-telescopic-v1';yaw:number;stages:FiveStages;headHeight:number};
export type ContactPhaseName='prepare'|'aim'|'extend'|'contact'|'retract'|'park'|'hold';
export interface ContactPhase {name:ContactPhaseName;start:number;end:number;from:JointPose;to:JointPose;targetId?:string}
export interface ContactIdentity {scope:string;beatKey:string;mountKey:string;layoutFingerprint:string;geometryFingerprint:string;stateFingerprint:string;targets:readonly string[]}
export const REQUIRED_AUDITS=['self','target','bystanders','deck','neighbors','target-target','containment'] as const;
export type AuditCategory=typeof REQUIRED_AUDITS[number];
export interface ContactPlan {
 identity:ContactIdentity;
 phases:readonly ContactPhase[];
 minDurationMs:number;
 evidence:{domainId:string;rig:JointPose['rig'];fixtureDigest:string;categories:readonly AuditCategory[];sampleCount:number;targets:readonly string[];uncertainPairs:number;hardCrossings:number;selfViolations:number;obstacleCrossings:number;maxSoftSeparationM:number};
}
interface BaseDomain {id:string;softLimitM:number}
export type ContactDomain = BaseDomain & (
 | {rig:'trip-joint-v1';angleMin:number;angleMax:number;strokeMin:number;strokeMax:number}
 | {rig:'punch-joint-v2';angleMin:number;angleMax:number;strokeMin:number;strokeMax:number}
 | {rig:'trip-telescopic-v1';yawMin:number;yawMax:number;stageMin:0;stageMax:number;headHeightMin:number;headHeightMax:number;driver:'synchronized-five-stage'}
);
export type PlanRejection='identity-changed'|'late-plan'|'insufficient-window'|'missing-evidence'|'geometry-failed'|'invalid-timeline'|'joint-out-of-range'|'rotation-while-extended'|'height-while-extended'|'joint-discontinuity';
const epsilon=1e-7;
const finite=(...n:number[])=>n.every(Number.isFinite);
const close=(a:number,b:number)=>Math.abs(a-b)<epsilon;
const between=(n:number,min:number,max:number)=>n>=min-epsilon&&n<=max+epsilon;
export function identityKey(identity:ContactIdentity){return JSON.stringify([identity.scope,identity.beatKey,identity.mountKey,identity.layoutFingerprint,identity.geometryFingerprint,identity.stateFingerprint,identity.targets]);}
function values(p:JointPose){switch(p.rig){case'trip-joint-v1':return[p.angle,p.reach];case'punch-joint-v2':return[p.boom,p.counter,p.slider,p.spring];case'trip-telescopic-v1':return[p.yaw,...p.stages,p.headHeight];}}
function rotations(p:JointPose){switch(p.rig){case'trip-joint-v1':return[p.angle];case'punch-joint-v2':return[p.boom,p.counter];case'trip-telescopic-v1':return[p.yaw];}}
export function poseWithinDomain(p:JointPose,d:ContactDomain):boolean {
 if(p.rig!==d.rig||!finite(...values(p)))return false;
 if(p.rig==='trip-telescopic-v1'&&d.rig==='trip-telescopic-v1')return p.stages.length===5&&d.driver==='synchronized-five-stage'&&between(p.yaw,d.yawMin,d.yawMax)&&between(p.headHeight,d.headHeightMin,d.headHeightMax)&&p.stages.every(v=>between(v,d.stageMin,d.stageMax)&&close(v,p.stages[0]));
 if(p.rig==='trip-joint-v1'&&d.rig==='trip-joint-v1')return between(p.angle,d.angleMin,d.angleMax)&&between(p.reach,d.strokeMin,d.strokeMax);
 if(p.rig==='punch-joint-v2'&&d.rig==='punch-joint-v2')return d.strokeMax>d.strokeMin&&between(p.boom,d.angleMin,d.angleMax)&&between(p.slider,d.strokeMin,d.strokeMax)&&close(p.counter,-p.boom)&&close(p.spring,(p.slider-d.strokeMin)/(d.strokeMax-d.strokeMin));
 return false;
}
function isRetracted(p:JointPose,d:ContactDomain){if(p.rig==='trip-telescopic-v1'&&d.rig==='trip-telescopic-v1')return p.stages.every(v=>close(v,d.stageMin));if(p.rig==='trip-joint-v1'&&d.rig==='trip-joint-v1')return close(p.reach,d.strokeMin);if(p.rig==='punch-joint-v2'&&d.rig==='punch-joint-v2')return close(p.slider,d.strokeMin);return false;}
export function validateContactPlan(plan:ContactPlan,identity:ContactIdentity,domain:ContactDomain,durationMs:number):PlanRejection|undefined {
 if(identityKey(plan.identity)!==identityKey(identity))return 'identity-changed';
 if(!finite(durationMs,plan.minDurationMs)||plan.minDurationMs<=0||durationMs<plan.minDurationMs)return 'insufficient-window';
 const e=plan.evidence;
 if(e.domainId!==domain.id||e.rig!==domain.rig||!e.fixtureDigest||!REQUIRED_AUDITS.every(c=>e.categories.includes(c))||!Number.isInteger(e.sampleCount)||e.sampleCount<1||JSON.stringify(e.targets)!==JSON.stringify(identity.targets))return 'missing-evidence';
 if(!finite(e.hardCrossings,e.selfViolations,e.obstacleCrossings,e.uncertainPairs,e.maxSoftSeparationM)||e.hardCrossings!==0||e.selfViolations!==0||e.obstacleCrossings!==0||e.uncertainPairs!==0||e.maxSoftSeparationM<0||e.maxSoftSeparationM>domain.softLimitM)return 'geometry-failed';
 if(!plan.phases.length||!close(plan.phases[0]!.start,0)||!close(plan.phases.at(-1)!.end,1))return 'invalid-timeline';
 for(let i=0;i<plan.phases.length;i++){
  const phase=plan.phases[i]!,previous=plan.phases[i-1];
  if(!finite(phase.start,phase.end)||phase.start<0||phase.end>1||phase.end<=phase.start||(phase.targetId&&!identity.targets.includes(phase.targetId)))return 'invalid-timeline';
  if(!poseWithinDomain(phase.from,domain)||!poseWithinDomain(phase.to,domain))return 'joint-out-of-range';
  if(previous&&(!close(previous.end,phase.start)||previous.to.rig!==phase.from.rig||values(previous.to).some((v,j)=>!close(v,values(phase.from)[j]!))))return 'joint-discontinuity';
  const movingRotation=rotations(phase.from).some((v,j)=>!close(v,rotations(phase.to)[j]!));
  if(movingRotation&&(!isRetracted(phase.from,domain)||!isRetracted(phase.to,domain)))return 'rotation-while-extended';
  if(phase.from.rig==='trip-telescopic-v1'&&phase.to.rig==='trip-telescopic-v1'&&!close(phase.from.headHeight,phase.to.headHeight)&&(!isRetracted(phase.from,domain)||!isRetracted(phase.to,domain)))return 'height-while-extended';
 }
}
/** One existing presentation clock, no timer or RAF. Yaw follows the explicit
 * audited unwrapped path, never an implicit shortest-angle interpolation. */
export function sampleContactPhases(phases:readonly ContactPhase[],progress:number){
 const t=Math.max(0,Math.min(1,progress)),phase=phases.find(p=>t<=p.end)??phases.at(-1)!;
 const x=Math.max(0,Math.min(1,(t-phase.start)/(phase.end-phase.start))),u=x*x*(3-2*x),lerp=(a:number,b:number)=>a+(b-a)*u;
 const a=phase.from,b=phase.to;let pose:JointPose=a;
 if(a.rig==='trip-joint-v1'&&b.rig===a.rig)pose={rig:a.rig,angle:lerp(a.angle,b.angle),reach:lerp(a.reach,b.reach)};
 if(a.rig==='punch-joint-v2'&&b.rig===a.rig)pose={rig:a.rig,boom:lerp(a.boom,b.boom),counter:lerp(a.counter,b.counter),slider:lerp(a.slider,b.slider),spring:lerp(a.spring,b.spring)};
 if(a.rig==='trip-telescopic-v1'&&b.rig===a.rig)pose={rig:a.rig,yaw:lerp(a.yaw,b.yaw),stages:a.stages.map((v,i)=>lerp(v,b.stages[i]!)) as FiveStages,headHeight:lerp(a.headHeight,b.headHeight)};
 return {pose,phase:phase.name,targetId:phase.targetId};
}
export function sampleContactPlan(plan:ContactPlan,progress:number){return sampleContactPhases(plan.phases,progress);}
/** Retraction target, NOT an instant visual reset. Preserve every rotation and
 * head height; the executor must audit and animate the cancellation segment. */
export function retractedPose(p:JointPose,d:ContactDomain):JointPose {
 if(p.rig!==d.rig)throw Error('Retraction domain does not match rig');
 if(p.rig==='trip-telescopic-v1'&&d.rig===p.rig)return{...p,stages:[0,0,0,0,0]};
 if(p.rig==='trip-joint-v1'&&d.rig===p.rig)return{...p,reach:d.strokeMin};
 if(p.rig==='punch-joint-v2'&&d.rig===p.rig)return{...p,slider:d.strokeMin,spring:0};
 throw Error('Unknown retraction domain');
}
export class ContactPlanConsumer {
 private plan:ContactPlan|undefined;private identity='';
 rejection:PlanRejection|undefined;
 constructor(readonly domain:ContactDomain){}
 offer(plan:ContactPlan,identity:ContactIdentity,durationMs:number,currentProgress:number){
  this.rejection=!Number.isFinite(currentProgress)||currentProgress>epsilon||currentProgress<0?'late-plan':validateContactPlan(plan,identity,this.domain,durationMs);
  this.plan=this.rejection?undefined:plan;this.identity=identityKey(identity);return !this.rejection;
 }
 sample(identity:ContactIdentity,progress:number){if(identityKey(identity)!==this.identity){this.plan=undefined;this.rejection='identity-changed';}return this.plan?sampleContactPlan(this.plan,progress):undefined;}
 cancel(){this.plan=undefined;this.identity='';}
}
