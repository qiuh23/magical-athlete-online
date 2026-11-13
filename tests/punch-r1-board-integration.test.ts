import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { Vector3 } from 'three';
import { CHARACTERS } from '../src/shared/characters.js';
import type { Racer } from '../src/shared/types.js';
import type { PresentationBeat } from '../src/client/presentation.js';
import { environmentAllowsPhysicalContact } from '../src/client/scene/environment/layout.js';
import { mechanismActions, mechanismAnchors } from '../src/client/scene/mechanisms/events.js';
import { pawnRoute } from '../src/client/scene/pawn-motion.js';
import { punchWindRoute } from '../src/client/scene/environment/force-presentation.js';
import { boardPoint } from '../src/client/scene/math.js';

const source=readFileSync('src/client/scene/Board3D.tsx','utf8');
const ast=ts.createSourceFile('Board3D.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const coverageSource=readFileSync('src/client/scene/environment/FullCoverageMechanismLayer.tsx','utf8');
const coverageAst=ts.createSourceFile('FullCoverageMechanismLayer.tsx',coverageSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function nodes<T extends ts.Node>(root:ts.Node,predicate:(node:ts.Node)=>node is T):T[]{const result:T[]=[];const visit=(node:ts.Node)=>{if(predicate(node))result.push(node);ts.forEachChild(node,visit);};visit(root);return result;}
function attr(element:ts.JsxSelfClosingElement,name:string){return element.attributes.properties.find((p):p is ts.JsxAttribute=>ts.isJsxAttribute(p)&&p.name.getText()===name);}
function hasAncestor(node:ts.Node,predicate:(node:ts.Node)=>boolean){for(let parent=node.parent;parent;parent=parent.parent)if(predicate(parent))return true;return false;}
const compact=(s:string)=>s.replace(/\s+/g,'');

// The exact historical R1 controller/certificate tests remain in their own
// files. These assertions concern which hardware consumer the current board mounts.
test('rebuilt boards have one universal hardware owner and never mount moved contact-certified rigs',()=>{
 assert.ok(source.startsWith("import './asset-loading.js';"));
 const elements=nodes(ast,ts.isJsxSelfClosingElement);
 const coverage=elements.filter(n=>n.tagName.getText(ast)==='FullCoverageMechanismLayer');assert.equal(coverage.length,1);
 assert.ok(hasAncestor(coverage[0]!,n=>ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.AmpersandAmpersandToken&&n.getText(ast).includes('environmentCandidate')));
 assert.equal(elements.filter(n=>['R1PunchLayer','RevalidatedMechanismLayer','RevalidatedTripLayer','RevalidatedFoundations'].includes(n.tagName.getText(ast))).length,0);
 assert.equal(environmentAllowsPhysicalContact(true),false,'legacy contact layers are off in rebuilt scenes');
 for(const name of ['MechanismLayer','CertifiedTripLayer']){
  const layer=elements.find(n=>n.tagName.getText(ast)===name);assert.ok(layer);
  assert.ok(hasAncestor(layer,n=>ts.isBinaryExpression(n)&&n.left.getText(ast)==='physicalContacts'));
 }
 const visible=attr(coverage[0]!,'physicalVisible')?.initializer;assert.ok(visible&&ts.isJsxExpression(visible)&&visible.expression&&ts.isArrowFunction(visible.expression));
 assert.equal(visible.expression.body.kind,ts.SyntaxKind.FalseKeyword,'an obsolete contact certificate cannot hide display hardware');
});

test('each hardware category has an independent asset loader and failure boundary',()=>{
 const maps=nodes(coverageAst,ts.isCallExpression).filter(n=>n.expression.getText(coverageAst)==='variants.map');assert.equal(maps.length,1);
 const loader=nodes(coverageAst,ts.isCallExpression).find(n=>n.expression.getText(coverageAst)==='useGLTF');assert.ok(loader);
 assert.ok(ts.isElementAccessExpression(loader.arguments[0]!));assert.equal(loader.arguments[0]!.getText(coverageAst),'DISPLAY_URLS[variant]');
 const loaded=nodes(coverageAst,ts.isJsxSelfClosingElement).find(n=>n.tagName.getText(coverageAst)==='LoadedKind');assert.ok(loaded);
 for(const name of ['Suspense','KindBoundary'])assert.ok(hasAncestor(loaded,n=>ts.isJsxElement(n)&&n.openingElement.tagName.getText(coverageAst)===name));
 const activeIds=nodes(coverageAst,ts.isVariableDeclaration).find(n=>n.name.getText(coverageAst)==='activeIds');assert.ok(activeIds?.initializer);
 assert.doesNotMatch(activeIds.initializer.getText(coverageAst),/characterId|hash|fingerprint|actionAllowed|certificate/);
 assert.match(activeIds.initializer.getText(coverageAst),/actions\.map/);
});

test('valid tile actions include every character, new shapes, forms, mounts and crowded target groups',()=>{
 const gain=mechanismAnchors('wild').find(a=>a.kind==='gain')!;
 const identities=[...CHARACTERS.map(c=>c.id),'future-unlisted-character'];
 for(const characterId of identities)for(const flags of [{},{form:'alternate-form'},{hogOwnerId:'mount-owner'},{form:'alternate-form',hogOwnerId:'mount-owner'}]){
  const racer=(id:string,position:number,tripped=false):Racer=>({id,playerId:id,characterId,position,tripped,finished:false,eliminated:false,flags:{...flags}});
  const residents=[racer('target',24),racer('old',24),racer('already-down',24,true)];
  const punch:PresentationBeat={key:'arrow',kind:'move',targets:['target'],motions:[{racerId:'target',from:24,to:22,path:[24,23,22]}],events:[{id:1,type:'move',cause:'track-arrow',source:'target',targets:['target'],before:[24],after:[22],paths:[[24,23,22]],text:'arrow'}],durationMs:1600};
  const before=JSON.stringify(residents);const action=mechanismActions('wild',punch,residents);
  assert.equal(action.length,1,characterId);assert.deepEqual(action[0]!.targets,['target']);assert.deepEqual(action[0]!.motions[0]!.path,[24,23,22]);assert.equal(JSON.stringify(residents),before);
  const fallen=residents.map(r=>({...r,tripped:true}));assert.equal(mechanismActions('wild',punch,fallen).length,1,'an arrow can move a fallen racer');
  const trip:PresentationBeat={key:'trip',kind:'trip',targets:['target','old','already-down'],motions:[],events:[{id:2,type:'trip',source:'track',targets:['target','old','already-down'],text:'trip'}],durationMs:1600};
  assert.deepEqual(mechanismActions('wild',trip,residents.map(r=>({...r,position:5})))[0]!.targets,['target','old'],'only newly fallen targets are included');
  for(const [track,node,kind,delta]of [['wild',gain.node,'gain',2],['squiggle',23,'loss',-2]] as const){
   const score:PresentationBeat={key:kind,kind:'score',targets:['target'],motions:[],events:[{id:3,type:'score',source:'target',cause:'track-star',boardPosition:node,scoreDelta:delta,text:'score'}],durationMs:1600};
   assert.equal(mechanismActions(track,score,[racer('target',node)])[0]?.anchor.kind,kind);
  }
  const warp:PresentationBeat={key:'warp',kind:'warp',targets:['target'],motions:[{racerId:'target',from:3,to:5,path:[3,5]}],events:[{id:4,type:'warp',cause:'track-whirl',source:'target',targets:['target'],before:[3],after:[5],text:'warp'}],durationMs:1600};
  assert.deepEqual(mechanismActions('whirly-world',warp,[racer('target',3),racer('old',5)]).map(a=>[a.anchor.node,a.targets]),[[3,['target']],[5,['target']]]);
 }
});

test('punch presentation changes timing only and follows the authoritative path with no R1 spatial offset',()=>{
 const pawn=nodes(ast,ts.isFunctionDeclaration).find(n=>n.name?.text==='Pawn');assert.ok(pawn);
 const route=nodes(pawn,ts.isVariableDeclaration).find(n=>n.name.getText(ast)==='route');assert.ok(route?.initializer);assert.match(route.initializer.getText(ast),/motion\.path\.map/);
 const call=nodes(pawn,ts.isCallExpression).filter(n=>n.expression.getText(ast)==='route!.getPointAt');assert.equal(call.length,1);assert.deepEqual(call[0]!.arguments.map(n=>n.getText(ast)),['fraction','walkPoint']);
 const positionWrites=nodes(pawn,ts.isBinaryExpression).filter(n=>n.operatorToken.kind===ts.SyntaxKind.EqualsToken&&['x','z'].includes(n.left.getText(ast))&&n.right.getText(ast).startsWith('walkPoint.'));
 assert.deepEqual(positionWrites.map(n=>compact(n.getText(ast))).sort(),['x=walkPoint.x','z=walkPoint.z']);
 assert.doesNotMatch(pawn.getText(ast),/r1ActorPosition|r1Progress|r1Bind|requestAnimationFrame|setInterval/);
 for(const [track,path] of [['wild',[24,23,22]],['boardwalks',[8,31,32]]] as const)for(const compactLayout of [false,true]){
  const input=path.map(node=>boardPoint(node,compactLayout,track)),route=pawnRoute(input,true),before=JSON.stringify(input),point=new Vector3();
  assert.deepEqual(route.points.map(p=>p.toArray()),input);
  for(const t of [0,.1,.22,.48])assert.ok(route.getPointAt(punchWindRoute(t),point).distanceTo(new Vector3(...input[0]!))<1e-9);
  assert.ok(route.getPointAt(punchWindRoute(1),point).distanceTo(new Vector3(...input.at(-1)!))<1e-9);
  assert.equal(JSON.stringify(input),before);
 }
});

test('Pawn supplies current geometry for sweep planning without a character identity gate',()=>{
 const pawn=nodes(ast,ts.isFunctionDeclaration).find(n=>n.name?.text==='Pawn')!;
 const bindings=nodes(pawn,ts.isCallExpression).filter(n=>n.expression.getText(ast)==='actorBounds.bind');assert.equal(bindings.length,1);assert.deepEqual(bindings[0]!.arguments.map(n=>n.getText(ast)),['racer.id','body.current']);
 const display=nodes(ast,ts.isJsxSelfClosingElement).find(n=>n.tagName.getText(ast)==='FullCoverageMechanismLayer')!;
 assert.doesNotMatch(display.getText(ast),/characterId|hash|fingerprint|certified/);
 assert.ok(attr(display,'actorBounds'),'the sweep must inspect current geometry instead of using a role whitelist');
 const cues=nodes(ast,ts.isJsxSelfClosingElement).find(n=>n.tagName.getText(ast)==='EnvironmentEventCues')!;assert.ok(attr(cues,'actorBounds'));assert.ok(attr(cues,'outlets'));
});
