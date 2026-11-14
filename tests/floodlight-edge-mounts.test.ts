import ts from 'typescript';
import {Matrix4} from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {BOARD_CENTER_SPAN,TILE} from '../src/client/scene/math.js';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8')),sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const input=read('src/client/scene/environment/floodlight-edge-mounts.json'),record=read('docs/qa/floodlight-rows/edge-mount-inputs.json');
test('natural lamp layout corners retain actual BVH inputs without claiming authorization',()=>{
 assert.equal(input.version,1);assert.deepEqual(Object.keys(input.tracks),['squiggle','boardwalks','bridges']);assert.equal(record.measured.length,96);
 assert.equal(sha(record.output),record.sha256);for(const [p,h] of Object.entries(record.inputs))assert.equal(sha(p),h,p);
 assert.match(record.scope,/layout input only/);assert.match(record.scope,/No new collision/);
 for(const [track,t] of Object.entries(input.tracks) as [string,any][]){assert.equal(t.fixtures.length,8);for(const [i,f] of t.fixtures.entries()){
 assert.equal(f.innerCorners.length,4);const raw=record.measured.filter((m:any)=>m.track===track&&m.fixture===i);assert.equal(raw.length,4);
 const side=i<4?-1:1;for(const [j,c] of f.innerCorners.entries()){const m=raw[j];assert.equal(m.sourceScale,t.referenceScale);assert.equal(m.side,side);assert.equal(m.surface[1],j<2?-.55:-.35);
 assert.ok(Math.abs(c[0]*t.referenceScale-m.inner[0])<1e-10);assert.ok(Math.abs(c[2]*t.referenceScale-m.inner[2])<1e-10);assert.equal(c[1],m.inner[1]);assert.ok(Math.abs(m.inner[2]-m.surface[2]+side*.015)<1e-10);
 assert.ok(Math.abs(m.inner[0]-f.x*t.referenceScale-(j%2===0?-.15:.15))<1e-10);assert.match(m.target,/_base:/);
 }
 }}
});

test('classic connector follows the real rounded sidewall within the bounded 20 mm joint',async()=>{
 const record=read('docs/qa/floodlight-rows/classic-mount-inputs.json');
 // Turf/material edits must not rewrite the historical measurement. Compare
 // the actual current sidewall geometry and transform instead of the whole TSX.
 const path='src/client/scene/DioramaStadium.tsx',source=readFileSync(path,'utf8');
 const ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const constants:Record<string,number>={TILE};
 function number(node:ts.Expression):number {
  if(ts.isNumericLiteral(node))return Number(node.text);
  if(ts.isParenthesizedExpression(node))return number(node.expression);
  if(ts.isIdentifier(node)&&node.text in constants)return constants[node.text]!;
  if(ts.isPropertyAccessExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='BOARD_CENTER_SPAN'){
   assert.ok(node.name.text==='width'||node.name.text==='depth');return BOARD_CENTER_SPAN[node.name.text];
  }
  if(ts.isPrefixUnaryExpression(node)&&node.operator===ts.SyntaxKind.MinusToken)return -number(node.operand);
  if(ts.isBinaryExpression(node)){
   const a=number(node.left),b=number(node.right);
   if(node.operatorToken.kind===ts.SyntaxKind.PlusToken)return a+b;
   if(node.operatorToken.kind===ts.SyntaxKind.MinusToken)return a-b;
   if(node.operatorToken.kind===ts.SyntaxKind.AsteriskToken)return a*b;
   if(node.operatorToken.kind===ts.SyntaxKind.SlashToken)return a/b;
  }
  throw Error('Unrecognized sidewall expression: '+node.getText(ast));
 }
 const visit=(node:ts.Node,fn:(n:ts.Node)=>void)=>{fn(node);node.forEachChild(n=>visit(n,fn));};
 visit(ast,node=>{if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&['WIDTH','DEPTH'].includes(node.name.text)){assert.ok(node.initializer);constants[node.name.text]=number(node.initializer);}});
 let args:number[]|undefined,position:number[]|undefined;
 visit(ast,node=>{
  if(ts.isPropertyAssignment(node)&&node.name.getText(ast)==='plinth'){
   assert.equal(args,undefined);assert.ok(ts.isNewExpression(node.initializer));
   assert.equal(node.initializer.expression.getText(ast),'RoundedBoxGeometry');args=node.initializer.arguments?.map(number);
  }
  if(!ts.isJsxSelfClosingElement(node)||node.tagName.getText(ast)!=='mesh')return;
  const attr=(name:string)=>node.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.getText(ast)===name) as ts.JsxAttribute|undefined;
  const g=attr('geometry')?.initializer;if(!g||!ts.isJsxExpression(g)||g.expression?.getText(ast)!=='kit.plinth')return;
  assert.equal(position,undefined);assert.equal(attr('scale'),undefined);assert.equal(attr('rotation'),undefined);
  const p=attr('position')?.initializer;assert.ok(p&&ts.isJsxExpression(p)&&p.expression&&ts.isArrayLiteralExpression(p.expression));position=p.expression.elements.map(e=>number(e as ts.Expression));
 });
 assert.ok(args?.length===5&&position?.length===3,'Read the actual wood constructor and transform');
 const geometry=new RoundedBoxGeometry(...args as [number,number,number,number,number]);
 const hashArray=(a:ArrayBufferView)=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
 assert.deepEqual(args,[record.geometry.width,record.geometry.height,record.geometry.depth,record.geometry.segments,record.geometry.radius]);
 assert.deepEqual(new Matrix4().makeTranslation(...position as [number,number,number]).toArray(),record.geometry.worldMatrix);
 assert.equal(hashArray(geometry.getAttribute('position').array),record.geometry.positionSHA256);
 assert.equal(geometry.index?hashArray(geometry.index.array):null,record.geometry.indexSHA256);
 geometry.dispose();
 const {floodlightLayout}=await import('../src/client/scene/environment/floodlights.js');
 for(const track of ['mild','twisty-twirl'] as const){
  const lamps=floodlightLayout(track,{scale:1,lift:0,lowQuality:false});
  for(const lamp of lamps.filter(l=>l.row===1)){
   assert.equal(lamp.base.z,5.9);const points=lamp.connector!.innerCorners;
   assert.deepEqual(points.map(p=>p[1]),[-.66,-.66,-.58,-.58]);
   assert.ok(points.every(p=>Math.abs(p[2]!-5.25827938338963)<1e-10));
  }
 }
 // Recorded endpoint and every intermediate geometric Y segment, not just the ends.
 assert.ok(record.rows.length===4);
 for(const row of record.rows){assert.ok(row.maxDepth<=.020);assert.equal(row.within20mm,true);}
});
