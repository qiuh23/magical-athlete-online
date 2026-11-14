import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {BOARD_CENTER_SPAN,TILE} from '../src/client/scene/math.js';
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
 assert.equal(createHash('sha256').update(a.color).digest('hex'),'4044a48d1a64c453b8248ddb24f5bade39ca9d575ee9eeeffe46b45c1e09714f');
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
test('actual turf mesh keeps its bounded rounded surface and original playing height',()=>{
 const path='src/client/scene/DioramaStadium.tsx',source=readFileSync(path,'utf8');
 const ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const constants:Record<string,number>={TILE};
 const numeric=(node:ts.Expression):number=>{
  if(ts.isNumericLiteral(node))return Number(node.text);
  if(ts.isParenthesizedExpression(node))return numeric(node.expression);
  if(ts.isIdentifier(node)&&node.text in constants)return constants[node.text]!;
  if(ts.isPropertyAccessExpression(node)&&node.expression.getText(ast)==='BOARD_CENTER_SPAN'){
   assert.ok(node.name.text==='width'||node.name.text==='depth');return BOARD_CENTER_SPAN[node.name.text];
  }
  if(ts.isPrefixUnaryExpression(node)&&node.operator===ts.SyntaxKind.MinusToken)return -numeric(node.operand);
  if(ts.isBinaryExpression(node)){
   const a=numeric(node.left),b=numeric(node.right);
   if(node.operatorToken.kind===ts.SyntaxKind.PlusToken)return a+b;
   if(node.operatorToken.kind===ts.SyntaxKind.MinusToken)return a-b;
   if(node.operatorToken.kind===ts.SyntaxKind.AsteriskToken)return a*b;
  }
  throw Error('Unreviewed turf geometry expression: '+node.getText(ast));
 };
 const visit=(node:ts.Node,fn:(node:ts.Node)=>void)=>{fn(node);node.forEachChild(child=>visit(child,fn));};
 let box:number[]|undefined,position:number[]|undefined,scale:number[]|undefined;
 visit(ast,node=>{
  if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&['WIDTH','DEPTH'].includes(node.name.text)){
   assert.ok(node.initializer);constants[node.name.text]=numeric(node.initializer);
  }
  if(ts.isPropertyAssignment(node)&&node.name.getText(ast)==='box'){
   assert.equal(box,undefined);assert.ok(ts.isNewExpression(node.initializer));
   assert.equal(node.initializer.expression.getText(ast),'RoundedBoxGeometry');box=node.initializer.arguments?.map(numeric);
  }
  if(!ts.isJsxSelfClosingElement(node)||node.tagName.getText(ast)!=='Box')return;
  const attribute=(name:string)=>node.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.getText(ast)===name) as ts.JsxAttribute|undefined;
  const material=attribute('material')?.initializer;
  if(!material||!ts.isJsxExpression(material)||material.expression?.getText(ast)!=='kit.turf')return;
  assert.equal(position,undefined,'Exactly one continuous turf surface');
  const array=(name:string)=>{const value=attribute(name)?.initializer;assert.ok(value&&ts.isJsxExpression(value)&&value.expression&&ts.isArrayLiteralExpression(value.expression));return value.expression.elements.map(item=>numeric(item as ts.Expression));};
  position=array('position');scale=array('scale');assert.equal(attribute('rotation'),undefined);
 });
 assert.deepEqual(box,[1,1,1,2,.1]);assert.deepEqual(position,[0,.11,0]);
 assert.deepEqual(scale,[BOARD_CENTER_SPAN.width+TILE*1.95-.55,.08,BOARD_CENTER_SPAN.depth+TILE*2.05-.55]);
 assert.match(source,/return <mesh geometry=\{kit\.box\} material=\{material\} position=\{position\} scale=\{scale\}/);
 const geometry=new RoundedBoxGeometry(...box as [number,number,number,number,number]);
 geometry.scale(...scale as [number,number,number]);geometry.translate(...position as [number,number,number]);geometry.computeBoundingBox();
 assert.ok(Math.abs(geometry.boundingBox!.max.y-.15)<1e-7);assert.ok(Math.abs(geometry.boundingBox!.min.y-.07)<1e-7);geometry.dispose();
});

test('fine colour and normal variation stays subtle without flattening mower direction',()=>{
 const {color,normal}=stadiumTurfPixels();
 // Neighbor differences after removing the deliberate broad mower signal.
 // v2 measured 2.585 green, 13.269 normal-X, 8.858 normal-Y byte RMS.
 const rms=(bytes:Uint8Array,channel:number,bandScale=0)=>{
  let sum=0,count=0;
  for(let y=1;y<height;y++)for(let x=0;x<width;x++){
   const bandDelta=stadiumMowDirection(x/(width-1),y/(height-1))-stadiumMowDirection(x/(width-1),(y-1)/(height-1));
   const delta=bytes[(y*width+x)*4+channel]!-bytes[((y-1)*width+x)*4+channel]!-bandScale*bandDelta;
   sum+=delta*delta;count++;
  }
  return Math.sqrt(sum/count);
 };
 const green=rms(color,1,11.5),nx=rms(normal,0),ny=rms(normal,1,127.5*.085);
 assert.ok(green>.4&&green<1,`green residual RMS ${green}`);
 assert.ok(nx>2&&nx<4,`normal-X residual RMS ${nx}`);
 assert.ok(ny>1&&ny<3,`normal-Y residual RMS ${ny}`);
});
