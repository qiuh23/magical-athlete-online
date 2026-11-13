import {Mesh,type Material,type Object3D} from 'three';
/** Own the transitioning pawn's material copies only. Cached/shared materials,
 * destination residents, picking and persistent pawn scale remain untouched. */
export class PawnOpacity {
 private saved=new Map<Mesh,{material:Material|Material[];copies:Material[];castShadow:boolean;renderOrder:number}>();
 apply(root:Object3D,opacity:number){
  root.traverse(node=>{
   if(!(node instanceof Mesh))return;
   let entry=this.saved.get(node),baseline:{castShadow:boolean;renderOrder:number}|undefined;
   if(entry&&!this.owns(node,entry)){baseline={castShadow:node.castShadow===false?entry.castShadow:node.castShadow,renderOrder:node.renderOrder===20?entry.renderOrder:node.renderOrder};entry.copies.forEach(m=>m.dispose());this.saved.delete(node);entry=undefined;}
   if(!entry){const original=Array.isArray(node.material)?node.material:[node.material],copies=original.map(m=>{const copy=m.clone();copy.transparent=true;copy.depthWrite=false;return copy;});entry={material:node.material,copies,castShadow:baseline?.castShadow??node.castShadow,renderOrder:baseline?.renderOrder??node.renderOrder};this.saved.set(node,entry);node.material=Array.isArray(entry.material)?copies:copies[0]!;node.castShadow=false;node.renderOrder=20;}
   const originals=Array.isArray(entry.material)?entry.material:[entry.material];entry.copies.forEach((m,i)=>m.opacity=originals[i]!.opacity*opacity);
  });
 }
 private owns(mesh:Mesh,entry:{material:Material|Material[];copies:Material[]}){return mesh.material===(Array.isArray(entry.material)?entry.copies:entry.copies[0]);}
 restore(){for(const [mesh,entry]of this.saved){if(this.owns(mesh,entry))mesh.material=entry.material;if(mesh.castShadow===false)mesh.castShadow=entry.castShadow;if(mesh.renderOrder===20)mesh.renderOrder=entry.renderOrder;entry.copies.forEach(m=>m.dispose());}this.saved.clear();}
}
export function warpOpacity(t:number){const smooth=(x:number)=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};return t<.5?1-smooth(t/.4):smooth((t-.6)/.4);}
