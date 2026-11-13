import {type Curve,Vector3} from 'three';
import {strideLift} from '../../pawn-motion.js';
/** Single world-space root placement for both actual Pawn and finite audits.
 * The route is already built from actual boardPoint + actual occupancy offsets.
 * It already contains compact/display transforms. Do not rotate or add stride
 * again after this function. Body orientation and actual occupancy scale stay
 * in Pawn; the controller only admits fixed standing yaw0/scale1.65/offset0. */
export function r1ActorPosition(route:Curve<Vector3>,progress:number,steps:number,out=new Vector3()){
 route.getPointAt(Math.max(0,Math.min(1,progress)),out);
 out.y+=.005+strideLift(progress,steps);
 return out;
}
