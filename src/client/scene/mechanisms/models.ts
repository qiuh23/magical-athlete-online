import { AnimationMixer, LoopOnce, Mesh, type AnimationClip, type Group } from 'three';
import { punchPose, type PunchPose } from './punch-profile.js';
import { fitWild5TripFoot } from './static-support.js';
import type { MechanismKind } from './events.js';

export const MECHANISM_FILES: Record<MechanismKind, string> = {
  punch: 'punch_outboard_joint.glb', trip: 'trip_joint.glb', gain: 'gain_joint_action.glb',
  loss: 'loss_joint_action.glb', warp: 'warp_joint_action.glb',
};
export const MECHANISM_PAD_URLS={full:'/models/mechanisms/approved_soft_track_tile.glb',economy:'/models/mechanisms/approved_soft_track_tile_economy.glb'} as const;
/** Collision planning always uses full. Economy is a visual-only detail LOD. */
export const mechanismPadUrl=(lowQuality:boolean)=>lowQuality?MECHANISM_PAD_URLS.economy:MECHANISM_PAD_URLS.full;

export const MECHANISM_URLS = Object.fromEntries(Object.entries(MECHANISM_FILES).map(([kind,file]) => [kind, `/models/mechanisms/${file}`])) as Record<MechanismKind, string>;

/** Clone transforms and independent morph influences only. Cached geometry and
 * materials are never mutated or disposed by a placement. */
export function createMechanismInstance(source: Group, clip: AnimationClip, lowQuality = false) {
  const object = source.clone(true);
  object.traverse(node => {
    if (!(node instanceof Mesh)) return;
    node.castShadow = node.receiveShadow = !lowQuality;
    node.raycast = () => {};
    if (node.morphTargetInfluences) node.morphTargetInfluences = [...node.morphTargetInfluences];
  });
  let footAdapter:ReturnType<typeof fitWild5TripFoot>|undefined;
  const mixer = new AnimationMixer(object);
  const action = mixer.clipAction(clip);
  action.setLoop(LoopOnce,1); action.clampWhenFinished = true; action.play();
  return { object,
    fitWild5Foot(){footAdapter??=fitWild5TripFoot(object);},
    sample(progress: number) {
      // Each authored clip is five seconds only as a review source. The game
      // always samples it in the existing beat window, including paused time.
      action.paused = false;
      mixer.setTime(Math.max(0,Math.min(1,progress))*clip.duration);
      object.updateMatrixWorld(true);
    },
    /** Narrowed door domain audited against occupied cells; no root/scale change. */
    sampleWarp(progress:number){this.sample(progress);for(const name of ['WARP_DOOR_L_Z','WARP_DOOR_R_Z']){const joint=object.getObjectByName(name);if(!joint)throw Error(`Missing warp door ${name}`);joint.rotation.y*=20/90;}object.updateMatrixWorld(true);},
    samplePunch(progress:number) {this.samplePunchPose(punchPose(progress));},
    samplePunchPose(p:PunchPose) {
      object.getObjectByName('PUNCH_BOOM_Z')!.rotation.y=p.boom;
      object.getObjectByName('PUNCH_COUNTER_YAW')!.rotation.y=p.counter;
      object.getObjectByName('PUNCH_SLIDER_X')!.position.x=p.slider;
      const spring=object.getObjectByName('PUNCH_SPRING') as Mesh;
      if(spring.morphTargetInfluences)spring.morphTargetInfluences[0]=p.spring;
      object.updateMatrixWorld(true);
    },
    sampleTripPose(p:{angle:number;reach:number}) {object.getObjectByName('TRIP_ROTOR_Z')!.rotation.y=p.angle;object.getObjectByName('TRIP_REACH_X')!.position.x=p.reach;object.updateMatrixWorld(true);},
    dispose() { footAdapter?.restore();mixer.stopAllAction(); mixer.uncacheRoot(object); },
  };
}
