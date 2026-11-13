import {Box3,Matrix4,Mesh,Ray,SkinnedMesh,Triangle,Vector3,type Object3D} from 'three';

import type {SweepActor,TripSweepPlan} from '../environment/trip-sweep.js';

/** Visible geometry snapshots and local feedback plans. Authoritative events
 * alone select targets; there is no character allowlist or rule mutation. */
export class MechanismActorBounds {
 private sweeps=new Map<string,TripSweepPlan>();
 setTripSweep(plan:TripSweepPlan){if(!plan.bystanders.length&&!plan.unreached.length)this.sweeps.set(plan.anchor,plan);}
 clearTripSweep(anchor:string,plan?:TripSweepPlan){if(!plan||this.sweeps.get(anchor)===plan)this.sweeps.delete(anchor);}
 tripHit(key:string,id:string){for(const plan of this.sweeps.values())if(plan.key===key&&plan.contacts.has(id))return plan.contacts.get(id);}
 tripPlans(key:string){return [...this.sweeps.values()].filter(p=>p.key===key);}
 /** Real evaluated sculpture triangles, with the current fall/root pose stripped
  * and replaced by the frozen pre-beat transform supplied by the caller. */
 capture(id:string,world:Matrix4):SweepActor|undefined{
  const body=this.bodies.get(id);if(!body)return;body.updateWorldMatrix(true,false);body.updateMatrixWorld(true);
  // SkinnedMesh overrides updateMatrixWorld (not updateWorldMatrix) to refresh
  // bindMatrixInverse. Skipping it on the first frame stretches skinned vertices
  // by the Pawn's world transform and produces fictitious multi-metre blockers.
  const inverse=body.matrixWorld.clone().invert(),triangles:Triangle[]=[],sculptureTriangles:Triangle[]=[],bounds=new Box3(),sculptureBounds=new Box3();let pending=false,sculptures=0;
  body.traverse(n=>{if(n.userData.sculptureState){sculptures++;if(n.userData.sculptureState!=='ready')pending=true;}});
  if(!sculptures||pending)return;
  body.traverse(node=>{
   if(!(node instanceof Mesh))return;let sculpture=false;
   for(let n:Object3D|null=node;n&&n!==body;n=n.parent){if(!n.visible)return;if(n.userData.sculptureState==='ready')sculpture=true;}
   const transform=world.clone().multiply(inverse).multiply(node.matrixWorld),p=node.geometry.getAttribute('position'),index=node.geometry.index;
   for(let i=0;i<(index?.count??p.count);i+=3){const points=[0,1,2].map(j=>node.getVertexPosition(index?.getX(i+j)??i+j,new Vector3()).applyMatrix4(transform));const triangle=new Triangle(points[0]!,points[1]!,points[2]!);if(triangle.getArea()<1e-12)continue;triangles.push(triangle);points.forEach(v=>bounds.expandByPoint(v));if(sculpture){sculptureTriangles.push(triangle);points.forEach(v=>sculptureBounds.expandByPoint(v));}}
  });
  if(bounds.isEmpty()||sculptureBounds.isEmpty())return;
  const ceiling=sculptureBounds.min.y+Math.min(.42,(sculptureBounds.max.y-sculptureBounds.min.y)*.35),lower:Triangle[]=[],lowerBounds=new Box3();
  for(const triangle of sculptureTriangles){
   const polygon=[triangle.a,triangle.b,triangle.c],clipped:Vector3[]=[];
   for(let i=0;i<3;i++){const a=polygon[i]!,b=polygon[(i+1)%3]!,inside=a.y<=ceiling,next=b.y<=ceiling;if(inside)clipped.push(a.clone());if(inside!==next)clipped.push(a.clone().lerp(b,(ceiling-a.y)/(b.y-a.y)));}
   for(let i=1;i<clipped.length-1;i++){const t=new Triangle(clipped[0]!,clipped[i]!,clipped[i+1]!);lower.push(t);[t.a,t.b,t.c].forEach(v=>lowerBounds.expandByPoint(v));}
  }
  return{id,triangles,lower,bounds,lowerBounds};
 }
 private bodies=new Map<string,Object3D>();
 bind(id:string,body:Object3D){this.bodies.set(id,body);return()=>{if(this.bodies.get(id)===body)this.bodies.delete(id);};}
 bounds(id:string){
  const body=this.bodies.get(id);if(!body)return;
  body.updateWorldMatrix(true,false);body.updateMatrixWorld(true);
  // SkinnedMesh overrides updateMatrixWorld (not updateWorldMatrix) to refresh
  // bindMatrixInverse. Skipping it on the first frame stretches skinned vertices
  // by the Pawn's world transform and produces fictitious multi-metre blockers.
  const box=new Box3();
  body.traverse(node=>{
   if(!(node instanceof Mesh))return;
   for(let parent:Object3D|null=node;parent;parent=parent.parent)if(!parent.visible)return;
   // Rigid bounds are cached. A skinned character must instead measure its
   // evaluated bones: geometry.boundingBox alone is the bind-pose envelope.
   // This is requested only for active feedback targets, never all actors.
   if(node instanceof SkinnedMesh){node.computeBoundingBox();if(node.boundingBox)box.union(node.boundingBox.clone().applyMatrix4(node.matrixWorld));}
   else{if(!node.geometry.boundingBox)node.geometry.computeBoundingBox();if(node.geometry.boundingBox)box.union(node.geometry.boundingBox.clone().applyMatrix4(node.matrixWorld));}
  });
  return box.isEmpty()?undefined:box;
 }
 surface(id:string,origin:Vector3,fallback:Vector3){
  const box=this.bounds(id);if(!box)return fallback.clone();
  const center=box.getCenter(new Vector3()),direction=center.clone().sub(origin);
  if(direction.lengthSq()<1e-10)return center;
  return new Ray(origin,direction.normalize()).intersectBox(box,new Vector3())??center;
 }
}
