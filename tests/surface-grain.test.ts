import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as THREE from 'three';

// Execute the actual texture functions without a DOM, browser or GPU. The canvas
// double records authored pixels/paint operations, not simulated render output.
function textureFunction(file:string,name:string,...args:unknown[]) {
 const source=readFileSync(file,'utf8');
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
 assert.ok(fn);
 let pixels:Uint8ClampedArray|undefined;
 const fills:{style:string,x:number,y:number,w:number,h:number}[]=[];
 const strokes:string[]=[];
 const context={fillStyle:'',strokeStyle:'',lineWidth:0,
  createImageData:(w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}),
  putImageData:(image:{data:Uint8ClampedArray})=>{pixels=image.data;},
  fillRect(x:number,y:number,w:number,h:number){fills.push({style:this.fillStyle,x,y,w,h});},
  beginPath(){},moveTo(){},lineTo(){},stroke(){strokes.push(this.strokeStyle);},
 };
 const canvas={width:0,height:0,getContext:()=>context};
 const code=ts.transpile(fn.getText(ast)+`\nresult=${name}(...args);`,{target:ts.ScriptTarget.ES2022});
 const sandbox={THREE,document:{createElement:()=>canvas},args,result:undefined as THREE.CanvasTexture|undefined};
 vm.runInNewContext(code,sandbox);assert.ok(sandbox.result);
 return {texture:sandbox.result,canvas,pixels,fills,strokes};
}
const stadium='src/client/scene/DioramaStadium.tsx';
const scenery='src/client/scene/environment/RebuiltScenery.tsx';
test('mould grain keeps texture size, repeat and mean while limiting tiny bump contrast',()=>{
 const {texture,canvas,pixels}=textureFunction(stadium,'mouldGrain');assert.ok(pixels);
 assert.deepEqual([canvas.width,canvas.height],[64,64]);assert.deepEqual(texture.repeat.toArray(),[4,4]);
 const values=Array.from(pixels).filter((_,i)=>i%4===0);
 assert.equal(Math.max(...values)-Math.min(...values),8); // Previously 34.
 const mean=values.reduce((a,b)=>a+b,0)/values.length;assert.ok(mean>206&&mean<208);
 texture.dispose();
});
test('legacy lawn retains eight authored bands with only two bytes of fine variation',()=>{
 const {texture,canvas,pixels}=textureFunction(stadium,'lawnTexture');assert.ok(pixels);
 assert.deepEqual([canvas.width,canvas.height],[256,256]);assert.deepEqual(texture.repeat.toArray(),[3,1]);assert.equal(texture.anisotropy,4);
 const means:number[]=[];
 for(let band=0;band<8;band++){
  const values:number[]=[];for(let y=0;y<256;y++)for(let x=band*32;x<(band+1)*32;x++)values.push(pixels[(y*256+x)*4+1]!);
  assert.equal(Math.max(...values)-Math.min(...values),2); // Previously 8.
  means.push(values.reduce((a,b)=>a+b,0)/values.length);
 }
 for(let i=1;i<8;i++)assert.ok(Math.abs(Math.abs(means[i]!-means[i-1]!)-10)<.1);
 texture.dispose();
});
test('rebuilt scenery keeps grass bands and wood seams while quieting fine stamps',()=>{
 for(const wood of [false,true]){
  const {texture,canvas,fills,strokes}=textureFunction(scenery,'surfaceStamp',wood);
  assert.deepEqual([canvas.width,canvas.height],[128,128]);
  const flecks=fills.filter(f=>f.style.startsWith('rgba(67,75,45,'));assert.equal(flecks.length,1800);
  for(const f of flecks){const alpha=Number(f.style.slice(14,-1));assert.ok(alpha>=.005&&alpha<=.014000001);assert.equal(f.w,wood?8:1);assert.equal(f.h,1);}
  if(wood){assert.equal(strokes.length,4);assert.ok(strokes.every(s=>s==='rgba(96,65,34,.2)'));}
  else {assert.equal(fills.filter(f=>f.style==='rgba(255,255,220,.08)'&&f.w===16&&f.h===128).length,4);}
  texture.dispose();
 }
});
