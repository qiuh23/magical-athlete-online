/** Run: node --import tsx scripts/recovery/verify-mechanism-motion.cjs [output-dir]
 * Actual React/R3F component trees and original GLBs with a no-op renderer.
 * Optional Blender images render exported evaluated meshes, not browser pixels. */
const {createRequire}=require('node:module'),path=require('node:path');
const req=createRequire(path.join(process.cwd(),'package.json'));
const React=req('react'),THREE=req('three'),assert=require('node:assert/strict');
const {readFileSync,mkdirSync,writeFileSync}=require('node:fs');
const {createRoot,extend,advance}=req('@react-three/fiber');
const {FullCoverageMechanismLayer}=req('./src/client/scene/environment/FullCoverageMechanismLayer.tsx');
const {ToyCharacter}=req('./src/client/scene/ToyCharacter.tsx');
const {boardPoint}=req('./src/client/scene/math.ts');
const {mechanismActions}=req('./src/client/scene/mechanisms/events.ts');
const {MOTION_ACTORS,MOTION_CASES,ALL_MOTION_CASES,motionFixture}=req('./qa/motion-fixtures.ts');
const out=path.resolve(process.argv[2]??'/tmp/mechanism-motion-proof');mkdirSync(out,{recursive:true});
const sourcePaths=['src/client/scene/Board3D.tsx','src/client/scene/environment/FullCoverageMechanismLayer.tsx','src/client/scene/environment/full-coverage.ts','src/client/scene/environment/event-cues.ts','src/client/scene/mechanisms/actor-bounds.ts','scripts/recovery/verify-mechanism-motion.cjs'];
const sourceHashes=()=>Object.fromEntries(sourcePaths.map(file=>[file,require('node:crypto').createHash('sha256').update(readFileSync(file)).digest('hex')]));const initialSourceHashes=sourceHashes();
globalThis.window={location:{search:'?environment=1&mechanisms=1'},addEventListener(){},removeEventListener(){}};
globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{};
globalThis.ProgressEvent=class{constructor(type,opts){Object.assign(this,{type},opts);}};
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(v=>{this.result=v;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(v=>{this.result=`data:${b.type};base64,${Buffer.from(v).toString('base64')}`;this.onloadend?.();});}};
const RequestNative=globalThis.Request;globalThis.Request=class extends RequestNative{constructor(url,opts){super(typeof url==='string'&&url.startsWith('/')?'http://review.local'+url:url,opts);}};
const requests=new Map();globalThis.fetch=async request=>{const u=new URL(typeof request==='string'?request:request.url);requests.set(u.pathname,(requests.get(u.pathname)||0)+1);const b=readFileSync(path.join(process.cwd(),'public',u.pathname));return new Response(b,{headers:{'Content-Length':String(b.length)}});};
function visible(n){for(let p=n;p;p=p.parent)if(!p.visible)return false;return true;}
function signatures(root){const result=new Map();root.traverse(n=>{if(n instanceof THREE.Mesh&&visible(n)){const position=new THREE.Vector3().setFromMatrixPosition(n.matrixWorld);result.set(n.name,{matrix:n.matrixWorld.toArray(),position:position.toArray(),morph:n.morphTargetInfluences??[]});}});return result;}
function movement(a,b){let maximum=0,changed=0;for(const [name,prev]of a){const next=b.get(name);if(!next)continue;const d=Math.max(...prev.matrix.map((n,i)=>Math.abs(n-next.matrix[i])),...prev.morph.map((n,i)=>Math.abs(n-next.morph[i])));maximum=Math.max(maximum,d);if(d>1e-6)changed++;}return {maximum,changed};}
function flatten(root){const result=new THREE.Group();root.updateWorldMatrix(true,true);root.traverse(n=>{if(!(n instanceof THREE.Mesh)||!visible(n))return;const geometry=n.geometry.clone(),positions=geometry.getAttribute('position'),v=new THREE.Vector3();for(let i=0;i<positions.count;i++){n.getVertexPosition(i,v);positions.setXYZ(i,v.x,v.y,v.z);}geometry.morphAttributes={};geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,n.material);mesh.name=n.name;mesh.matrixAutoUpdate=false;mesh.matrix.copy(n.matrixWorld);result.add(mesh);});return result;}
(async()=>{
 const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');
 extend(THREE);const canvas={width:1280,height:900,addEventListener(){},removeEventListener(){},getContext(){return{};}};
 const gl={domElement:canvas,render(){},setSize(){},setPixelRatio(){},setClearAlpha(){},getContext(){return{};},shadowMap:{},xr:{isPresenting:false,enabled:false,addEventListener(){},removeEventListener(){},setAnimationLoop(){}}};
 let state;const root=createRoot(canvas);await root.configure({gl,frameloop:'never',size:{width:1280,height:900,top:0,left:0},onCreated(s){state=s;}});
 let now=0,failures=0;const clock={now:()=>now};const tick=()=>{advance(now,false,state.get());state.scene.updateMatrixWorld(true);};
 const render=async element=>{await React.act(async()=>{root.render(element);await new Promise(r=>setTimeout(r,12));});await React.act(async()=>{await new Promise(r=>setTimeout(r,12));});tick();};
 const results=[],exports=[],issues=[],all=process.argv.includes('--all'),cases=all?ALL_MOTION_CASES:MOTION_CASES;
 const exportActors={'punch-forward':'centaur','punch-r1-forward':'blimp','punch-r1-backward':'coach','trip-native':'kraken','trip-telescopic':'hotel','gain':'banana','loss':'hog-knight-mounted','warp':'bite-mark-were'};
 for(const actor of MOTION_ACTORS)for(const scenario of cases)for(const compact of [false,true])for(const lowQuality of [false,true]){
  const f=motionFixture(scenario.id,actor.label),actions=mechanismActions(f.room.track,f.beat,f.racers),key=`${actor.label}:${scenario.id}:${compact}:${lowQuality}`;
  const p=boardPoint(f.racers[0].position,compact,f.room.track),props={track:f.room.track,compact,lowQuality,racers:f.racers,beat:{...f.beat,key},clock,startedAt:0,durationMs:1000,paused:false,reducedMotion:false,onFailure:()=>failures++,physicalVisible:()=>false};
  const tree=(extra={})=>React.createElement(React.Fragment,null,React.createElement(FullCoverageMechanismLayer,{...props,...extra,key}),React.createElement('group',{name:'proof-actor',position:[p[0],p[1]+.005,p[2]]},React.createElement(ToyCharacter,{characterId:actor.id,color:'#dc795d',lowQuality,mount:actor.mount,form:actor.form,motionEnabled:false,paused:true})));
  now=0;await render(tree());
  for(let retries=0;retries<20&&(state.scene.getObjectByName('hardware-loading-outline')||state.scene.getObjectByName('procedural-racer-fallback'));retries++)await React.act(async()=>{await new Promise(r=>setTimeout(r,20));});
  tick();assert.equal(state.scene.getObjectByName('hardware-loading-outline'),undefined,key+' actual mechanism GLB loaded');assert.equal(state.scene.getObjectByName('procedural-racer-fallback'),undefined,key+' actual actor GLB loaded');
  const actorRoot=state.scene.getObjectByName('proof-actor');let sculptures=0;actorRoot.traverse(n=>{if(n.userData.sculptureState==='ready')sculptures++;});assert.equal(sculptures,actor.mount?2:1,key+' real sculpture count');
  const expected=[...new Set(actions.map(a=>a.anchor.id))];const holders=expected.map(id=>{const list=[];state.scene.traverse(n=>{if(n.name===`coverage-active:${id}`&&visible(n))list.push(n);});assert.equal(list.length,1,key+' exactly one assembly '+id);return list[0];});
  // Count actual foot geometry at its world transform, including idle GPU batches.
  for(const holder of holders){let foot;holder.traverse(n=>{if(!foot&&n instanceof THREE.Mesh&&(n.name.includes('FOOT')||n.name==='PUNCH_ROOT__teal_fixed_batch'))foot=n;});assert.ok(foot,key+' authored fixed foot');let count=0;const matrix=new THREE.Matrix4(),world=new THREE.Matrix4();state.scene.traverse(n=>{if(!(n instanceof THREE.Mesh)||!visible(n)||n.geometry!==foot.geometry)return;const indices=n instanceof THREE.InstancedMesh?Array.from({length:n.count},(_,i)=>i):[-1];for(const i of indices){matrix.identity();if(i>=0)n.getMatrixAt(i,matrix);world.multiplyMatrices(n.matrixWorld,matrix);if(world.elements.every((value,j)=>Math.abs(value-foot.matrixWorld.elements[j])<1e-6))count++;}});assert.equal(count,1,key+' one actual visible foot including idle batches');}
  const before=holders.map(signatures),phases=[0,.22,.45,.65,.85,1],samples=[];
  const exporting=!compact&&!lowQuality&&exportActors[scenario.id]===actor.label,midTime=scenario.kind==='punch'?.22:.45;
  for(const t of phases){now=t*1000;tick();const changes=holders.map((h,i)=>movement(before[i],signatures(h)));samples.push({t,changes});
   if(exporting&&[0,midTime,1].includes(t)){const combined=new THREE.Group();for(const h of holders)combined.add(flatten(h));combined.add(flatten(actorRoot));for(const id of expected){const foundation=state.scene.getObjectByName(`display-foundation:${id}`);if(foundation)combined.add(flatten(foundation));}const file=`${scenario.id}-${actor.label}-${t}.glb`;writeFileSync(path.join(out,file),Buffer.from(await new GLTFExporter().parseAsync(combined,{binary:true})));exports.push({file,scenario:scenario.id,actor:actor.label,t,points:holders.map(h=>new THREE.Vector3().setFromMatrixPosition(h.matrixWorld).toArray()),actorPoint:p});}
  }
  const max=Math.max(...samples.flatMap(s=>s.changes.map(c=>c.maximum)));assert.ok(max>1e-5,key+' actual rendered mesh transforms changed');
  // Pause keeps precisely the evaluated world matrices, including actor selection.
  now=450;tick();const pauseBefore=holders.map(signatures);await render(tree({paused:true}));now=850;tick();holders.forEach((h,i)=>{const current=state.scene.getObjectByName(`coverage-active:${expected[i]}`);assert.ok(current&&visible(current),key+' paused holder is mounted');assert.equal(current,h,key+' ordinary paused rerender preserves holder');assert.equal(movement(pauseBefore[i],signatures(current)).maximum,0,key+' paused mounted world transforms');});
  results.push({actor:actor.label,scenario:scenario.id,layout:compact?'compact':'desktop',quality:lowQuality?'economy':'standard',sculptures,assemblies:expected.length,maxMatrixOrMorphDelta:max,samples});
 }
 // Fresh callback/registry identities are ordinary parent rerenders, not kit disposal.
 const lifecycles=[];
 for(const scenario of MOTION_CASES)for(const lowQuality of [false,true]){
  const f=motionFixture(scenario.id,'banana'),anchor=`${scenario.track}:${scenario.node}`,actions=mechanismActions(f.room.track,f.beat,f.racers),expected=[...new Set(actions.map(a=>a.anchor.id))];
  const props={track:f.room.track,compact:false,lowQuality,racers:f.racers,beat:{...f.beat,key:`lifecycle:${scenario.id}:${lowQuality}`},clock,startedAt:0,durationMs:1000,paused:false,reducedMotion:false,onFailure:()=>failures++,physicalVisible:()=>false};
  let readyCalls=0;const callbackA=()=>readyCalls++,callbackB=()=>readyCalls++,mapA=new Map(),mapB=new Map(),mapC=new Map();
  const tree=(extra={})=>React.createElement(FullCoverageMechanismLayer,{...props,...extra,key:`lifecycle:${scenario.id}:${lowQuality}`,outlets:extra.outlets??mapA,onReady:extra.onReady??callbackA});
  now=0;await render(tree());now=220;tick();await render(tree({paused:true}));
  const holders=expected.map(id=>state.scene.getObjectByName(`coverage-active:${id}`)),before=holders.map(signatures);
  assert.ok(holders.every(h=>h&&visible(h)),anchor+' lifecycle holders mounted');assert.ok(readyCalls>0,anchor+' onReady called');
  let geometryDisposals=0,materialDisposals=0,instanceDisposals=0,mixerStops=0,mixerUncaches=0;const geometries=new Set(),materials=new Set(),instances=new Set();
  state.scene.traverse(n=>{if(n instanceof THREE.Mesh){geometries.add(n.geometry);(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>materials.add(m));if(n instanceof THREE.InstancedMesh)instances.add(n);}});
  const onGeometry=()=>geometryDisposals++,onMaterial=()=>materialDisposals++,onInstance=()=>instanceDisposals++;
  geometries.forEach(g=>g.addEventListener('dispose',onGeometry));materials.forEach(m=>m.addEventListener('dispose',onMaterial));instances.forEach(n=>n.addEventListener('dispose',onInstance));
  const originalStop=THREE.AnimationMixer.prototype.stopAllAction,originalUncache=THREE.AnimationMixer.prototype.uncacheRoot;
  THREE.AnimationMixer.prototype.stopAllAction=function(...args){mixerStops++;return originalStop.apply(this,args);};THREE.AnimationMixer.prototype.uncacheRoot=function(...args){mixerUncaches++;return originalUncache.apply(this,args);};
  try{
   for(const [label,outlets,onReady]of [['registry',mapB,callbackA],['callback',mapB,callbackB],['both',mapC,()=>readyCalls++]]){
    now+=140;await render(tree({paused:true,outlets,onReady}));
    holders.forEach((holder,i)=>{const current=state.scene.getObjectByName(`coverage-active:${expected[i]}`);assert.equal(current,holder,anchor+' same live holder after '+label);assert.ok(visible(current),anchor+' live visible after '+label);assert.equal(movement(before[i],signatures(current)).maximum,0,anchor+' paused pose after '+label);});
    assert.equal(geometryDisposals+materialDisposals+instanceDisposals+mixerStops+mixerUncaches,0,anchor+' no mounted resource disposal after '+label);
    if(scenario.kind==='punch')assert.ok(outlets.has(anchor),anchor+' replacement registry has current outlet');
   }
   assert.equal(mapA.size,0,anchor+' old first registry cleaned');assert.equal(mapB.size,0,anchor+' old second registry cleaned');
   await render(tree({paused:false,outlets:mapC,onReady:callbackB}));now+=240;tick();
   assert.ok(holders.some((h,i)=>movement(before[i],signatures(state.scene.getObjectByName(`coverage-active:${expected[i]}`))).maximum>1e-5),anchor+' same mounted model resumes motion');
   assert.equal(geometryDisposals+materialDisposals+instanceDisposals+mixerStops+mixerUncaches,0,anchor+' no disposal on resume');
   lifecycles.push({scenario:scenario.id,quality:lowQuality?'economy':'standard',holderRetained:true,pausedPoseRetained:true,registriesCleaned:true,geometryDisposals,materialDisposals,instanceDisposals,mixerStops,mixerUncaches,resumedMotion:true});
  }finally{
   THREE.AnimationMixer.prototype.stopAllAction=originalStop;THREE.AnimationMixer.prototype.uncacheRoot=originalUncache;
   geometries.forEach(g=>g.removeEventListener('dispose',onGeometry));materials.forEach(m=>m.removeEventListener('dispose',onMaterial));instances.forEach(n=>n.removeEventListener('dispose',onInstance));
  }
 }
 // Exercise the actual private Pawn implementation by adding an export in memory.
 // No runtime source is rewritten and no copied/reimplemented pawn movement is used.
 const Module=require('node:module'),ts=req('typescript');req.extensions['.css']=()=>{};
 globalThis.document={createElement:()=>({width:64,height:64,getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
 const filename=path.join(process.cwd(),'src/client/scene/Board3D.tsx'),source=readFileSync(filename,'utf8')+'\nexport { Pawn as QaPawn };';
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const boardModule=new Module(filename,module);boardModule.filename=filename;boardModule.paths=Module._nodeModulePaths(path.dirname(filename));boardModule._compile(compiled,filename);const Pawn=boardModule.exports.QaPawn;
 const {GuardedCertifiedTripController,GuardedPunchController,GuardedTripController}=req('./src/client/scene/mechanisms/runtime-entry-guards.ts');
 const {MechanismActorBounds}=req('./src/client/scene/mechanisms/actor-bounds.ts');
 const boundaries=[];
 for(const id of ['wild:5','wild:17','wild:23','wild:24']){
  const f=motionFixture(id,'banana'),racers=Array.from({length:8},(_,i)=>({...f.racers[0],id:`r${i}`,characterId:MOTION_ACTORS[i].id,tripped:i===1,flags:{...('mount'in MOTION_ACTORS[i]?{hogOwnerId:'mount-owner'}:{}),...('form'in MOTION_ACTORS[i]?{form:MOTION_ACTORS[i].form}:{})}}));
  const original=structuredClone(racers),certified=new GuardedCertifiedTripController('crowded'),punch=new GuardedPunchController(),trip=new GuardedTripController(),actorBounds=new MechanismActorBounds(),sculptureReaders={current:new Map()},labels={current:new Map()};
  const base={track:f.room.track,compact:false,lowQuality:false,racers,clock,startedAt:0,durationMs:1000,paused:false,reducedMotion:false,onFailure:()=>failures++,physicalVisible:()=>false};
  const tree=(beat=f.beat,extra={})=>React.createElement(React.Fragment,null,React.createElement(FullCoverageMechanismLayer,{...base,...extra,beat,key:`crowded:${id}`}),...racers.map(racer=>React.createElement('group',{key:racer.id,name:`boundary-actor:${racer.id}`},React.createElement(Pawn,{...base,...extra,beat,racer,room:{...f.room,racers},physicalContacts:false,certified,punch,trip,actorBounds,sculptureReaders,labels,active:false,onDetail(){}}))));
  const pose=id=>{const root=state.scene.getObjectByName(`boundary-actor:${id}`).children[0],model=root.getObjectByName(`racer-model-${racers.find(r=>r.id===id).characterId}`),body=model.parent;return [...root.position.toArray(),...root.quaternion.toArray(),...root.scale.toArray(),...body.position.toArray(),...body.quaternion.toArray()];};
  now=0;await render(tree());assert.equal(state.scene.getObjectByName('procedural-racer-fallback'),undefined,id+' all eight real Pawn assets');
  const before=new Map(racers.map(r=>[r.id,pose(r.id)]));const parked=signatures(state.scene.getObjectByName(`coverage-active:${id}`));
  now=900;tick();assert.ok(pose('r0').some((x,i)=>Math.abs(x-before.get('r0')[i])>1e-5),id+' actual target Pawn moves/falls');
  for(const r of racers.slice(1))assert.deepEqual(pose(r.id),before.get(r.id),id+' actual bystander Pawn root/body stays unchanged '+r.id);
  assert.deepEqual(racers,original,id+' render never mutates authoritative racers');
  assert.deepEqual(mechanismActions(f.room.track,f.beat,racers).flatMap(a=>a.targets),['r0'],id+' new target only');
  const replay={...f.beat,key:f.beat.key+':replay'};now=0;await render(tree(replay));assert.equal(movement(parked,signatures(state.scene.getObjectByName(`coverage-active:${id}`))).maximum,0,id+' distinct beat starts parked');now=450;tick();assert.ok(movement(parked,signatures(state.scene.getObjectByName(`coverage-active:${id}`))).maximum>1e-5,id+' distinct beat replays');
  await render(tree(replay,{reducedMotion:true}));assert.equal(movement(parked,signatures(state.scene.getObjectByName(`coverage-active:${id}`))).maximum,0,id+' reduced motion parks device');
  const next={...f.beat,key:f.beat.key+':after-reduced'};now=0;await render(tree(next));now=220;tick();assert.ok(movement(parked,signatures(state.scene.getObjectByName(`coverage-active:${id}`))).maximum>1e-5,id+' next beat restores device motion');
  boundaries.push({anchor:id,actualPawns:8,alreadyDown:1,targetMoved:true,residentRootBodyUnchanged:true,replay:true,reducedMotion:true});
 }
 assert.equal(failures,0);assert.equal(results.length,8*cases.length*4);
 await React.act(async()=>root.unmount());
 assert.deepEqual(sourceHashes(),initialSourceHashes,'runtime source remained unchanged during this verification run');
 const report={scope:`${results.length} actual mounted React/R3F device and ToyCharacter component combinations; no-op renderer. Original GLBs loaded. Exported evaluated meshes are offline art, not browser screenshots or collision certification.`,results,boundaries,lifecycles,sourceHashes:initialSourceHashes,exports,assetRequests:[...requests],issues};writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log(`PASS ${results.length} mounted combinations, 8 real actors, ${cases.length} real-engine scenarios, 2 layouts, 2 quality tiers; one assembly per action anchor; real mesh transforms change; pause freezes. ${exports.length} offline frame GLBs. ${out}`);
})().catch(e=>{console.error(e);process.exitCode=1;});
