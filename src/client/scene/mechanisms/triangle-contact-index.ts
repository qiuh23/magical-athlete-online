import {Box3,Matrix4,Triangle} from 'three';

interface ContactNode {
 minX:number;minY:number;minZ:number;maxX:number;maxY:number;maxZ:number;
 start:number;end:number;left:number;right:number;
}

/** Prepare a rendered solid once per pose, then reuse it across every actor's
 * index. Call set again after changing its pose. All storage is reused, and the
 * inverse is computed lazily only if some index reaches an exact SAT test. */
export class TriangleContactBox {
 readonly box=new Box3();
 readonly bounds=new Box3();
 private readonly matrix=new Matrix4();
 private readonly inverse=new Matrix4();
 private inverted=false;

 set(box:Box3,matrix:Matrix4){
  this.box.copy(box);this.matrix.copy(matrix);this.inverted=false;
  const world=this.bounds.copy(box).applyMatrix4(matrix);
  if(!box.isEmpty()){
   // Broad-phase rounding must never turn a tangent SAT contact into a miss.
   const padding=32*Number.EPSILON*Math.max(1,Math.abs(world.min.x),Math.abs(world.min.y),Math.abs(world.min.z),Math.abs(world.max.x),Math.abs(world.max.y),Math.abs(world.max.z));
   world.expandByScalar(padding);
  }
  return this;
 }

 get inverseMatrix(){if(!this.inverted){this.inverse.copy(this.matrix).invert();this.inverted=true;}return this.inverse;}
}

/** A snapshot-local BVH over the actual world-space sculpture triangles.
 * Bounds only reject impossible candidates; a positive answer always comes
 * from Three's exact triangle/box SAT in the rendered box's local frame.
 * Keep the source triangles immutable for this index's lifetime. Box matrices
 * must be invertible affine transforms (rotation, scale and shear are allowed).
 */
export class TriangleContactIndex {
 private readonly order:Uint32Array;
 private readonly bounds:Float64Array;
 private readonly nodes:ContactNode[]=[];
 private readonly stack:Int32Array;
 private readonly query=new TriangleContactBox();
 private readonly triangle=new Triangle();

 constructor(private readonly triangles:readonly Triangle[]){
  const count=triangles.length;
  this.order=new Uint32Array(count);this.bounds=new Float64Array(count*6);
  // A balanced median split has at most ceil(log2(count)) pending siblings.
  this.stack=new Int32Array(2+Math.ceil(Math.log2(Math.max(1,count))));
  for(let i=0;i<count;i++){
   const {a,b,c}=triangles[i]!,offset=i*6;this.order[i]=i;
   this.bounds[offset]=Math.min(a.x,b.x,c.x);this.bounds[offset+1]=Math.min(a.y,b.y,c.y);this.bounds[offset+2]=Math.min(a.z,b.z,c.z);
   this.bounds[offset+3]=Math.max(a.x,b.x,c.x);this.bounds[offset+4]=Math.max(a.y,b.y,c.y);this.bounds[offset+5]=Math.max(a.z,b.z,c.z);
  }
  if(count)this.build(0,count);
 }

 private center(index:number,axis:number){const offset=index*6+axis;return this.bounds[offset]!+this.bounds[offset+3]!;}

 /** In-place median partition without sorting or moving the source triangles. */
 private partition(start:number,end:number,middle:number,axis:number){
  let lo=start,hi=end-1;
  while(lo<hi){
   const pivot=this.center(this.order[(lo+hi)>>>1]!,axis);let left=lo,right=hi;
   while(left<=right){
    while(this.center(this.order[left]!,axis)<pivot)left++;
    while(this.center(this.order[right]!,axis)>pivot)right--;
    if(left<=right){const id=this.order[left]!;this.order[left++]=this.order[right]!;this.order[right--]=id;}
   }
   if(middle<=right)hi=right;else if(middle>=left)lo=left;else return;
  }
 }

 private build(start:number,end:number):number{
  let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  let centerMinX=Infinity,centerMinY=Infinity,centerMinZ=Infinity,centerMaxX=-Infinity,centerMaxY=-Infinity,centerMaxZ=-Infinity;
  for(let i=start;i<end;i++){
   const offset=this.order[i]!*6,b=this.bounds;
   minX=Math.min(minX,b[offset]!);minY=Math.min(minY,b[offset+1]!);minZ=Math.min(minZ,b[offset+2]!);
   maxX=Math.max(maxX,b[offset+3]!);maxY=Math.max(maxY,b[offset+4]!);maxZ=Math.max(maxZ,b[offset+5]!);
   const x=b[offset]!+b[offset+3]!,y=b[offset+1]!+b[offset+4]!,z=b[offset+2]!+b[offset+5]!;
   centerMinX=Math.min(centerMinX,x);centerMinY=Math.min(centerMinY,y);centerMinZ=Math.min(centerMinZ,z);
   centerMaxX=Math.max(centerMaxX,x);centerMaxY=Math.max(centerMaxY,y);centerMaxZ=Math.max(centerMaxZ,z);
  }
  const node:ContactNode={minX,minY,minZ,maxX,maxY,maxZ,start,end,left:-1,right:-1},id=this.nodes.length;this.nodes.push(node);
  if(end-start>8){
   const x=centerMaxX-centerMinX,y=centerMaxY-centerMinY,z=centerMaxZ-centerMinZ,axis=y>x?(z>y?2:1):(z>x?2:0),middle=(start+end)>>>1;
   this.partition(start,end,middle,axis);node.left=this.build(start,middle);node.right=this.build(middle,end);
  }
  return id;
 }

 /** No query-time allocations or full-triangle walk. The scratch vectors and
  * traversal stack belong to this index, and are reused between synchronous queries. */
 intersectsBox(box:Box3,matrix:Matrix4):boolean{
  return this.intersectsPreparedBox(this.query.set(box,matrix));
 }

 intersectsPreparedBox(query:TriangleContactBox):boolean{
  const {box,bounds:world}=query;if(!this.nodes.length||box.isEmpty())return false;
  const minX=world.min.x,minY=world.min.y,minZ=world.min.z,maxX=world.max.x,maxY=world.max.y,maxZ=world.max.z;
  let size=1,inverse:Matrix4|undefined;this.stack[0]=0;
  while(size){
   const node=this.nodes[this.stack[--size]!]!;
   if(maxX<node.minX||minX>node.maxX||maxY<node.minY||minY>node.maxY||maxZ<node.minZ||minZ>node.maxZ)continue;
   if(node.left>=0){this.stack[size++]=node.left;this.stack[size++]=node.right;continue;}
   for(let i=node.start;i<node.end;i++){
    const id=this.order[i]!,offset=id*6,b=this.bounds;
    if(maxX<b[offset]!||minX>b[offset+3]!||maxY<b[offset+1]!||minY>b[offset+4]!||maxZ<b[offset+2]!||minZ>b[offset+5]!)continue;
    if(!inverse)inverse=query.inverseMatrix;
    const source=this.triangles[id]!,triangle=this.triangle;
    triangle.a.copy(source.a).applyMatrix4(inverse);triangle.b.copy(source.b).applyMatrix4(inverse);triangle.c.copy(source.c).applyMatrix4(inverse);
    if(box.intersectsTriangle(triangle))return true;
   }
  }
  return false;
 }
}

export function createTriangleContactIndex(triangles:readonly Triangle[]){return new TriangleContactIndex(triangles);}

const snapshotIndexes=new WeakMap<readonly Triangle[],TriangleContactIndex>();
/** A frozen capture owns its array identity. New captures get new indexes;
 * discarded snapshots and their indexes are garbage-collected together. */
export function getTriangleContactIndex(triangles:readonly Triangle[]){
 let index=snapshotIndexes.get(triangles);if(!index){index=createTriangleContactIndex(triangles);snapshotIndexes.set(triangles,index);}return index;
}
