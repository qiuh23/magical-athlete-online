import {Box3,Mesh,Ray,SkinnedMesh,Vector3,type Object3D} from 'three';

/** Geometry-only feedback targeting. No character IDs, role allowlist, rule
 * mutation or permission to physically strike a pawn is encoded here. */
export class MechanismActorBounds {
 private bodies=new Map<string,Object3D>();
 bind(id:string,body:Object3D){this.bodies.set(id,body);return()=>{if(this.bodies.get(id)===body)this.bodies.delete(id);};}
 bounds(id:string){
  const body=this.bodies.get(id);if(!body)return;
  body.updateWorldMatrix(true,true);const box=new Box3();
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
