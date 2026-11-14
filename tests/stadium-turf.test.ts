import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {LinearFilter,LinearMipmapLinearFilter,NoColorSpace,RepeatWrapping,SRGBColorSpace} from 'three';
import {stadiumTurfPixels,stadiumMowDirection,createStadiumTurfTextures,createStadiumTurfMaterial,STADIUM_TURF_SIZE,STADIUM_TURF_BANDS,STADIUM_TURF_REVISION} from '../src/client/scene/environment/stadium-turf.js';

const [width,height]=STADIUM_TURF_SIZE;
const channelMean=(pixels:Uint8Array,channel:number,x0:number=0,x1:number=width,y0:number=0,y1:number=height)=>{
 let sum=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)sum+=pixels[(y*width+x)*4+channel]!;
 return sum/((x1-x0)*(y1-y0));
};
test('turf is deterministic and bounded, with short dense fibres and no emissive colours',()=>{
 const a=stadiumTurfPixels();assert.equal(a,stadiumTurfPixels());assert.deepEqual(STADIUM_TURF_SIZE,[1024,256]);assert.equal(a.color.length,width*height*4);assert.equal(a.normal.length,a.color.length);
 for(let i=0;i<a.color.length;i+=4){assert.ok(a.color[i]!>=55&&a.color[i]!<=103);assert.ok(a.color[i+1]!>=95&&a.color[i+1]!<=146);assert.ok(a.color[i+2]!>=46&&a.color[i+2]!<=71);assert.equal(a.color[i+3],255);assert.equal(a.normal[i+3],255);
  const n=[0,1,2].map(c=>a.normal[i+c]!/127.5-1);assert.ok(Math.abs(Math.hypot(...n)-1)<.008);assert.ok(n[2]!>.94);
 }
 assert.ok(channelMean(a.color,1)>118&&channelMean(a.color,1)<121);
 assert.equal(createHash('sha256').update(a.color).digest('hex'),'3d6d16f353630839ba6e55c21f3a66a306bcda46dc42dc979e6d624f1237c638');
});
test('mowing alternates eighteen broad passes, with soft edges and quiet turning headlands',()=>{
 assert.equal(STADIUM_TURF_BANDS,18);for(let i=0;i<18;i++){const direction=stadiumMowDirection((i+.5)/18,.5);assert.ok(Math.abs(direction)>.98);assert.equal(Math.sign(direction),i%2?-1:1);}
 assert.equal(Math.abs(stadiumMowDirection(.3,0)),0);assert.equal(Math.abs(stadiumMowDirection(.3,1)),0);
 const a=stadiumTurfPixels();const green=(band:number)=>channelMean(a.color,1,Math.floor((band+.3)/18*width),Math.floor((band+.7)/18*width),70,185);
 for(let i=0;i<17;i++){const contrast=Math.abs(green(i)-green(i+1));assert.ok(contrast>19&&contrast<27,`stripe ${i} contrast ${contrast}`);}
 // No one-texel painted boundary: the largest neighboring stripe change stays soft.
 let max=0;for(let x=1;x<width;x++)max=Math.max(max,Math.abs(stadiumMowDirection(x/width,.5)-stadiumMowDirection((x-1)/width,.5)));assert.ok(max<.4);
 const edge=channelMean(a.color,1,0,width,0,3);assert.ok(Math.abs(edge-channelMean(a.color,1))<2);
});
test('colour and fibre normals agree on the direction of each mower pass',()=>{
 const a=stadiumTurfPixels();let positive=0,negative=0;
 for(let i=0;i<18;i++){const ny=channelMean(a.normal,1,Math.floor((i+.3)/18*width),Math.floor((i+.7)/18*width),70,185);if(i%2){assert.ok(ny<119);negative++;}else{assert.ok(ny>136);positive++;}}
 assert.equal(positive,negative);
});
test('runtime wraps share cached pixels but own GPU resources; mips suppress distant fibre shimmer',()=>{
 const a=createStadiumTurfTextures(),b=createStadiumTurfTextures();assert.notEqual(a.color,b.color);assert.equal(a.color.image.data,b.color.image.data);assert.equal(a.normal.image.data,b.normal.image.data);
 for(const t of [a.color,a.normal,b.color,b.normal]){assert.equal(t.generateMipmaps,true);assert.equal(t.minFilter,LinearMipmapLinearFilter);assert.equal(t.magFilter,LinearFilter);assert.equal(t.anisotropy,4);assert.equal(t.wrapS,RepeatWrapping);assert.equal(t.wrapT,RepeatWrapping);assert.deepEqual(t.repeat.toArray(),[1,1]);t.dispose();}
 assert.equal(a.color.colorSpace,SRGBColorSpace);assert.equal(a.normal.colorSpace,NoColorSpace);
 // Two RGBA8 maps plus a complete mip chain remain under 2.7 MiB.
 assert.ok(width*height*4*2*4/3<2.7*1024*1024);
});
test('one opaque standard material receives real lights; economy omits the normal texture',()=>{
 const textures=createStadiumTurfTextures();const full=createStadiumTurfMaterial(textures),low=createStadiumTurfMaterial(textures,true);
 for(const material of [full,low]){assert.equal(material.type,'MeshStandardMaterial');assert.equal(material.name,STADIUM_TURF_REVISION);assert.equal(material.map,textures.color);assert.equal(material.color.getHexString(),'ffffff');assert.equal(material.emissive.getHex(),0);assert.equal(material.metalness,0);assert.equal(material.roughness,.92);assert.equal(material.transparent,false);assert.equal(material.alphaTest,0);assert.equal(material.bumpMap,null);assert.equal(material.roughnessMap,null);assert.equal(material.toneMapped,true);}
 assert.equal(full.normalMap,textures.normal);assert.equal(low.normalMap,null);assert.deepEqual(full.normalScale.toArray(),[.62,.62]);full.dispose();low.dispose();textures.color.dispose();textures.normal.dispose();
});
test('Mild keeps a continuous field even while legacy decorative assets are unavailable',async()=>{
 const {readFileSync}=await import('node:fs');const source=readFileSync('src/client/scene/DioramaStadium.tsx','utf8');
 assert.match(source,/const kit=useKit\(lowQuality,track==='mild'\)/);
 assert.match(source,/track!=='mild'&&<>\s*<Box[^\n]+material=\{kit.turfShade\}/);
 assert.match(source,/material=\{kit.turf\} shadow=\{false\}/);
});
