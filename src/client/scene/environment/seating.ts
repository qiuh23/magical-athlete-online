import { Box3, BufferGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { TrackId } from '../../../shared/tracks.js';
import { type EnvironmentOptions } from './layout.js';
import type { EnvironmentModels } from './runtime.js';
import { cutSeatingBlock, seatingFootingCuts } from './seating-clearance.js';

export const SEATING_REVISION = 'segmented-venue-seating-v1';
export type SeatingBay = { id: string; x: number; z: number; yaw: number; floor: number; infield?: boolean };
export type SeatingPlan = { bays: SeatingBay[]; promenades: { a: [number,number]; b: [number,number]; width: number }[]; ground: number };
/** The open side is deliberate: start/finish access and both fixed gameplay views
 * need an uninterrupted foreground. Route and rule identities never change. */
export function stadiumSeatingPlan(track: TrackId, options: EnvironmentOptions): SeatingPlan {
  const scale = options.scale, ground = .15, floor = options.lift ? 1.384 : .234;
  let seats: [number,number,number][];
  if (track === 'squiggle') seats = [[-9.65,-6.2,.03],[-.88,-6.0,0],[7.9,-6.2,-.08],[18.5,2.7,-Math.PI/2]];
  else if (track === 'boardwalks') seats = [[-10.3,-6.2,0],[-6.6,-6.2,0],[.0,-4.3,0],[6.8,-6.2,0],[12.0,-6.2,0],[18.4,2.1,-Math.PI/2]];
  else if (track === 'bridges') seats = [[-15.55,-9.1,.04],[-1.35,-9.6,0],[12.84,-9.0,-.06],[27.0,-.1,-Math.PI/2]];
  else seats = [[-5.35,-6.25,0],[1.15,-6.25,0],[7.65,-6.25,0],[13.85,-6.15,-.30],[track==='wild'?19.4:track==='whirly-world'?19.05:18.25,-.15,-Math.PI/2]];
  const natural = ['squiggle','boardwalks','bridges'].includes(track);
  // Bay dimensions stay in metres. Only anchor spacing follows the route's
  // presentation expansion, matching rigid trees and existing venue facilities.
  const bays: SeatingBay[] = seats.map(([x,z,yaw],i)=>({id:`${track}:stand:${i}`,x:x*scale,z:z*scale,yaw,floor}));
  const turnX = bays.at(-1)!.x;
  if(track==='mild')bays.push({id:'mild:infield:0',x:2.0,z:0,yaw:0,floor:.234,infield:true} as SeatingBay);
  const promenades: SeatingPlan['promenades'] = natural ? [] : [
    {a:[-17*scale,-6.6*scale],b:[14.6*scale,-6.6*scale],width:3.3},
    {a:[14.6*scale,-6.6*scale],b:[turnX,-3.7*scale],width:3.3},
    {a:[turnX,-3.7*scale],b:[turnX,3.15*scale],width:3.3},
  ];
  return { bays, promenades, ground };
}

const paints = { stone:'#526b64', cream:'#e7ddc4', wood:'#ba946f', ink:'#285e55', gold:'#d9b15e' };
type Paint = keyof typeof paints;
/** Existing detailed seat and crowd meshes are shared in GPU instance batches.
 * New joinery is one merged buffer per material. Full content is identical on
 * phones and desktops, including the explicitly selected economy setting. */
export function buildStadiumSeating(track: TrackId, models: EnvironmentModels, options: EnvironmentOptions) {
  const root = new Group(); root.name = `segmented-stadium-seating:${track}`;
  const plan = stadiumSeatingPlan(track, options), owned: BufferGeometry[] = [], materials: MeshStandardMaterial[] = [], instances: InstancedMesh[] = [];
  const cuts=options.lift>0?seatingFootingCuts(track,options.scale):[];
  const unit = new RoundedBoxGeometry(1,1,1,2,.04), buckets = new Map<Paint,BufferGeometry[]>();
  const mark = <T extends Mesh>(mesh:T, role:string) => { mesh.raycast=()=>{}; mesh.castShadow=!options.lowQuality; mesh.receiveShadow=true; mesh.userData.environmentRole=role; return mesh; };
  const place = (x:number,y:number,z:number,yaw=0) => new Matrix4().compose(new Vector3(x,y,z),new Quaternion().setFromAxisAngle(new Vector3(0,1,0),yaw),new Vector3(1,1,1));
  const block = (paint:Paint,position:number[],size:number[],matrix?:Matrix4) => {
    let geometry:BufferGeometry=unit.clone().scale(size[0]!,size[1]!,size[2]!).translate(position[0]!,position[1]!,position[2]!);if(matrix)geometry.applyMatrix4(matrix);
    // Only the low walking surface and bronze nosing need clearance. Lower
    // structural layers, high steps, rails, seats and mechanisms are unchanged.
    if((paint==='cream'||paint==='gold')&&position[1]!+size[1]!/2<=.201&&cuts.length)geometry=cutSeatingBlock(geometry,cuts);
    (buckets.get(paint)??buckets.set(paint,[]).get(paint)!).push(geometry);
  };
  const batch = (asset:string,matrices:Matrix4[]) => {
    const source=models[asset]; if(!source)throw Error(`Missing seating asset ${asset}`); source.updateMatrixWorld(true);
    source.traverse(node=>{if(!(node instanceof Mesh))return;const mesh=mark(new InstancedMesh(node.geometry,node.material,matrices.length),'seating');mesh.name=`seating:${asset}:${node.name}`;
      matrices.forEach((m,i)=>mesh.setMatrixAt(i,new Matrix4().multiplyMatrices(m,node.matrixWorld)));mesh.computeBoundingBox();mesh.computeBoundingSphere();root.add(mesh);instances.push(mesh);});
  };
  // Layered outer decks meet the existing stadium sidewall, rather than floating
  // new stands over empty space. At each opening, flush paving is still walkable.
  const deck=(matrix:Matrix4,width:number,depth:number)=>{
    const bottom=plan.promenades.length ? options.lift ? -.84 : -.92 : -.56;
    block('wood',[0,(bottom-.30)/2,0],[width,-.30-bottom,depth],matrix);
    block('stone',[0,-.25,0],[width+.02,.10,depth+.02],matrix);
    block('cream',[0,-.025,0],[width,.35,depth],matrix);
  };
  for(const walk of plan.promenades){const dx=walk.b[0]-walk.a[0],dz=walk.b[1]-walk.a[1];deck(place((walk.a[0]+walk.b[0])/2,0,(walk.a[1]+walk.b[1])/2,-Math.atan2(dz,dx)),Math.hypot(dx,dz)+.08,walk.width);}
  for(const bay of plan.bays){
    const matrix=place(bay.x,0,bay.z,bay.yaw), high=bay.floor>.5;
    if(bay.infield){
      block('cream',[0,.154,0],[5.88,.008,1.72],matrix);
      block('stone',[0,.194,0],[5.65,.08,1.55],matrix);
      // Lower, open-sided bank: existing detailed seats/crowd are unchanged.
      // No perimeter railing behind it that could intrude on the upper track.
      for(const x of [-2.93,2.93])block('cream',[x,.19,.36],[.30,.08,.62],matrix);
      continue;
    }
    if(!plan.promenades.length){
      deck(matrix.clone().multiply(new Matrix4().makeTranslation(0,0,.35)),6.65,4.2);
      // A real 1.2m access tongue joins the end terrace to the island. Mere
      // contact at one rounded platform corner is not a usable entrance.
      if(bay.yaw<-1)deck(matrix.clone().multiply(new Matrix4().makeTranslation(0,0,2.5)),1.2,2.4);
    }
    block('stone',[0,high?.195:(plan.ground+bay.floor)/2,0],[5.65,high?.09:bay.floor-plan.ground,1.73],matrix);
    if(high){
      // Supported elevated rostrum uses the accepted original arched structure.
      // One left-hand flight per bay keeps the metre-wide gaps clear; paired
      // flights would intersect each other between adjacent straight bays.
      for(const side of [-1])for(let step=0;step<7;step++){
        const h=(bay.floor-plan.ground)*(step+1)/7;
        block(step===6?'cream':'stone',[side*3.04,plan.ground+h/2,1.15-step*.3],[.56,h,.31],matrix);
        block('gold',[side*3.04,plan.ground+h+.008,1.26-step*.3],[.48,.012,.035],matrix);
      }
    }else for(const side of [-1])block('cream',[side*3.0,.19,.15],[.54,.08,.90],matrix);
    // Clear gaps remain between bays. Low railings follow the outer promenade;
    // access is from each open side, not through a seat or across the route.
    for(const x of [-3.17,3.17]){
      block('ink',[x,.53,-1.53],[.055,.76,.055],matrix);
      block('ink',[x,.53,-.98],[.055,.76,.055],matrix);
      block('ink',[x,.90,-1.255],[.055,.06,.61],matrix);
    }
    for(const x of [-2.8,0,2.8])block('ink',[x,.53,-1.55],[.055,.76,.055],matrix);
    block('ink',[0,.90,-1.55],[5.68,.06,.055],matrix);
    // A narrow bronze course-facing nosing gives the new plinth an intentional
    // finish without adding flags, billboards or repeated decorative clutter.
    block('gold',[0,.169,1.10],[5.62,.018,.045],matrix);
  }
  if(track==='mild'){
    // Tree wells and exact footing clearances interrupt only the low paving,
    // not the route. The original trunks/roots and plinths remain untouched.
    const holes=[[-12.745,-10.855,-.775,.575],[-9.05,-6.35,-.875,.675],
      [-10.24,-9.53,-.94,-.22],[10.24,10.85,.43,1.06],[7.41,8.03,.47,1.10],
      [-14.39,-13.96,1.285,1.825]];
    const paving=(x:number,z:number,w:number,d:number)=>{
      for(const [paint,y,h,inset]of [['wood',.163,.026,0],['cream',.179,.008,.04]]as const){
        let pieces=[[x-w/2+inset,x+w/2-inset,z-d/2+inset,z+d/2-inset]];
        for(const [lx,hx,lz,hz]of holes){const next:number[][]=[];
          for(const[a,b,c,e]of pieces){const loX=Math.max(a!,lx!),hiX=Math.min(b!,hx!),loZ=Math.max(c!,lz!),hiZ=Math.min(e!,hz!);
            if(loX>=hiX||loZ>=hiZ){next.push([a!,b!,c!,e!]);continue;}
            if(a!<loX)next.push([a!,loX,c!,e!]);if(hiX<b!)next.push([hiX,b!,c!,e!]);
            if(c!<loZ)next.push([loX,hiX,c!,loZ]);if(hiZ<e!)next.push([loX,hiX,hiZ,e!]);
          }pieces=next;
        }
        for(const[a,b,c,e]of pieces)block(paint,[(a!+b!)/2,y,(c!+e!)/2],[b!-a!,h,e!-c!]);
      }
    };
    // A continuous service path stays inside the 3.45m free infield corridor.
    paving(-.65,1.20,28.0,.88);
    for(const x of [-11.8,-7.7, -1.15,5.15,12.25])paving(x,.54,.66,.56);
    // Officials and medal presentation are now read as a connected precinct.
    paving(-9.75,-.15,6.65,1.67);
    // Arrival forecourt: one clear longitudinal lane, two seating pockets,
    // transverse paver joints, and planters at its edge instead of dead paving.
    block('stone',[-12.75,.158,-6.63],[8.2,.016,1.0]);
    for(let x=-16.3;x<-8.5;x+=.65)block('cream',[x,.168,-6.63],[.018,.006,.90]);
    const bench=(x:number,z:number)=>{
      for(const end of [-.62,.62])block('stone',[x+end,.34,z],[.12,.38,.38]);
      for(const slat of [-.15,0,.15])block('wood',[x,.55,z+slat],[1.52,.07,.11]);
      block('ink',[x,.75,z-.24],[1.52,.22,.055]);
      for(const end of [-.65,.65])block('ink',[x+end,.64,z-.24],[.045,.42,.045]);
    };
    bench(-15.0,-7.4);bench(-10.45,-7.4);
    // Clear entry between the benches; low planting strips, no new tree canopy.
    for(const x of [-15.0,-10.45]){
      block('stone',[x,.33,-5.62],[2.05,.36,.48]);
      block('wood',[x,.515,-5.62],[1.90,.025,.34]);
      for(let i=0;i<9;i++)block('ink',[x-.8+i*.2,.59,-5.62],[.23,.16+(i%3)*.035,.27]);
    }
    // A quiet green-side rest bench terminates the path before the hairpin.
    bench(12.25,-.35);
  }
  batch('bleachers',plan.bays.map(b=>place(b.x,b.floor,b.z,b.yaw)));
  batch('spectators',plan.bays.map(b=>place(b.x,b.floor,b.z,b.yaw)));
  const high=plan.bays.filter(b=>b.floor>.5);
  if(high.length)batch('grandstand_rostrum',high.map(b=>place(b.x,0,b.z,b.yaw).multiply(new Matrix4().makeTranslation(-2.4,0,.05))));
  for(const [paint,parts]of buckets){const geometry=mergeGeometries(parts,false)!;parts.forEach(p=>p.dispose());owned.push(geometry);const material=new MeshStandardMaterial({color:paints[paint],roughness:paint==='gold'?.65:.88});materials.push(material);const mesh=mark(new Mesh(geometry,material),'seating-support');mesh.name=`seating-joinery:${paint}`;root.add(mesh);}
  unit.dispose();root.updateMatrixWorld(true);
  let disposed=false;
  return {root,plan,bounds:new Box3().setFromObject(root,true),dispose(){if(disposed)return;disposed=true;instances.forEach(m=>m.dispose());owned.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
