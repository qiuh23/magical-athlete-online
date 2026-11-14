import test from 'node:test';import assert from 'node:assert/strict';
import {MeshStandardMaterial,Color} from 'three';
import {TRACKS,type TrackId} from '../src/shared/tracks.js';
import {VENUE_TREE_SELECTION,isQuietLandscapeMesh,mutedVenueMaterial} from '../src/client/scene/environment/scene-hierarchy.js';
import {tileEffectLabel,tileTheme,buildTileFinish,buildTileLabels} from '../src/client/scene/environment/tile-finish.js';
import {Texture} from 'three';
import {buildRebuiltDeck} from '../src/client/scene/environment/deck-runtime.js';
import {trackConnections,trackNodeIds} from '../src/client/scene/math.js';
test('track-first policy keeps a small distinctive backdrop across all seven venues',()=>{
 const previous={mild:6,wild:6,'twisty-twirl':6,'whirly-world':6,squiggle:14,boardwalks:10,bridges:27};
 for(const track of Object.keys(TRACKS)as TrackId[]){assert.ok(VENUE_TREE_SELECTION[track].length<=previous[track]/2);assert.equal(new Set(VENUE_TREE_SELECTION[track]).size,VENUE_TREE_SELECTION[track].length);}
 assert.equal(isQuietLandscapeMesh('LANDSCAPE_REFINED_reed_leaf'),false);assert.equal(isQuietLandscapeMesh('MAP_silver_ripples'),false);assert.equal(isQuietLandscapeMesh('REFINED_sheltered_water'),true);assert.equal(isQuietLandscapeMesh('REFINED_meadow'),true);
});
test('background paint is owned and subdued without changing cached source materials',()=>{
 const source=new MeshStandardMaterial({color:'#ef7453',roughness:.3,metalness:.7});const original=source.color.clone(),muted=mutedVenueMaterial(source)as MeshStandardMaterial;
 assert.notEqual(muted,source);assert.ok(source.color.equals(original));assert.ok(!muted.color.equals(original));assert.ok(muted.roughness>=.86&&muted.metalness<=.12);source.dispose();muted.dispose();
});
test('surface signs distinguish movement from points and hazards without relying on color',()=>{
 assert.equal(tileEffectLabel({kind:'arrow',move:3}),'前进 +3');assert.equal(tileEffectLabel({kind:'arrow',move:-2}),'后退 -2');assert.equal(tileEffectLabel({kind:'star',points:1}),'得分 +1');assert.equal(tileEffectLabel({kind:'star',points:-2}),'扣分 -2');assert.equal(tileEffectLabel({kind:'trip'}),'绊倒');assert.equal(tileEffectLabel({kind:'warp',to:7}),'↔ 7');
 assert.ok(new Color(tileTheme().face).getHSL({h:0,s:0,l:0}).l>.55);
 for(const track of Object.keys(TRACKS)as TrackId[]){const finish=buildTileFinish(track),labels=buildTileLabels(finish.labels,new Texture());assert.equal(finish.labels.length,trackNodeIds(track).length);assert.equal(labels.mesh.geometry.getAttribute('position').count,finish.labels.length*4);assert.ok(finish.labels.every(l=>Number.isFinite(l.angle)));finish.dispose();labels.dispose();}
});
test('route bands stay continuous and preserve every authoritative connection',()=>{
 for(const track of Object.keys(TRACKS)as TrackId[]){const kit=buildRebuiltDeck(track,false);assert.equal(kit.roads.count,trackConnections(track).length+1);assert.equal(kit.pads.count,trackNodeIds(track).length);assert.equal(kit.material.color.getHexString(),'c8b99a');for(const v of Object.values(kit))if('dispose'in v)v.dispose();}
});

// Direct current-runtime assertions, not source-file hashes or reuse of old
// contact reports. The visual redesign may change paint and remove scenery;
// route support, running surface and retained source anchors must stay exact.
test('warm route bands preserve authoritative pad, road and support transforms',async()=>{
 const {Matrix4,Object3D}=await import('three');
 const {boardPoint,TILE}=await import('../src/client/scene/math.js');
 const {MECHANISM_PAD_SIZE}=await import('../src/client/scene/mechanisms/layout.js');
 const {deckSupportBottom}=await import('../src/client/scene/mechanisms/static-support.js');
 const actual=new Matrix4(),expected=new Object3D();
 const matrix=(mesh:import('three').InstancedMesh,index:number,p:number[],scale:number[],yaw=0)=>{
  expected.position.fromArray(p);expected.scale.fromArray(scale);expected.rotation.set(0,yaw,0);expected.updateMatrix();mesh.getMatrixAt(index,actual);
  actual.elements.forEach((n,i)=>assert.ok(Math.abs(n-expected.matrix.elements[i]!)<5e-6,`${mesh.name}:${index}:${i}`));
 };
 for(const track of Object.keys(TRACKS)as TrackId[])for(const low of [false,true]){
  const kit=buildRebuiltDeck(track,low),nodes=trackNodeIds(track),edges=trackConnections(track);
  assert.deepEqual([kit.geometry.parameters.width,kit.geometry.parameters.height,kit.geometry.parameters.depth],[1,1,1]);
  assert.deepEqual([kit.pole.parameters.radiusTop,kit.pole.parameters.radiusBottom,kit.pole.parameters.height],[.09,.13,1]);
  nodes.forEach((node,i)=>{const p=boardPoint(node,false,track);matrix(kit.pads,i,[p[0],p[1]-.075,p[2]],[MECHANISM_PAD_SIZE,.15,MECHANISM_PAD_SIZE]);
   [-1,1].forEach((x,a)=>[-1,1].forEach((z,b)=>{const bottom=deckSupportBottom(track,node,x,z),h=p[1]-.15-bottom,at=[p[0]+x*.88,bottom+h/2,p[2]+z*.88];matrix(kit.supports,i*4+a*2+b,at,bottom===.40?[0,0,0]:[1,h,1]);if(bottom===.40)matrix(kit.trimmedSupports,0,at,[1,h,1]);}));
  });
  edges.forEach(([a,b],i)=>{const p=boardPoint(a,false,track),q=boardPoint(b,false,track);matrix(kit.roads,i,[(p[0]+q[0])/2,(p[1]+q[1])/2-.085,(p[2]+q[2])/2],[MECHANISM_PAD_SIZE,.13,Math.hypot(q[0]-p[0],q[2]-p[2])],Math.atan2(q[0]-p[0],q[2]-p[2]));});
  const start=boardPoint(0,false,track);matrix(kit.roads,edges.length,[start[0]-TILE*1.5,start[1]-.085,start[2]],[TILE*3,.13,MECHANISM_PAD_SIZE]);
  for(const v of Object.values(kit))if('dispose'in v)v.dispose();
 }
});

test('special surface signs stay flat and inside the unchanged running squares',async()=>{
 const {Matrix4,Object3D,InstancedMesh,Vector3}=await import('three');const {boardPoint}=await import('../src/client/scene/math.js');
 const actual=new Matrix4(),expected=new Object3D();
 for(const track of Object.keys(TRACKS)as TrackId[]){
  const finish=buildTileFinish(track),labels=buildTileLabels(finish.labels,new Texture()),nodes=trackNodeIds(track);
  const faces=finish.root.getObjectByName('complete-running-surfaces')as import('three').InstancedMesh;
  assert.ok(faces instanceof InstancedMesh);assert.equal(faces.count,nodes.length);
  const bounds=faces.geometry;bounds.computeBoundingBox();const size=bounds.boundingBox!.getSize(new Vector3());assert.ok(Math.abs(size.x-1.76)<1e-6&&Math.abs(size.y-1.76)<1e-6&&size.z===0);
  nodes.forEach((node,i)=>{const p=boardPoint(node,false,track);expected.position.set(p[0],p[1]+.007,p[2]);expected.scale.set(1,1,1);expected.rotation.set(-Math.PI/2,0,0);expected.updateMatrix();faces.getMatrixAt(i,actual);actual.elements.forEach((n,j)=>assert.ok(Math.abs(n-expected.matrix.elements[j]!)<5e-6));
   const printed=labels.mesh.geometry.getAttribute('position');for(let j=i*4;j<i*4+4;j++){assert.ok(Math.abs(printed.getX(j)-p[0])<=.810005);assert.ok(Math.abs(printed.getZ(j)-p[2])<=.810005);assert.ok(Math.abs(printed.getY(j)-(p[1]+.026))<1e-6);}
  });
  finish.dispose();labels.dispose();
 }
});

test('removed stands leave two original anchors, never moved or resized substitutes',async()=>{
 const {stadiumSeatingPlan}=await import('../src/client/scene/environment/seating.js');
 const plans:Record<TrackId,number[][]>={mild:[[1.15,-6.25,0],[18.25,-.15,-Math.PI/2]],wild:[[1.15,-6.25,0],[19.4,-.15,-Math.PI/2]],'twisty-twirl':[[1.15,-6.25,0],[18.25,-.15,-Math.PI/2]],'whirly-world':[[1.15,-6.25,0],[19.05,-.15,-Math.PI/2]],squiggle:[[-.88,-6,0],[18.5,2.7,-Math.PI/2]],boardwalks:[[-6.6,-6.2,0],[18.4,2.1,-Math.PI/2]],bridges:[[-1.35,-9.6,0],[27,-.1,-Math.PI/2]]};
 for(const track of Object.keys(TRACKS)as TrackId[])for(const scale of [1,1.8])for(const lift of [0,1.43]){
  const plan=stadiumSeatingPlan(track,{scale,lift,lowQuality:false});assert.equal(plan.bays.length,2);
  plan.bays.forEach((b,i)=>assert.deepEqual([b.x,b.z,b.yaw,b.floor],[plans[track][i]![0]!*scale,plans[track][i]![1]!*scale,plans[track][i]![2],lift?1.384:.234]));
 }
});

test('remaining trees retain exact published source matrices and local repairs',async()=>{
 const {readFileSync}=await import('node:fs');const {Matrix4}=await import('three');
 const {environmentTrees,isNaturalMap}=await import('../src/client/scene/environment/layout.js');
 const sources=JSON.parse(readFileSync('src/client/scene/environment/source-layout.json','utf8'));
 for(const track of Object.keys(TRACKS)as TrackId[])for(const scale of [1,1.8])for(const lift of [0,1.43]){
  const trees=environmentTrees(track,{scale,lift,lowQuality:false});assert.equal(trees.length,VENUE_TREE_SELECTION[track].length);
  trees.forEach((tree,i)=>{const original=sources[track].trees[VENUE_TREE_SELECTION[track][i]!],m=new Matrix4().set(...original.matrix.flat()as Parameters<InstanceType<typeof Matrix4>['set']>);assert.equal(tree.name,original.name);assert.equal(tree.asset,original.asset);
   m.elements[12]*=scale/original.sourceScale;m.elements[14]*=scale/original.sourceScale;m.elements[13]+=isNaturalMap(track)?.7:lift?0:.09;
   if((track==='mild'||track==='twisty-twirl')&&tree.name==='INFIELD_TREE_03')m.elements[14]-=.65;
   if(track==='bridges'&&tree.name==='REFINED_TREE_06')m.elements[12]-=.8;
   if(track==='squiggle'&&tree.name==='REFINED_TREE_02')m.elements[12]+=1;
   if(track==='squiggle'&&tree.name==='REFINED_TREE_03')m.elements[14]+=1.95;
   assert.deepEqual(tree.matrix.elements,m.elements);
  });
 }
});
