import {Box3,Matrix4,Vector3} from 'three';
const basis=[new Vector3(1,0,0),new Vector3(0,1,0),new Vector3(0,0,1)];
const corners=(box:Box3)=>[box.min.x,box.max.x].flatMap(x=>[box.min.y,box.max.y].flatMap(y=>[box.min.z,box.max.z].map(z=>new Vector3(x,y,z))));
/** A bounded narrow phase, not an alternate trajectory. Enclose the two endpoint
 * boxes in the current part frame, then include the analytic world-space bow.
 * The transformed box may be a parallelepiped; no orthogonal-axis assumption. */
export function orientedSweep(local:Box3,current:Matrix4,previous:Matrix4|undefined,bow:number){
 const valid=(m:Matrix4)=>m.elements.every(Number.isFinite)&&Math.abs(m.determinant())>=1e-12&&[3,7,11].every(i=>m.elements[i]===0)&&m.elements[15]===1;
 if(!valid(current)||previous&&!valid(previous)||!Number.isFinite(bow)||bow<0||local.isEmpty()||![...local.min.toArray(),...local.max.toArray()].every(Number.isFinite))return;
 const inverse=current.clone().invert(),envelope=local.clone();
 if(previous){const relative=inverse.clone().multiply(previous);for(const p of corners(local))envelope.expandByPoint(p.applyMatrix4(relative));}
 const e=inverse.elements;envelope.expandByVector(new Vector3(Math.hypot(e[0]!,e[4]!,e[8]!),Math.hypot(e[1]!,e[5]!,e[9]!),Math.hypot(e[2]!,e[6]!,e[10]!)).multiplyScalar(bow));
 const points=corners(envelope).map(p=>p.applyMatrix4(current)),m=current.elements,edges=[0,4,8].map(i=>new Vector3(m[i],m[i+1],m[i+2]));
 const axes=[...basis,edges[1]!.clone().cross(edges[2]!),edges[2]!.clone().cross(edges[0]!),edges[0]!.clone().cross(edges[1]!),...edges.flatMap(e=>basis.map(b=>e.clone().cross(b)))].filter(a=>a.lengthSq()>1e-20).map(a=>a.clone().normalize());
 const projections=axes.map(axis=>{const p=points.map(v=>v.dot(axis));return{axis,min:Math.min(...p),max:Math.max(...p)};});
 return{points,projections};
}
/** A separating projection gap is a lower bound on true Euclidean distance.
 * Requiring >=margin on a unit axis preserves the complete safety margin;
 * absence of an axis is inconclusive, never treated as an actual collision. */
export function orientedSeparation(sweep:NonNullable<ReturnType<typeof orientedSweep>>,box:Box3){
 if(box.isEmpty()||![...box.min.toArray(),...box.max.toArray()].every(Number.isFinite))return 0;
 const center=box.getCenter(new Vector3()),half=box.getSize(new Vector3()).multiplyScalar(.5);let gap=0;
 for(const {axis,min,max}of sweep.projections){const c=center.dot(axis),r=Math.abs(axis.x)*half.x+Math.abs(axis.y)*half.y+Math.abs(axis.z)*half.z;gap=Math.max(gap,min-c-r,c-r-max);}
 return gap;
}
