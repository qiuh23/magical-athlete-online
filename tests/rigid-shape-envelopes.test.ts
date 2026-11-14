import test from 'node:test';
import assert from 'node:assert/strict';
import {BufferGeometry,Float32BufferAttribute,Vector3} from 'three';
import {rigidShapeEnvelopes} from '../src/client/scene/mechanisms/rigid-shape-envelopes.js';

test('sixteen cached rigid envelopes cover entire triangles crossing slab boundaries',()=>{
 for(const indexed of [false,true]){
  const geometry=new BufferGeometry().setAttribute('position',new Float32BufferAttribute([-3,-.8,.2,4,.9,-.3,.7,1.2,.8],3));if(indexed)geometry.setIndex([0,1,2]);
  const boxes=rigidShapeEnvelopes(geometry);assert.ok(boxes.length>1&&boxes.length<=16);assert.equal(rigidShapeEnvelopes(geometry),boxes,'same immutable geometry reuses envelopes');
  const p=geometry.getAttribute('position'),a=new Vector3().fromBufferAttribute(p,0),b=new Vector3().fromBufferAttribute(p,1),c=new Vector3().fromBufferAttribute(p,2);
  for(let i=0;i<=128;i++)for(let j=0;j<=128-i;j++){const u=i/128,v=j/128,point=a.clone().multiplyScalar(1-u-v).addScaledVector(b,u).addScaledVector(c,v);assert.ok(boxes.some(box=>box.clone().expandByScalar(1e-10).containsPoint(point)),'triangle interior, including slab-crossing edges, is enclosed');}
  geometry.dispose();
 }
});

test('morph geometry retains its complete conservative envelope instead of caching unposed subshapes',()=>{
 const geometry=new BufferGeometry().setAttribute('position',new Float32BufferAttribute([-1,0,0,1,0,0,0,1,0],3));
 geometry.morphAttributes.position=[new Float32BufferAttribute([-1,0,2,3,0,2,0,4,2],3)];geometry.morphTargetsRelative=false;
 const boxes=rigidShapeEnvelopes(geometry);assert.equal(boxes.length,1);assert.ok(boxes[0]!.containsPoint(new Vector3(3,4,2)));assert.equal(rigidShapeEnvelopes(geometry),boxes);geometry.dispose();
});
