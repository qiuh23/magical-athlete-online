/** Re-measure the current classic wood sidewall. No runtime or admission writes. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
import {DoubleSide,Mesh,MeshBasicMaterial,Ray,Vector3} from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {BOARD_CENTER_SPAN,TILE} from '../../src/client/scene/math.js';
import {floodlightLayout} from '../../src/client/scene/environment/floodlights.js';
import {collect} from './scene-collision.js';
const sourcePath='src/client/scene/DioramaStadium.tsx',output='docs/qa/floodlight-rows/classic-mount-inputs.json';
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const source=readFileSync(sourcePath,'utf8'),ast=ts.createSourceFile(sourcePath,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
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
 throw Error('Unrecognized geometry expression: '+node.getText(ast));
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
 const attrs=node.attributes.properties;const attr=(name:string)=>attrs.find(a=>ts.isJsxAttribute(a)&&a.name.getText(ast)===name) as ts.JsxAttribute|undefined;
 const geometry=attr('geometry')?.initializer;if(!geometry||!ts.isJsxExpression(geometry)||geometry.expression?.getText(ast)!=='kit.plinth')return;
 assert.equal(position,undefined);assert.equal(attr('scale'),undefined);assert.equal(attr('rotation'),undefined);
 const p=attr('position')?.initializer;assert.ok(p&&ts.isJsxExpression(p)&&p.expression&&ts.isArrayLiteralExpression(p.expression));position=p.expression.elements.map(e=>number(e as ts.Expression));
});
assert.ok(args?.length===5&&position?.length===3,'The current wood constructor and transform must be read exactly');
const geometry=new RoundedBoxGeometry(...args as [number,number,number,number,number]);
const mesh=new Mesh(geometry,new MeshBasicMaterial());mesh.name='current-diorama-wood';mesh.position.fromArray(position);mesh.updateMatrixWorld(true);
const wall=collect(mesh)[0]!,p=geometry.getAttribute('position'),ix=geometry.index;
const vertices=Array.from({length:p.count},(_,i)=>new Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld));
const triangles:Array<Vector3[]>=[];for(let k=0;k<(ix?.count??p.count);k+=3){const tri=[0,1,2].map(j=>vertices[ix?.getX(k+j)??k+j]!.clone());if(tri.every(v=>v.z>0))triangles.push(tri);}
function clipped(triangle:Vector3[],xmin:number,xmax:number,ymin:number,ymax:number){
 let poly=triangle.map(v=>v.clone());
 for(const [axis,edge,sign]of [['x',xmin,-1],['x',xmax,1],['y',ymin,-1],['y',ymax,1]] as const){
  const next:Vector3[]=[];for(let i=0;i<poly.length;i++){const a=poly[i]!,b=poly[(i+1)%poly.length]!,da=(a[axis]-edge)*sign,db=(b[axis]-edge)*sign;
   if(da<=1e-10)next.push(a);if((da<0&&db>0)||(da>0&&db<0))next.push(a.clone().lerp(b,da/(da-db)));
  }poly=next;if(!poly.length)break;
 }return poly;
}
function surface(x:number,y:number){
 const origin=new Vector3(x,y,100).applyMatrix4(wall.inverse),direction=new Vector3(0,0,-1).transformDirection(wall.inverse);
 const hits=wall.data.tree.raycast(new Ray(origin,direction),DoubleSide,0,Infinity).map((h:any)=>h.point.clone().applyMatrix4(wall.matrix) as Vector3).sort((a:Vector3,b:Vector3)=>b.z-a.z);
 assert.ok(hits.length);return hits[0] as Vector3;
}
const options={scale:1,lift:0,lowQuality:false};
const lamps=floodlightLayout('mild',options).filter(l=>l.row===1),twisty=floodlightLayout('twisty-twirl',options).filter(l=>l.row===1);
assert.deepEqual(lamps.map(l=>l.connector),twisty.map(l=>l.connector),'Both classic maps must share these exact measured endpoints');
const rows=lamps.map(lamp=>{
 const innerCorners=lamp.connector!.innerCorners.map(c=>[...c]),xmin=Math.min(...innerCorners.map(c=>c[0]!)),xmax=Math.max(...innerCorners.map(c=>c[0]!)),ymin=Math.min(...innerCorners.map(c=>c[1]!)),ymax=Math.max(...innerCorners.map(c=>c[1]!)),innerZ=innerCorners[0]![2]!;
 assert.ok(innerCorners.every(c=>Math.abs(c[2]!-innerZ)<1e-12),'Planar inner end required');
 const ys=[...new Set([ymin,ymax,...vertices.map(v=>v.y).filter(y=>y>ymin&&y<ymax)])].sort((a,b)=>a-b);
 const allGeometryBreakpointChecks=ys.flatMap(y=>[xmin,lamp.base.x,xmax].map(x=>{const hit=surface(x,y);return{x,y,surfaceZ:hit.z,innerZ,depth:hit.z-innerZ};}));
 // Clip every actual front-wall triangle to each complete x/y slab. A linear
 // triangle reaches its maximum penetration at one of the clipped vertices.
 const ySegments=ys.slice(0,-1).map((a,i)=>{const b=ys[i+1]!,polygons=triangles.map(t=>clipped(t,xmin,xmax,a,b)).filter(v=>v.length>=3),depths=polygons.flat().map(v=>v.z-innerZ);assert.ok(depths.length);return{minY:a,maxY:b,triangleCount:polygons.length,minDepth:Math.min(...depths),maxDepth:Math.max(...depths)};});
 const maxDepth=Math.max(...ySegments.map(s=>s.maxDepth)),minDepth=Math.min(...ySegments.map(s=>s.minDepth));
 assert.ok(minDepth>=.0149&&maxDepth<=.020,`Invalid bonded end for lamp ${lamp.id}: ${minDepth}..${maxDepth}`);
 return{x:lamp.base.x,baseZ:lamp.base.z,innerCorners,surfaceCorners:innerCorners.map(c=>surface(c[0]!,c[1]!).toArray()),allGeometryBreakpointChecks,ySegments,minDepth,maxDepth,within20mm:maxDepth<=.020};
});
const hashArray=(a:ArrayBufferView)=>createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const inputs=Object.fromEntries([sourcePath,'src/client/scene/math.ts','src/client/scene/environment/floodlights.ts','scripts/recovery/scene-collision.ts','scripts/recovery/measure-classic-floodlight-mounts.ts'].map(path=>[path,sha(path)]));
const linkPath='docs/qa/integrated-venue/identity-link.json',link=readFileSync(linkPath,'utf8');assert.ok(!link.includes(output),'This measurement must not silently change a linked proof');
const result={scope:'Measured layout inputs only; actual current Diorama RoundedBox wood sidewall and JSX position. World metres. Four front-row connectors shared by Mild and Twisty. Every actual Y breakpoint plus exact triangle clipping in each Y slab bounds the whole .30m width; max bonded end <=20mm. Compact is the same geometry under one rigid rotation. No runtime or authorization changes.',sourceSHA256:sha(sourcePath),inputs,geometry:{W:constants.WIDTH,D:constants.DEPTH,width:args[0],height:args[1],depth:args[2],segments:args[3],radius:args[4],centerY:position[1],worldMatrix:mesh.matrixWorld.toArray(),positionSHA256:hashArray(p.array),indexSHA256:ix?hashArray(ix.array):null},identityLinkUnchangedSHA256:sha(linkPath),rows};
for(const [path,hash]of Object.entries(inputs))assert.equal(sha(path),hash,'Input changed during measurement');
writeFileSync(output,JSON.stringify(result,null,2)+'\n');assert.equal(readFileSync(linkPath,'utf8'),link);
console.log(JSON.stringify({rows:rows.length,minimumDepth:Math.min(...rows.map(r=>r.minDepth)),maximumDepth:Math.max(...rows.map(r=>r.maxDepth)),sourceSHA256:result.sourceSHA256,identityLinkUnchanged:true}));
geometry.dispose();mesh.material.dispose();
