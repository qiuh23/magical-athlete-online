import {CertifiedTripController} from './certified-trip.js';
import {PunchController} from './punch-profile.js';
import {TripController} from './trip-profile.js';
/** An outer runtime restriction; the historical geometry/proof sources stay byte-identical.
 * A changed window cannot reuse an admitted beat, even if its old speed is restored. */
class StableBeatWindow {
 private key:string|undefined;private start=0;private duration=0;private valid=false;
 accepts(key:string|undefined,start:number,duration:number){
  if(key!==this.key){this.key=key;this.start=start;this.duration=duration;this.valid=true;}
  if(start!==this.start||duration!==this.duration||!Number.isFinite(start)||!Number.isFinite(duration)||duration<=0)this.valid=false;
  return this.valid;
 }
}
export class GuardedCertifiedTripController extends CertifiedTripController {
 private window=new StableBeatWindow();private enteredKey:string|undefined;private heldProgress:number|undefined;
 override sample(t:number,valid=true){
  if(this.heldProgress!==undefined){super.sample(this.heldProgress,false);return;}
  if(this.active&&!valid){this.heldProgress=this.progress;super.sample(this.heldProgress,false);return;}
  super.sample(t,valid);
 }
 override enter(...args:Parameters<CertifiedTripController['enter']>){
  const key=args[2]?.key;if(key!==this.enteredKey){this.enteredKey=key;this.heldProgress=undefined;}
  const before=this.active,progress=this.progress;
  const valid=this.window.accepts(key,args[5],args[6])&&args[7]&&this.ready;
  if(!valid)this.sample(this.progress,false);
  super.enter(args[0],args[1],args[2],args[3],args[4],args[5],args[6],valid,args[8],args[9]);
  if(before&&!this.active&&before.key===key)this.heldProgress=progress;
 }
}
export class GuardedPunchController extends PunchController {
 private window=new StableBeatWindow();
 override enter(...args:Parameters<PunchController['enter']>){
  const valid=this.window.accepts(args[1]?.key,args[4],args[5])&&args[6];
  if(!valid)this.plan=undefined; // Preserve actual pose and actor protection; no reset sweep.
  return super.enter(args[0],args[1],args[2],args[3],args[4],args[5],valid);
 }
}
export class GuardedTripController extends TripController {
 private window=new StableBeatWindow();
 override enter(...args:Parameters<TripController['enter']>){
  const valid=this.window.accepts(args[2]?.key,args[5],args[6])&&args[7];
  if(!valid)this.plan=undefined; // Do not force an already-down actor to stand.
  return super.enter(args[0],args[1],args[2],args[3],args[4],args[5],args[6],valid);
 }
}
