import assert from 'node:assert/strict';
import test from 'node:test';
import {stadiumTurfPixels,createStadiumTurfTextures,STADIUM_TURF_SIZE}from'../src/client/scene/environment/stadium-turf.js';
test('turf pixels are deterministic, cached and bounded with matching color/normal inputs',()=>{
 const a=stadiumTurfPixels(),b=stadiumTurfPixels();assert.equal(a,b);assert.deepEqual(STADIUM_TURF_SIZE,[512,128]);assert.equal(a.color.length,512*128*4);assert.equal(a.normal.length,a.color.length);
 for(let i=0;i<a.color.length;i+=4){assert.ok(a.color[i]!>=90&&a.color[i]!<=118);assert.ok(a.color[i+1]!>=125&&a.color[i+1]!<=153);assert.equal(a.color[i+3],255);assert.ok(a.normal[i+2]!>=253);}
 const t=createStadiumTurfTextures();assert.equal(t.color.image.data,a.color);assert.equal(t.normal.image.data,a.normal);assert.equal(t.color.generateMipmaps,true);assert.equal(t.normal.generateMipmaps,true);t.color.dispose();t.normal.dispose();
});
