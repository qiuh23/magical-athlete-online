import {getTriangleContactIndex,TriangleContactBox} from '../mechanisms/triangle-contact-index.js';
import {Box3,BoxGeometry,Group,Matrix4,Mesh,MeshStandardMaterial,Triangle,Vector3} from 'three';

export interface SweepActor {id:string;triangles:Triangle[];lower:Triangle[];bounds:Box3;lowerBounds:Box3}
export interface TripSweepPose {yaw:number;reach:number;height:number;inner?:number;lift?:number}
export interface TripSweepPlan {key:string;anchor:string;start:number;end:number;reach:number;height:number;parkHeight:number;inner?:number;lift?:number;contacts:Map<string,number>;bystanders:string[];unreached:string[]}
const clamp=(t:number)=>Number.isFinite(t)?Math.max(0,Math.min(1,t)):0;
const smooth=(t:number)=>{t=clamp(t);return t*t*(3-2*t);};
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export const SWEEP_PARK_REACH=.46;
/** One traverse, then retract before turning back. Every consumer uses the
 * presentation clock; geometry chooses contact times, never another timer. */
export function sampleTripSweep(plan:TripSweepPlan,t:number):TripSweepPose {
 t=clamp(t);
 if(t===0||t===1)return{yaw:0,reach:SWEEP_PARK_REACH,height:plan.parkHeight};
 const yaw=t<.12?lerp(0,plan.start,smooth(t/.12)):t<.26?plan.start:t<.60?lerp(plan.start,plan.end,smooth((t-.26)/.34)):t<.80?plan.end:lerp(plan.end,0,smooth((t-.80)/.18));
 const deployment=smooth((t-.12)/.08)*(1-smooth((t-.66)/.14)),prepared=smooth(t/.12)*(1-smooth((t-.80)/.18)),lowered=smooth((t-.20)/.06)*(1-smooth((t-.60)/.06)),lift=plan.lift??0;
 return{yaw,reach:lerp(SWEEP_PARK_REACH,plan.reach,deployment),height:lerp(plan.parkHeight,plan.height+lift*(1-lowered),prepared),inner:lerp(.13,plan.inner??.13,deployment),lift:lift*lowered*prepared};
}
/** Exact rendered solids. These bounds are the box mesh, not an inflated
 * avatar envelope. Triangle/box SAT decides contact after broad-phase bounds. */
export function tripSweepBoxes(pose:TripSweepPose,mount:Matrix4,workingOnly=true){
 const basis=mount.clone().multiply(new Matrix4().makeTranslation(0,pose.height,1.6200000047683716)).multiply(new Matrix4().makeRotationY(pose.yaw)),inner=pose.inner??.13,lift=pose.lift??0;
 const boomLength=Math.max(.001,inner-.13),boomCenter=(inner+.13)/2;
 const result=[
  {box:new Box3(new Vector3(inner,-.045,-.045),new Vector3(pose.reach,.045,.045)),matrix:basis},
  {box:new Box3(new Vector3(pose.reach-.10,-.075,-.075),new Vector3(pose.reach+.035,.075,.075)),matrix:basis},
 ];
 if(!workingOnly){
  result.push({box:new Box3(new Vector3(boomCenter-boomLength/2,lift-.045,-.045),new Vector3(boomCenter+boomLength/2,lift+.045,.045)),matrix:basis});
  result.push({box:new Box3(new Vector3(inner-.045,-.045,-.045),new Vector3(inner+.045,lift+.045,.045)),matrix:basis});
  result.push({box:new Box3(new Vector3(-.045,Math.min(.2199999988079071-pose.height,lift)-.01,-.045),new Vector3(.045,Math.max(.2199999988079071-pose.height,lift)+.01,.045)),matrix:basis});
  result.push({box:new Box3(new Vector3(-.10,lift-.05,-.10),new Vector3(.10,lift+.05,.10)),matrix:basis});
 }
 return result;
}
function intersectsQueries(queries:TriangleContactBox[],actor:SweepActor,lower:boolean){
 const bounds=lower?actor.lowerBounds:actor.bounds,triangles=lower?actor.lower:actor.triangles;
 for(let i=0;i<(lower?2:queries.length);i++){const query=queries[i]!;if(!query.bounds.intersectsBox(bounds))continue;if(getTriangleContactIndex(triangles).intersectsPreparedBox(query))return true;}
 return false;
}
export function sweepIntersects(pose:TripSweepPose,mount:Matrix4,actor:SweepActor,lower=true){return intersectsQueries(tripSweepBoxes(pose,mount,lower).map(s=>new TriangleContactBox().set(s.box,s.matrix)),actor,lower);}
/** Once per beat. Snapshot triangles are already in the actual pre-beat world
 * transforms (including crowd, form and mount). Choose a single short angular
 * sector and a low height; neither target order nor character identity is used. */
export function planTripSweep(key:string,anchor:string,mount:Matrix4,parkHeight:number,targets:SweepActor[],bystanders:SweepActor[]):TripSweepPlan|undefined {
 if(!targets.length)return;
 const inverse=mount.clone().invert(),center=targets.reduce((v,a)=>v.add(a.lowerBounds.getCenter(new Vector3())),new Vector3()).multiplyScalar(1/targets.length).applyMatrix4(inverse),aim=Math.atan2(1.6200000047683716-center.z,center.x);
 let lo=Infinity,hi=-Infinity,reach=0,inner=Infinity,minY=Infinity,maxY=-Infinity;
 for(const actor of targets){minY=Math.min(minY,actor.lowerBounds.min.y);maxY=Math.max(maxY,actor.lowerBounds.max.y);for(const triangle of actor.lower)for(const vertex of [triangle.a,triangle.b,triangle.c]){const p=vertex.clone().applyMatrix4(inverse);let angle=Math.atan2(1.6200000047683716-p.z,p.x);while(angle-aim>Math.PI)angle-=2*Math.PI;while(angle-aim< -Math.PI)angle+=2*Math.PI;lo=Math.min(lo,angle);hi=Math.max(hi,angle);const radius=Math.hypot(p.x,p.z-1.6200000047683716);reach=Math.max(reach,radius);inner=Math.min(inner,radius);}}
 // A 9cm rod plus 15cm foam end must clear the authored fixed foot. Its park
 // datum is derived from the tile, not a guessed world-space displacement.
 const rootY=mount.elements[13]!,heightMin=Math.max(parkHeight,minY-rootY+.025),heightMax=Math.max(heightMin,maxY-rootY-.025);
 const centers=targets.map(a=>{const p=a.lowerBounds.getCenter(new Vector3()).applyMatrix4(inverse);let angle=Math.atan2(1.6200000047683716-p.z,p.x);while(angle-aim>Math.PI)angle-=2*Math.PI;while(angle-aim< -Math.PI)angle+=2*Math.PI;return angle;}),centerLo=Math.min(...centers),centerHi=Math.max(...centers);
 const queries=Array.from({length:6},()=>new TriangleContactBox()),workingQueries=Array.from({length:2},()=>new TriangleContactBox());
 let best:TripSweepPlan|undefined,bestScore=Infinity;
 // Try the short direct sweep first. If occupied, switch immediately to a
 // lifted transfer and a short distal sweep; dozens of wider arcs merely repeat
 // the same blocked radial corridor and stall the presentation clock.
 const candidates=[{margin:.12,h:0,lift:0,trim:false},...([.35,.65,1].map(lift=>({margin:.12,h:0,lift,trim:true}))),...([2,4].map(h=>({margin:.12,h,lift:0,trim:false}))),...([.35,.65,1].flatMap(lift=>[2,4].map(h=>({margin:.12,h,lift,trim:true}))))];
 for(const {margin,h,lift,trim} of candidates)for(const reverse of [false,true]){
  const plan:TripSweepPlan={key,anchor,start:reverse?hi+margin:lo-margin,end:reverse?(trim?centerLo:lo-margin):(trim?centerHi:hi+margin),reach:reach+.045,height:lerp(heightMin,heightMax,h/4),parkHeight,inner:lift?Math.max(.13,inner-.09):.13,lift,contacts:new Map(),bystanders:[],unreached:[]};
  const others=new Set<string>();
  for(let i=0;i<=250;i++){
   const t=i/250,pose=sampleTripSweep(plan,t),solids=tripSweepBoxes(pose,mount,false);solids.forEach((s,i)=>{if(i<2)workingQueries[i]!.set(s.box,s.matrix);queries[i]!.set(s.box.clone().expandByScalar(.06),s.matrix);});
   for(const actor of targets)if(!plan.contacts.has(actor.id)&&intersectsQueries(workingQueries,actor,true)){
    let a=Math.max(0,t-.004),b=t;for(let n=0;n<9;n++){const m=(a+b)/2;if(sweepIntersects(sampleTripSweep(plan,m),mount,actor))b=m;else a=m;}plan.contacts.set(actor.id,b);
   }
   for(const actor of bystanders)if(!others.has(actor.id)&&intersectsQueries(queries,actor,false))others.add(actor.id);
   // Six centimetres of additional bystander clearance also keeps ordinary
   // idle movement away from the frozen starting pose; targets still use the
   // exact unexpanded rendered solids. This is not an idle-motion certificate.
   // A known bystander crossing rejects this candidate immediately. Continuing
   // its thousands of triangle tests cannot make this path safe.
   if(others.size)break;
  }
  plan.bystanders=[...others];plan.unreached=targets.filter(a=>!plan.contacts.has(a.id)).map(a=>a.id);
  const score=plan.unreached.length*1e6+others.size*1e3+lift*5+margin+h*.1+(reverse?.01:0);
  if(score<bestScore){bestScore=score;best=plan;}if(!plan.unreached.length&&!others.size)return plan;
 }
 return best;
}
/** Display-only, visible mechanical adapter. Original GLB data stays untouched.
 * The same adapter is installed for idle batches and active instances. A drive
 * shaft connects the authored rotor to the lowered carriage; the single low
 * rod replaces, rather than doubles, the original short outboard working arm. */
export function createTripSweepRig(object:Group,parkHeight=.22,low=false){
 const rotor=object.getObjectByName('TRIP_ROTOR_Z');if(!rotor)throw Error('Missing authored trip rotor');
 const previous=rotor.children.map(n=>({node:n,visible:n.visible}));previous.forEach(({node})=>{node.visible=false;});
 const assembly=new Group();assembly.name='TRIP_SWEEP_ADAPTER';rotor.add(assembly);
 const metal=new MeshStandardMaterial({color:'#d4ddd4',metalness:.55,roughness:.3}),foam=new MeshStandardMaterial({color:'#e9876f',roughness:.72}),teal=new MeshStandardMaterial({color:'#518d81',metalness:.3,roughness:.45});
 const rod=new Mesh(new BoxGeometry(1,.09,.09),metal),tip=new Mesh(new BoxGeometry(.135,.15,.15),foam),shaft=new Mesh(new BoxGeometry(.09,1,.09),metal),hub=new Mesh(new BoxGeometry(.20,.10,.20),teal),boom=new Mesh(new BoxGeometry(1,.09,.09),metal),hanger=new Mesh(new BoxGeometry(.09,1,.09),metal);
 rod.name='TRIP_SWEEP_ROD';tip.name='TRIP_SWEEP_SOFT_TIP';shaft.name='TRIP_SWEEP_DRIVE_SHAFT';hub.name='TRIP_SWEEP_LOW_HUB';boom.name='TRIP_SWEEP_UPPER_BOOM';hanger.name='TRIP_SWEEP_HANGER';assembly.add(rod,tip,shaft,hub,boom,hanger);
 for(const mesh of [rod,tip,shaft,hub,boom,hanger]){mesh.castShadow=mesh.receiveShadow=!low;mesh.raycast=()=>{};}
 const sample=(pose:TripSweepPose)=>{
  rotor.rotation.y=pose.yaw;const y=pose.height-rotor.position.y,inner=pose.inner??.13,lift=pose.lift??0,length=Math.max(.001,pose.reach-inner);
  rod.position.set((pose.reach+inner)/2,y,0);rod.scale.x=length;
  tip.position.set(pose.reach-.0325,y,0);hub.position.set(0,y+lift,0);
  shaft.position.set(0,(y+lift)/2,0);shaft.scale.y=Math.abs(y+lift)+.02;
  boom.position.set((inner+.13)/2,y+lift,0);boom.scale.x=Math.max(.001,inner-.13);
  hanger.position.set(inner,y+lift/2,0);hanger.scale.y=lift+.09;object.updateMatrixWorld(true);
 };
 sample({yaw:0,reach:SWEEP_PARK_REACH,height:parkHeight});
 return{parkHeight,sample,dispose(){rotor.remove(assembly);previous.forEach(({node,visible})=>{node.visible=visible;});for(const mesh of [rod,tip,shaft,hub,boom,hanger])mesh.geometry.dispose();metal.dispose();foam.dispose();teal.dispose();}};
}
