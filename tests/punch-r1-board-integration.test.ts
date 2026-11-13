import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source=readFileSync('src/client/scene/Board3D.tsx','utf8');
const ast=ts.createSourceFile('Board3D.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function nodes<T extends ts.Node>(predicate:(node:ts.Node)=>node is T):T[]{const result:T[]=[];const visit=(node:ts.Node)=>{if(predicate(node))result.push(node);ts.forEachChild(node,visit);};visit(ast);return result;}
const compact=(s:string)=>s.replace(/\s+/g,'');

test('actual Pawn has one shared r1 world-position call, no duplicate stride or compact rotation in its branch',()=>{
 const calls=nodes(ts.isCallExpression).filter(n=>n.expression.getText(ast)==='r1ActorPosition');assert.equal(calls.length,1);
 assert.deepEqual(calls[0]!.arguments.map(n=>n.getText(ast)),['route!','fraction','count','walkPoint']);
 const branch=nodes(ts.isIfStatement).find(n=>compact(n.expression.getText(ast))==='r1Progress!==undefined');assert.ok(branch);
 const body=compact(branch.thenStatement.getText(ast));assert.ok(body.includes('x=walkPoint.x;y=walkPoint.y;z=walkPoint.z;'));assert.doesNotMatch(body,/strideLift|\.005|rotation|Math\.PI/);
 const variable=nodes(ts.isVariableDeclaration).find(n=>n.name.getText(ast)==='fraction'&&n.initializer?.getText(ast).includes('r1Progress'));
 assert.equal(compact(variable!.initializer!.getText(ast)),'r1Progress??punch.route(t,racer.id)??(punchWind?punchWindRoute(t):strideProgress(t))');
 assert.match(source,/body\.current\.rotation\.set\(tilt, swing\+\(compact&&punch\.protects/);assert.doesNotMatch(source,/compact&&r1\.protects/);
});

test('actual Board rejects the old r1 contact mount in rebuilt scenes and retains its strict clock wiring',()=>{
 assert.ok(source.startsWith("import './asset-loading.js';"));
 const input=nodes(ts.isVariableDeclaration).find(n=>n.name.getText(ast)==='r1Input')!;assert.ok(input.initializer&&ts.isObjectLiteralExpression(input.initializer));
 const properties=input.initializer.properties.filter(ts.isPropertyAssignment),available=properties.find(n=>n.name.getText(ast)==='available')!;
 assert.equal(compact(available.initializer.getText(ast)),"!environmentCandidate&&sceneMechanisms&&mechanismLoad==='ready'&&certified.ready&&!r1Failed");
 const layer=nodes(ts.isJsxSelfClosingElement).find(n=>n.tagName.getText(ast)==='R1PunchLayer')!;
 const attrs=Object.fromEntries(layer.attributes.properties.filter(ts.isJsxAttribute).map(a=>[a.name.getText(ast),a.initializer?.getText(ast)]));
 assert.equal(attrs.clock,'{clock}');assert.equal(attrs.paused,'{paused}');assert.equal(attrs.input,'{r1Input}');assert.equal(attrs.key,'{r1Scope}');
 assert.match(source,/r1Scope=`\$\{contactScope\}:r1:\$\{environmentRetry\}:\$\{mechanismRetry\}:\$\{resetKey\}`/);
 assert.match(source,/clearR1Cache\(\)/);assert.match(source,/setR1Failure\(''\)/);assert.match(source,/clearParkedFallbackCache\(\)/);
 // Pause is not loss of scene readiness: an already-running identical Trip freezes.
 assert.match(source,/!!certified\.active&&certified\.active\.key===beat\?\.key/);
});

test('actual Pawn broadcasts the real snapshot with generation protection and invalidates both consumers',()=>{
 assert.match(source,/captureActorGeometry\(body\.current\)/);assert.match(source,/snapshot\.requiresSkeletonFreeze/);
 assert.match(source,/captureGeneration\.current===generation&&captureKey\.current===current/);
 assert.match(source,/r1\.acceptActor\(racer\.id,hash,snapshot\)/);assert.match(source,/r1\.invalidateActor\(racer\.id\)/);
 assert.match(source,/\[certified,r1,racer\.id\]/);
 assert.match(source,/motionEnabled=\{!displayTrip&&!certifiedBind&&!r1Bind&&!r1\.protects/);
 assert.match(source,/swing = reducedMotion\|\|r1\.protects/);
 const pawn=nodes(ts.isFunctionDeclaration).find(node=>node.name?.text==='Pawn')!;assert.doesNotMatch(pawn.getText(ast),/requestAnimationFrame|setInterval/);
});
