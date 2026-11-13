/** Finite, exact triangle audit helpers. Bounds exclude pairs only; surface and
 * component containment checks decide overlapping bounds. No pair-wide bypass. */
import {createRequire} from 'node:module';
import {Box3,BufferAttribute,BufferGeometry,DoubleSide,InstancedMesh,Line3,Matrix4,Mesh,Object3D,Ray,Vector3,Triangle} from 'three';
const require=createRequire(import.meta.url),dreiRequire=createRequire(require.resolve('@react-three/drei/package.json'));
const {MeshBVH}=await import(dreiRequire.resolve('three-mesh-bvh'));
const cache=new WeakMap<BufferGeometry,ReturnType<typeof prepare>>();
function prepare(geometry:BufferGeometry){
 const p=geometry.getAttribute('position'),ix=geometry.index,ids=Array.from({length:p.count},(_,i)=>i),weld=new Map<string,number>();
 const find=(i:number):number=>{while(ids[i]!==i){ids[i]=ids[ids[i]!]!;i=ids[i]!;}return i;};
 const join=(a:number,b:number)=>{ids[find(a)]=find(b);};
 const w=Array.from({length:p.count},(_,i)=>{const k=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(',');const a=weld.get(k);if(a===undefined){weld.set(k,i);return i;}join(a,i);return a;});
 const faces:number[][]=[];for(let i=0;i<(ix?.count??p.count);i+=3){const f=[0,1,2].map(j=>ix?.getX(i+j)??i+j);const tri=new Triangle(...f.map(j=>new Vector3().fromBufferAttribute(p,j)) as [Vector3,Vector3,Vector3]);if(tri.getArea()<1e-12)continue;faces.push(f);join(f[0]!,f[1]!);join(f[0]!,f[2]!);}
 const groups=new Map<number,number[][]>();for(const f of faces){const key=find(f[0]!);if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(f);}
 const components=[...groups.values()].map(faces=>{const edges=new Map<string,number>();for(const f of faces)for(let i=0;i<3;i++){const a=w[f[i]!]!,b=w[f[(i+1)%3]!]!;if(a===b)continue;const key=a<b?`${a}:${b}`:`${b}:${a}`;edges.set(key,(edges.get(key)??0)+1);}const g=new BufferGeometry();g.setAttribute('position',p);g.setIndex(faces.flat());g.computeBoundingBox();const closed=edges.size>0&&[...edges.values()].every(n=>n===2);return{point:new Vector3().fromBufferAttribute(p,faces[0]![0]!),box:g.boundingBox!,closed,tree:closed?new MeshBVH(g):undefined};});
 const local=geometry.clone();local.clearGroups();local.setIndex(faces.flat());const tree=new MeshBVH(local);geometry.computeBoundingBox();return {geometry:local,tree,components,box:geometry.boundingBox!};
}
export type Collider={name:string;matrix:Matrix4;inverse:Matrix4;box:Box3;data:ReturnType<typeof prepare>};
export function collider(name:string,geometry:BufferGeometry,matrix:Matrix4):Collider{let data=cache.get(geometry);if(!data){data=prepare(geometry);cache.set(geometry,data);}return{name,matrix:matrix.clone(),inverse:matrix.clone().invert(),box:data.box.clone().applyMatrix4(matrix),data};}
export function collect(root:Object3D,prefix='',parent=new Matrix4()):Collider[]{root.updateMatrixWorld(true);const out:Collider[]=[];root.traverse(n=>{if(!(n instanceof Mesh))return;let geometry=n.geometry;if(n.morphTargetInfluences?.some(v=>v!==0)){geometry=n.geometry.clone();const p=geometry.getAttribute('position'),array=new Float32Array(p.count*3),v=new Vector3();for(let i=0;i<p.count;i++){n.getVertexPosition(i,v);v.toArray(array,i*3);}geometry.setAttribute('position',new BufferAttribute(array,3));}const m=parent.clone().multiply(n.matrixWorld);if(n instanceof InstancedMesh){for(let i=0;i<n.count;i++){const local=new Matrix4();n.getMatrixAt(i,local);const matrix=m.clone().multiply(local);if(Math.abs(matrix.determinant())<1e-12)continue;out.push(collider(`${prefix}${n.name}:${i}`,geometry,matrix));}}else out.push(collider(`${prefix}${n.name||'part'+out.length}`,geometry,m));});return out;}
const rays=[new Vector3(1,.173,.319).normalize(),new Vector3(.217,1,.413).normalize(),new Vector3(.337,.239,1).normalize()];
function inside(point:Vector3,component:ReturnType<typeof prepare>['components'][number]){if(!component.closed||!component.box.containsPoint(point))return false;const votes=rays.map(direction=>{const hits=component.tree.raycast(new Ray(point,direction),DoubleSide,0,Infinity).map((h:{distance:number})=>h.distance).sort((a:number,b:number)=>a-b);if(hits[0]<1e-6)return false;return hits.filter((d:number,i:number)=>i===0||d-hits[i-1]>1e-6).length%2===1;});return votes.every(Boolean)?true:votes.some(Boolean)?'uncertain':false;}
export function collision(a:Collider,b:Collider){if(!a.box.intersectsBox(b.box))return;const rel=a.inverse.clone().multiply(b.matrix),bounds=new Box3(),edge=new Line3();let crossings=0;
 a.data.tree.bvhcast(b.data.tree,rel,{intersectsTriangles:(x:any,y:any)=>{if(x.intersectsTriangle(y,edge)){crossings++;bounds.expandByPoint(edge.start.clone().applyMatrix4(a.matrix));bounds.expandByPoint(edge.end.clone().applyMatrix4(a.matrix));}return false;}});
 if(crossings)return {kind:'surface' as const,crossings,bounds:[bounds.min.toArray(),bounds.max.toArray()],aBounds:[a.box.min.toArray(),a.box.max.toArray()],bBounds:[b.box.min.toArray(),b.box.max.toArray()]};
 for(const [from,to] of [[a,b],[b,a]])for(const c of from!.data.components){const p=c.point.clone().applyMatrix4(from!.matrix).applyMatrix4(to!.inverse);for(const target of to!.data.components){const status=inside(p,target);if(status){const world=p.applyMatrix4(to!.matrix).toArray();return{kind:status==='uncertain'?'uncertain' as const:'containment' as const,crossings:0,bounds:[world,world]};}}}
}

export function surfaceHeight(c:Collider,x:number,z:number,ceiling:number){const origin=new Vector3(x,ceiling,z).applyMatrix4(c.inverse),direction=new Vector3(0,-1,0).transformDirection(c.inverse),hits=c.data.tree.raycast(new Ray(origin,direction),DoubleSide,0,Infinity);return hits.map((h:{point:Vector3})=>h.point.clone().applyMatrix4(c.matrix).y).filter((y:number)=>y<=ceiling+1e-6).sort((a:number,b:number)=>b-a)[0];}

/** A conservative soft-separation upper bound: translating one complete mesh
 * by this projection interval overlap separates both meshes along a real face
 * normal. Extra axes can tighten the bound, never make a penetrating pair pass
 * by ignoring geometry. This is not an AABB collision decision. */
export function softSeparationBound(a:Collider,b:Collider){
 const points=(c:Collider)=>{const p=c.data.geometry.getAttribute('position');return Array.from({length:p.count},(_,i)=>new Vector3().fromBufferAttribute(p,i).applyMatrix4(c.matrix));};
 const av=points(a),bv=points(b),axes:Vector3[]=[],keys=new Set<string>();
 for(const[c,v]of [[a,av],[b,bv]] as const){const index=c.data.geometry.index!;for(let i=0;i<index.count;i+=3){const normal=new Vector3().subVectors(v[index.getX(i+1)]!,v[index.getX(i)]!).cross(new Vector3().subVectors(v[index.getX(i+2)]!,v[index.getX(i)]!));if(normal.lengthSq()<1e-20)continue;normal.normalize();const key=normal.toArray().map(n=>Math.round(n*1e7)).join(',');if(!keys.has(key)){keys.add(key);axes.push(normal);}}}
 let bound=Infinity;for(const axis of axes){let amin=Infinity,amax=-Infinity,bmin=Infinity,bmax=-Infinity;for(const p of av){const d=p.dot(axis);amin=Math.min(amin,d);amax=Math.max(amax,d);}for(const p of bv){const d=p.dot(axis);bmin=Math.min(bmin,d);bmax=Math.max(bmax,d);}bound=Math.min(bound,Math.max(0,Math.min(amax-bmin,bmax-amin)));}return bound;
}
