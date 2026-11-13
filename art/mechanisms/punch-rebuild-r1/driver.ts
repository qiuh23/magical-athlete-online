import { Mesh, Object3D } from 'three';
export const RIG_VERSION = 'punch-rebuild-r1' as const;
export interface RebuildPose { boomYaw:number; headYaw:number; reach:number; stroke:number }
export const PARK:Readonly<RebuildPose>={boomYaw:Math.PI/3,headYaw:Math.PI/12,reach:0,stroke:0};
export function assertPose(p:RebuildPose):void {
 const ranges={boomYaw:[Math.PI/6,Math.PI/2],headYaw:[0,Math.PI/6],reach:[0,.30],stroke:[0,.35]} as const;
 for(const key of Object.keys(ranges) as (keyof RebuildPose)[]){const [a,b]=ranges[key];if(!Number.isFinite(p[key])||p[key]<a||p[key]>b)throw Error(`${RIG_VERSION}: invalid ${key}`);}
}
/** Motion policy only, not actor/environment authorization. */
export function assertTransition(a:RebuildPose,b:RebuildPose):void {
 assertPose(a);assertPose(b);
 if((a.boomYaw!==b.boomYaw||a.headYaw!==b.headYaw)&&(a.reach!==0||b.reach!==0))throw Error('Retract telescope before changing aim');
 if(['boomYaw','headYaw','reach'].some(k=>a[k as keyof RebuildPose]!==b[k as keyof RebuildPose])&&(a.stroke!==0||b.stroke!==0))throw Error('Retract the fist before aiming or telescoping');
}
const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
export function interpolate(a:RebuildPose,b:RebuildPose,t:number):RebuildPose {
 assertTransition(a,b);if(!Number.isFinite(t))throw Error('Invalid progress');if(t<=0)return {...a};if(t>=1)return {...b};
 const q=smooth(t);return {boomYaw:a.boomYaw+(b.boomYaw-a.boomYaw)*q,headYaw:a.headYaw+(b.headYaw-a.headYaw)*q,reach:a.reach+(b.reach-a.reach)*q,stroke:a.stroke+(b.stroke-a.stroke)*q};
}
/** Stroke-only interruption; holds aim/reach, no reset sweep or root movement. */
export const retract=(p:RebuildPose,t:number)=>interpolate(p,{...p,stroke:0},t);
/** Review cycle only. Game event, target and route integration intentionally absent. */
export function reviewPose(t:number):RebuildPose {
 const aimed={...PARK,boomYaw:Math.PI/2,headYaw:0},reached={...aimed,reach:.30},fired={...reached,stroke:.35};
 const steps=[{end:.25,pose:aimed},{end:.45,pose:reached},{end:.65,pose:fired},{end:.80,pose:reached},{end:.90,pose:aimed},{end:1,pose:{...PARK}}];
 if(!Number.isFinite(t))throw Error('Invalid progress');let from={...PARK},start=0;
 for(const step of steps){if(t<=step.end)return interpolate(from,step.pose,(t-start)/(step.end-start));from=step.pose;start=step.end;}return {...PARK};
}
export function bindRebuildDriver(root:Object3D) {
 const get=(name:string)=>{const n=root.getObjectByName(name);if(!n)throw Error(`Missing ${RIG_VERSION} joint ${name}`);return n;};
 const boom=get('PUNCH_BOOM_Z'),head=get('PUNCH_COUNTER_YAW'),first=get('PUNCH_R1_TELESCOPE_1'),second=get('PUNCH_R1_TELESCOPE_2'),slider=get('PUNCH_SLIDER_X'),spring=get('PUNCH_SPRING');
 if(!(spring instanceof Mesh)||spring.morphTargetInfluences?.length!==1)throw Error('Expected one real spring morph target');
 return {sample(p:RebuildPose){assertPose(p);boom.rotation.set(0,p.boomYaw,0);head.rotation.set(0,p.headYaw-p.boomYaw,0);first.position.set(p.reach/2,0,0);second.position.set(p.reach/2,0,0);slider.position.set(.35+p.stroke,0,0);spring.morphTargetInfluences![0]=p.stroke/.35;root.updateMatrixWorld(true);}};
}
