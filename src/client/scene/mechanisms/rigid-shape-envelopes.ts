import {Box3,Vector3,type BufferGeometry} from 'three';
const cache=new WeakMap<BufferGeometry,readonly Box3[]>();
/** At most sixteen conservative solid envelopes. Each triangle is clipped to the
 * slab planes, including crossing edges, before its bounds enter that slab.
 * Bounding the entire cross-section also encloses its interior, not just skin.
 * Only immutable rigid geometry is cached; morphs keep the original envelope. */
export function rigidShapeEnvelopes(geometry:BufferGeometry):readonly Box3[]{
 const cached=cache.get(geometry);if(cached)return cached;
 geometry.computeBoundingBox();const whole=geometry.boundingBox!.clone(),p=geometry.getAttribute('position'),index=geometry.index,count=index?.count??p.count;
 if(geometry.morphAttributes.position?.length||count%3!==0||![...whole.min.toArray(),...whole.max.toArray()].every(Number.isFinite)){const fallback=[whole];cache.set(geometry,fallback);return fallback;}
 const size=whole.getSize(new Vector3()),axis=size.y>=size.x&&size.y>=size.z?'y':size.x>=size.z?'x':'z',span=size[axis];
 if(!Number.isFinite(span)||span<1e-8){const fallback=[whole];cache.set(geometry,fallback);return fallback;}
 const number=16,width=span/number,boxes=Array.from({length:number},()=>new Box3()),vertices=[new Vector3(),new Vector3(),new Vector3()],point=new Vector3();
 for(let i=0;i<count;i+=3){
  for(let j=0;j<3;j++)vertices[j]!.fromBufferAttribute(p,index?index.getX(i+j):i+j);
  const lo=Math.min(...vertices.map(v=>v[axis])),hi=Math.max(...vertices.map(v=>v[axis]));
  const first=Math.max(0,Math.min(number-1,Math.floor((lo-whole.min[axis])/width))),last=Math.max(0,Math.min(number-1,Math.floor((hi-whole.min[axis])/width)));
  for(let slab=first;slab<=last;slab++){
   const lower=whole.min[axis]+slab*width,upper=slab===number-1?whole.max[axis]:lower+width,box=boxes[slab]!;
   for(const v of vertices)if(v[axis]>=lower&&v[axis]<=upper)box.expandByPoint(v);
   for(let j=0;j<3;j++){const a=vertices[j]!,b=vertices[(j+1)%3]!,delta=b[axis]-a[axis];if(Math.abs(delta)<1e-20)continue;
    for(const plane of [lower,upper]){const t=(plane-a[axis])/delta;if(t>=0&&t<=1)box.expandByPoint(point.copy(a).lerp(b,t));}
   }
  }
 }
 const result=boxes.filter(b=>!b.isEmpty());cache.set(geometry,result.length?result:[whole]);return cache.get(geometry)!;
}
