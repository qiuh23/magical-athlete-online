import {Box3,Matrix4,Mesh,type Object3D}from'three';
/** Wild5's authored foot overlaps the existing decorative paving by35mm.
 * Trim ONLY its fixed thickness from below, keeping its top and all working
 * joints exactly fixed. The paving's .235m top becomes the support datum.
 * Input is a per-instance clone. Cached/frozen GLB geometry is never modified. */
export function fitWild5TripFoot(object:Object3D){
 object.updateWorldMatrix(true,true);const foot=object.getObjectByName('TRIP_FIXED_FOOT');if(!(foot instanceof Mesh))throw Error('Missing fixed trip foot');
 const source=foot.geometry,relative=new Matrix4().copy(object.matrixWorld).invert().multiply(foot.matrixWorld);source.computeBoundingBox();const box=source.boundingBox!.clone().applyMatrix4(relative),top=box.max.y,bottom=-1.415;
 if(bottom<=box.min.y||bottom>=top)throw Error('Unexpected fixed foot dimensions');
 const ratio=(top-bottom)/(top-box.min.y),trim=new Matrix4().makeTranslation(0,top,0).multiply(new Matrix4().makeScale(1,ratio,1)).multiply(new Matrix4().makeTranslation(0,-top,0));
 const local=relative.clone().invert().multiply(trim).multiply(relative),geometry=source.clone().applyMatrix4(local);foot.geometry=geometry;geometry.computeBoundingBox();
 return{bottom,top,ratio,restore(){if(foot.geometry===geometry)foot.geometry=source;geometry.dispose();}};
}

/** The one column meets the top of the fixed Trip foot instead of passing through it. */
export function deckSupportBottom(track:string,node:number,x:number,z:number){return track==='squiggle'&&node===17&&x===1&&z===1?.40:.18;}
