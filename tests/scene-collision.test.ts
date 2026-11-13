import test from 'node:test';import assert from 'node:assert/strict';import{BoxGeometry,Matrix4}from'three';import{collider,collision,softSeparationBound}from'../scripts/recovery/scene-collision.js';
const box=(name:string,w:number,x=0)=>collider(name,new BoxGeometry(w,w,w),new Matrix4().makeTranslation(x,0,0));
test('new scene narrow phase distinguishes surface crossing, full containment and empty overlap',()=>{assert.equal(collision(box('outer',4),box('inner',1))?.kind,'containment');assert.equal(collision(box('inner',1),box('outer',4))?.kind,'containment');assert.equal(collision(box('a',1),box('b',1,3)),undefined);assert.equal(collision(box('a',1),box('b',1,.8))?.kind,'surface');});

test('soft separation uses actual face axes and retains the unchanged millimetre limit',()=>{assert.ok(Math.abs(softSeparationBound(box('a',1),box('b',1,.999))-.001)<1e-9);assert.ok(softSeparationBound(box('a',1),box('b',1,.9))>.002);});
