import test from 'node:test';import assert from'node:assert/strict';import{BoxGeometry,Matrix4,Mesh,Vector3}from'three';import{RoundedBoxGeometry}from'three/addons/geometries/RoundedBoxGeometry.js';
import{cutSeatingBlock,seatingFootingCuts}from'../src/client/scene/environment/seating-clearance.js';
import{collect,collision}from'../scripts/recovery/scene-collision.js';
import{mechanismLayout}from'../src/client/scene/mechanisms/layout.js';import{mechanismPlacements}from'../src/client/scene/mechanisms/placements.js';import{buildDeviceFoundation,buildWild13GroundTongue}from'../src/client/scene/environment/deck-runtime.js';
const digest=(g:any)=>Array.from(g.getAttribute('position').array);
test('only three affected map platforms receive footing cutouts',()=>{
 for(const t of ['mild','twisty-twirl','boardwalks','bridges']as const)assert.deepEqual(seatingFootingCuts(t,1),[]);
 assert.equal(seatingFootingCuts('squiggle',1).length,3);assert.equal(seatingFootingCuts('wild',1).length,2);assert.equal(seatingFootingCuts('whirly-world',1).length,1);
});
test('unaffected rounded source geometry is returned unchanged',()=>{
 const source=new RoundedBoxGeometry(3,.35,4,2,.04),before=digest(source);assert.equal(cutSeatingBlock(source,[]),source);assert.deepEqual(digest(source),before);
 assert.equal(cutSeatingBlock(source,[{anchor:'outside',center:[30,0],width:1,depth:1,yaw:0}]),source);source.dispose();
});
test('overlapping notches leave closed rounded geometry and do not fill cutouts',()=>{
 const source=new RoundedBoxGeometry(4,.35,3,2,.04),result=cutSeatingBlock(source,[{anchor:'one',center:[1.6,0],width:1.2,depth:1.9,yaw:0},{anchor:'two',center:[1.0,0],width:1.7,depth:.7,yaw:0}]);
 const surface=collect(new Mesh(result))[0]!;assert.ok(surface.data.components.length>0);assert.ok(surface.data.components.every(c=>c.closed));
 for(const [x,z,w,d]of [[1.6,0,1.18,1.88],[1,0,1.68,.68]]){const probe=new Mesh(new BoxGeometry(w,.30,d));probe.position.set(x,0,z);assert.equal(collision(surface,collect(probe)[0]!),undefined);probe.geometry.dispose();}
 const keep=new Mesh(new BoxGeometry(.2,.2,.2));keep.position.set(-1,0,0);assert.equal(collision(surface,collect(keep)[0]!)?.kind,'containment');keep.geometry.dispose();result.dispose();
});
test('rigid cutouts follow unchanged legacy roots at default and alternate spacing',()=>{
 const previous=(globalThis as any).window;
 try{for(const spacing of [undefined,2.6])for(const track of ['squiggle','wild','whirly-world']as const){
  (globalThis as any).window={location:{search:'?mechanisms=1'+(spacing?'&mechanismSpacing='+spacing:'')}};
  const scale=mechanismLayout(track,spacing).scale,cuts=seatingFootingCuts(track,scale),ids=new Set(cuts.map(c=>c.anchor));
  for(const p of mechanismPlacements(track).filter(p=>ids.has(p.anchor.id))){const roots=[buildDeviceFoundation(p.matrix,-.001),...(p.anchor.id==='wild:13'?[buildWild13GroundTongue(p.matrix)]:[])];
   for(let i=0;i<roots.length;i++){const root=roots[i]!,cut=cuts.filter(c=>c.anchor===p.anchor.id)[i]!,inverse=new Matrix4().makeRotationY(cut.yaw).setPosition(cut.center[0],0,cut.center[1]).invert();root.updateMatrixWorld(true);const pos=root.geometry.getAttribute('position');for(let j=0;j<pos.count;j++){const v=new Vector3().fromBufferAttribute(pos,j).applyMatrix4(root.matrixWorld).applyMatrix4(inverse);assert.ok(Math.abs(v.x)<=cut.width/2-.01499);assert.ok(Math.abs(v.z)<=cut.depth/2-.01499);}root.geometry.dispose();}
  }
 }}finally{(globalThis as any).window=previous;}
});
