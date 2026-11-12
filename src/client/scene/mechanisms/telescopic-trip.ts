import {Mesh,type Group,type Object3D} from 'three';
import {fitWild5TripFoot}from'./static-support.js';
import {poseWithinDomain,type ContactDomain,type FiveStages,type JointPose} from './contact-plan.js';
/** Prototype kinematic domain only. This file registers no production asset,
 * grants no contact permission and must not be confused with sweep evidence. */
export const TELESCOPIC_TRIP_DOMAIN:Extract<ContactDomain,{rig:'trip-telescopic-v1'}>={id:'trip-telescopic-v1/sync5-height-v1',rig:'trip-telescopic-v1',yawMin:0,yawMax:Math.PI*2,stageMin:0,stageMax:.37,headHeightMin:.16,headHeightMax:.24,driver:'synchronized-five-stage',softLimitM:.02};
export type TelescopicTripPose=Extract<JointPose,{rig:'trip-telescopic-v1'}>;
export function telescopicTripPose(yaw:number,totalReach:number,headHeight:number):TelescopicTripPose {
 const stages=Array(5).fill(totalReach/5) as FiveStages,pose:TelescopicTripPose={rig:'trip-telescopic-v1',yaw,stages,headHeight};
 if(!poseWithinDomain(pose,TELESCOPIC_TRIP_DOMAIN))throw Error('Trip pose outside prototype synchronized domain');return pose;
}
export function telescopicTripTip(pose:TelescopicTripPose){if(!poseWithinDomain(pose,TELESCOPIC_TRIP_DOMAIN))throw Error('Invalid trip FK input');const r=.48+pose.stages.reduce((sum,n)=>sum+n,0);return{x:r*Math.cos(pose.yaw),y:pose.headHeight,z:1.62-r*Math.sin(pose.yaw)};}
/** Only independent transforms are cloned. No animation mixer, asset fetch,
 * geometry/material clone or dispose is needed. Initialize all actuators before
 * first display because the GLB's exported pose is not a runtime contract. */
export function createTelescopicTripInstance(source:Group,lowQuality=false){
 const object=source.clone(true),get=(name:string)=>{const node=object.getObjectByName(name);if(!node)throw Error(`Missing telescopic trip joint: ${name}`);return node;};
 const root=get('TRIP_ROOT'),yaw=get('TRIP_ROTOR_Z'),head=get('TRIP_TIP_HEIGHT_Z');
 const stages=Array.from({length:5},(_,i)=>get(`TRIP_TEL_STAGE_${i+1}_X`));
 let parent:Object3D=yaw;for(const node of stages){if(node.parent!==parent)throw Error(`Unexpected trip stage parent: ${node.name}`);parent=node;}
 if(!head.parent||!stages[4]!.getObjectById(head.id))throw Error('Unexpected trip height parent');
 object.traverse(node=>{if(node instanceof Mesh){node.castShadow=node.receiveShadow=!lowQuality;node.raycast=()=>{};if(node.morphTargetInfluences)node.morphTargetInfluences=[...node.morphTargetInfluences];}});
 let footAdapter:ReturnType<typeof fitWild5TripFoot>|undefined;
 const initialRoot=root.matrix.clone();
 const sample=(pose:TelescopicTripPose)=>{if(!poseWithinDomain(pose,TELESCOPIC_TRIP_DOMAIN))throw Error('Rejected out-of-domain trip pose');yaw.rotation.y=pose.yaw;stages.forEach((node,i)=>{node.position.x=pose.stages[i]!;});head.position.y=pose.headHeight-.20;object.updateMatrixWorld(true);};
 sample(telescopicTripPose(0,0,.20));
 return{object,sample,fitWild5Foot(){footAdapter??=fitWild5TripFoot(object);},rootLocalMatrix:initialRoot,dispose(){footAdapter?.restore();/* Shared source ownership remains with the loader. */}};
}
