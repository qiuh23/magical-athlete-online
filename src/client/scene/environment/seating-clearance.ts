import { BufferGeometry, Float32BufferAttribute, Matrix4, Vector3 } from 'three';
import type { TrackId } from '../../../shared/tracks.js';

export type SeatingFootingCut = { anchor: string; center: [number, number]; yaw: number; width: number; depth: number };
/** 15 mm construction joints around the unchanged physical/display foundations.
 * Route anchors scale with the map; rigid foot dimensions and mount offsets do
 * not. Values are checked against the actual foundation meshes, not envelopes.
 * These are platform cutouts, never mechanism placements or collision waivers. */
export function seatingFootingCuts(track: TrackId, scale: number): SeatingFootingCut[] {
  const cuts: SeatingFootingCut[] = [];
  const add = (node: number, x: number, z: number, yaw: number, offset: number, width=1.69, depth=.89) => {
    cuts.push({anchor:`${track}:${node}`,center:[x*scale+Math.sin(yaw)*offset,z*scale+Math.cos(yaw)*offset],yaw,width:width+.03,depth:depth+.03});
  };
  if(track==='squiggle'){
    add(21,7.175,-3.3027777777777776,11*Math.PI/16,2.5);
    add(28,14.35,1.6513888888888888,7*Math.PI/16,1.65);
    add(29,14.74861111111111,-.3416666666666666,7*Math.PI/16,2.5);
  }else if(track==='whirly-world')add(12,15.375,-3.075,Math.PI/2,1.65);
  else if(track==='wild'){
    add(13,15.375,-1.025,Math.PI/2,2.5);
    // The older 2.2 m ground tongue remains active during physical takeover.
    add(13,15.375,-1.025,Math.PI/2,.85+1.1,1,2.2);
  }
  return cuts;
}

type Face = Vector3[] & { cap?: boolean };
const EPS=1e-8;
function split(faces:Face[],normal:Vector3,d:number):[Face[],Face[]] {
  const values=faces.flat().map(v=>v.dot(normal)-d);
  if(Math.max(...values)<=EPS)return[faces,[]];
  if(Math.min(...values)>=-EPS)return[[],faces];
  const halves:[Face[],Face[]]=[[],[]],rim=new Map<string,Vector3>();
  for(const face of faces)for(let side=0;side<2;side++){
    const next:Face=[],sign=side===0?1:-1;
    for(let i=0;i<face.length;i++){
      const a=face[i]!,b=face[(i+1)%face.length]!,da=a.dot(normal)-d,db=b.dot(normal)-d;
      if(sign*da<=EPS)next.push(a);
      if((da< -EPS&&db>EPS)||(da>EPS&&db< -EPS)){
        const v=a.clone().lerp(b,da/(da-db));next.push(v);rim.set(v.toArray().map(x=>Math.round(x*1e8)).join(','),v);
      }else if(Math.abs(da)<=EPS)rim.set(a.toArray().map(x=>Math.round(x*1e8)).join(','),a);
    }
    if(next.length>=3){next.cap=face.cap;halves[side]!.push(next);}
  }
  if(rim.size>=3){
    const center=[...rim.values()].reduce((s,v)=>s.add(v),new Vector3()).multiplyScalar(1/rim.size);
    const u=new Vector3(0,1,0),v=normal.clone().cross(u);
    const ordered=[...rim.values()].sort((a,b)=>Math.atan2(a.clone().sub(center).dot(v),a.clone().sub(center).dot(u))-Math.atan2(b.clone().sub(center).dot(v),b.clone().sub(center).dot(u)));
    // Every boundary vertex is retained. Center fans close the cap without
    // T-junctions, including collinear subdivisions from the rounded source.
    (ordered as Face).cap=true;const reverse=[...ordered].reverse() as Face;reverse.cap=true;halves[0].push(ordered);halves[1].push(reverse);
  }
  return halves;
}
function geometryFromFaces(faces:Face[]):BufferGeometry {
  const positions:number[]=[],normals:number[]=[],uv:number[]=[];
  // Reconcile collinear cut-edge subdivisions before center-fan triangulation.
  // Adjacent source triangles/caps may otherwise form a visible closed surface
  // with a topological T-junction that weakens containment checks.
  const vertices=[...new Map(faces.flat().map(v=>[v.toArray().map(x=>Math.round(x*1e7)).join(','),v])).values()];
  for(const raw of faces){
    const face:Face=[];
    for(let i=0;i<raw.length;i++){
      const a=raw[i]!,b=raw[(i+1)%raw.length]!,edge=b.clone().sub(a),length=edge.lengthSq();if(length<1e-18)continue;
      face.push(a);const between=vertices.map(v=>({v,t:v.clone().sub(a).dot(edge)/length})).filter(({v,t})=>t>1e-7&&t<1-1e-7&&a.clone().addScaledVector(edge,t).distanceToSquared(v)<1e-14).sort((a,b)=>a.t-b.t);
      for(const {v}of between)if(face.at(-1)!.distanceToSquared(v)>1e-14)face.push(v);
    }
    if(face.length<3)continue;
    const center=face.reduce((s,v)=>s.add(v),new Vector3()).multiplyScalar(1/face.length);
    for(let i=0;i<face.length;i++){
      const a=face[i]!,b=face[(i+1)%face.length]!,normal=a.clone().sub(center).cross(b.clone().sub(center));
      if(normal.lengthSq()<1e-20)continue;normal.normalize();
      for(const p of [center,a,b]){positions.push(...p.toArray());normals.push(...normal.toArray());uv.push(0,0);}
    }
  }
  const result=new BufferGeometry();result.setAttribute('position',new Float32BufferAttribute(positions,3));result.setAttribute('normal',new Float32BufferAttribute(normals,3));result.setAttribute('uv',new Float32BufferAttribute(uv,2));return result;
}
/** Subtract vertical oriented rectangles from one convex rounded source block.
 * Exact source faces survive clipping; only the actual cut boundary is capped.
 * No square AABB replacement, overlapping internal caps or open cut surfaces. */
export function cutSeatingBlock(source:BufferGeometry,cuts:SeatingFootingCut[]):BufferGeometry {
  source.computeBoundingBox();const box=source.boundingBox!;
  const planes=cuts.flatMap(cut=>{
    const m=new Matrix4().makeRotationY(cut.yaw).setPosition(cut.center[0],0,cut.center[1]);
    const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>new Vector3(x!*cut.width/2,0,z!*cut.depth/2).applyMatrix4(m));
    if(Math.max(...corners.map(p=>p.x))<box.min.x||Math.min(...corners.map(p=>p.x))>box.max.x||Math.max(...corners.map(p=>p.z))<box.min.z||Math.min(...corners.map(p=>p.z))>box.max.z)return[];
    return [corners.map((a,i)=>{const b=corners[(i+1)%4]!,normal=new Vector3(b.z-a.z,0,a.x-b.x).normalize();return{normal,d:a.dot(normal)};})];
  });
  if(!planes.length)return source;
  const p=source.getAttribute('position'),ix=source.index,original:Face[]=[];
  for(let i=0;i<(ix?.count??p.count);i+=3)original.push([0,1,2].map(k=>new Vector3().fromBufferAttribute(p,ix?.getX(i+k)??i+k)));
  // Polygon difference does not need caps. It is valid for the outer surface
  // and for the notches' own walls, including Wild13's overlapping two cutouts.
  const subtract=(faces:Face[],cut:typeof planes[number])=>faces.flatMap(face=>{
    let inside=face;const result:Face[]=[];
    for(const {normal,d}of cut){if(!inside.length)break;const halves:[Face,Face]=[[],[]];
      for(let side=0;side<2;side++){const sign=side===0?1:-1;for(let i=0;i<inside.length;i++){
        const a=inside[i]!,b=inside[(i+1)%inside.length]!,da=a.dot(normal)-d,db=b.dot(normal)-d;
        if(sign*da<=EPS)halves[side]!.push(a);
        if((da< -EPS&&db>EPS)||(da>EPS&&db< -EPS))halves[side]!.push(a.clone().lerp(b,da/(da-db)));
      }}if(halves[1].length>=3)result.push(halves[1]);inside=halves[0];
    }return result;
  });
  let exterior=original;
  for(const cut of planes)exterior=subtract(exterior,cut);
  for(let c=0;c<planes.length;c++){
    let solid=original;for(const {normal,d}of planes[c]!)solid=solid.length?split(solid,normal,d)[0]:[];
    let walls=solid.filter(f=>f.cap).map(f=>[...f].reverse());
    for(let other=0;other<planes.length;other++)if(other!==c)walls=subtract(walls,planes[other]!);
    exterior.push(...walls);
  }
  const result=geometryFromFaces(exterior);source.dispose();return result;
}
