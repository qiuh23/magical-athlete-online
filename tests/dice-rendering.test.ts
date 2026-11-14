import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as THREE from 'three';
import {createDicePips,DiceThrowPlayback} from '../src/client/scene/dice-rendering.js';
import {PresentationClock,wallPresentationClock} from '../src/client/presentation-clock.js';
import {diceTopRotation} from '../src/client/scene/math.js';
import {beatCompletionTime,diceResultReadMs,type PresentationBeat} from '../src/client/presentation.js';

const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('merged pips retain every original sphere vertex, normal, index and colour',()=>{
  const kit=createDicePips(),sphere=new THREE.SphereGeometry(.065,12,8);
  // Independent reference is the pre-optimization JSX, including face orientation.
  const patterns:Record<number,number[][]>={1:[[0,0]],2:[[-.24,.24],[.24,-.24]],3:[[-.24,.24],[0,0],[.24,-.24]],4:[[-.24,.24],[.24,.24],[-.24,-.24],[.24,-.24]],5:[[-.24,.24],[.24,.24],[0,0],[-.24,-.24],[.24,-.24]],6:[[-.24,.26],[.24,.26],[-.24,0],[.24,0],[-.24,-.26],[.24,-.26]]};
  const sides:[number,number[],number[]][]=[[1,[0,.501,0],[-Math.PI/2,0,0]],[6,[0,-.501,0],[Math.PI/2,0,0]],[2,[0,0,.501],[0,0,0]],[5,[0,0,-.501],[0,Math.PI,0]],[3,[.501,0,0],[0,Math.PI/2,0]],[4,[-.501,0,0],[0,-Math.PI/2,0]]];
  const offsets={red:0,dark:0};
  for(const [value,position,rotation] of sides)for(const [x,y] of patterns[value]!){
    const group=new THREE.Group(),mesh=new THREE.Mesh(sphere);group.position.fromArray(position);group.rotation.set(rotation[0]!,rotation[1]!,rotation[2]!);mesh.position.set(x!,y!,.005);mesh.scale.set(1,1,.28);group.add(mesh);group.updateMatrixWorld(true);
    const name=value===1?'red':'dark',geometry=name==='red'?kit.redGeometry:kit.darkGeometry,offset=offsets[name],reference=sphere.clone().applyMatrix4(mesh.matrixWorld);
    for(const attribute of ['position','normal','uv']){const a=geometry.getAttribute(attribute),b=reference.getAttribute(attribute);for(let i=0;i<b.array.length;i++)close(a.array[offset*a.itemSize+i]!,b.array[i]!);}
    for(let i=0;i<sphere.index!.count;i++)assert.equal(geometry.index!.getX(offset/sphere.attributes.position!.count*sphere.index!.count+i),sphere.index!.getX(i)+offset);
    offsets[name]+=sphere.attributes.position!.count;reference.dispose();
  }
  assert.equal(offsets.red,sphere.attributes.position!.count);assert.equal(offsets.dark,20*sphere.attributes.position!.count);
  assert.equal(kit.redMaterial.color.getHexString(),'ed6149');assert.equal(kit.darkMaterial.color.getHexString(),'253e50');
  for(const m of [kit.redMaterial,kit.darkMaterial]){assert.equal(m.roughness,.5);assert.equal(m.metalness,0);assert.equal(m.transparent,false);}
  kit.dispose();sphere.dispose();
});

test('playback starts on a drawable frame and only acknowledges a rendered endpoint once',()=>{
  const p=new DiceThrowPlayback();assert.equal(p.afterRender(),false);
  assert.equal(p.sample(5000,1500,false),0);assert.equal(p.sample(5750,1500,false),.5);assert.equal(p.afterRender(),false);
  assert.equal(p.sample(6500,1500,false),1);assert.equal(p.acknowledged,false);assert.equal(p.afterRender(),true);assert.equal(p.afterRender(),false);
  assert.equal(new DiceThrowPlayback().sample(9000,1500,true),1);
});

/** Execute shipping JSX, hooks, useFrame and scene.onAfterRender with deterministic
 * scheduling. This proves CPU lifecycle/mesh counts, not browser layout or FPS. */
function spotlight(options:{count?:number;paired?:boolean;reduced?:boolean}={}){
  let now=0,id=0,current='root',cursor=0,dirty=false;
  const instances=new Map<string,{slots:any[];deps:any[][];cleanup:Map<number,()=>void>}>(),pending:(()=>void)[]=[],frames=new Map<string,{priority:number;fn:()=>void}>();
  const rafs=new Map<number,()=>void>(),timers=new Map<number,{at:number;fn:()=>void}>(),announced:string[]=[];
  const listeners=new Map<string,Function>();const gl={domElement:{addEventListener:(name:string,fn:Function)=>listeners.set(name,fn),removeEventListener:(name:string)=>listeners.delete(name)}};
  const pageListeners=new Map<string,Function>(),windowListeners=new Map<string,Function>();const document={hidden:false,addEventListener:(name:string,fn:Function)=>pageListeners.set(name,fn),removeEventListener:(name:string)=>pageListeners.delete(name)};const window={addEventListener:(name:string,fn:Function)=>windowListeners.set(name,fn),removeEventListener:(name:string)=>windowListeners.delete(name)};
  const scene=new THREE.Scene();let previousDraws=0;scene.onAfterRender=()=>{previousDraws++;};const original=scene.onAfterRender;
  const instance=()=>instances.get(current)!;
  const same=(a:any[]|undefined,b:any[])=>!!a&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
  const jsx=(type:any,props:any)=>({type,props});
  const react={
    useState:(initial:any)=>{const state=instance(),at=cursor++;if(!(at in state.slots))state.slots[at]=typeof initial==='function'?initial():initial;return [state.slots[at],(value:any)=>{const next=typeof value==='function'?value(state.slots[at]):value;if(!Object.is(next,state.slots[at])){state.slots[at]=next;dirty=true;}}];},
    useRef:(initial:any)=>{const state=instance(),at=cursor++;return state.slots[at]??(state.slots[at]={current:initial});},
    useMemo:(fn:()=>any,deps:any[])=>{const state=instance(),at=cursor++;if(!same(state.deps[at],deps)){state.slots[at]=fn();state.deps[at]=deps;}return state.slots[at];},
    useCallback:(fn:any,deps:any[])=>react.useMemo(()=>fn,deps),
    useEffect:(fn:()=>any,deps:any[])=>{const state=instance(),at=cursor++;if(!same(state.deps[at],deps)){state.deps[at]=deps;pending.push(()=>{state.cleanup.get(at)?.();const done=fn();if(done)state.cleanup.set(at,done);else state.cleanup.delete(at);});}},
  };
  const exports:Record<string,any>={};const source=readFileSync('src/client/scene/DiceSpotlight.tsx','utf8')+'\nexport {Die as TestDie,DiceFrameGate as TestGate};';
  const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  function Canvas(){}function SceneBoundary(){}function RoundedBox(){}
  const require=(name:string)=>name==='react'?react:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='three'?THREE:name==='@react-three/fiber'?{Canvas,useThree:()=>({scene,gl,invalidate:()=>{}}),useFrame:(fn:()=>void,priority=0)=>frames.set(current,{fn,priority})}:name==='@react-three/drei'?{RoundedBox}:name.endsWith('presentation-clock.js')?{wallPresentationClock}:name.endsWith('dice-rendering.js')?{createDicePips,DiceThrowPlayback}:name.endsWith('math.js')?{diceTopRotation}:name.endsWith('SceneBoundary.js')?{SceneBoundary}:{};
  vm.runInNewContext(code,{exports,require,document,window,setTimeout:(fn:()=>void,ms:number)=>{timers.set(++id,{at:now+ms,fn});return id;},clearTimeout:(key:number)=>timers.delete(key),requestAnimationFrame:(fn:()=>void)=>{rafs.set(++id,fn);return id;},cancelAnimationFrame:(key:number)=>rafs.delete(key)});
  const clock=new PresentationClock(()=>now),count=options.count??1;
  const props:any={active:true,beatKey:'roll:1',face:5,faces:count>1?Array.from({length:count},(_,i)=>i+1):undefined,contenders:options.paired?[{racerId:'a',characterId:'coach',name:'A',face:2},{racerId:'b',characterId:'banana',name:'B',face:6}]:undefined,startedAt:0,durationMs:options.paired?3000:count>1?3600:2500,resultReadMs:options.paired?1500:count>1?1800:1000,reducedMotion:!!options.reduced,lowQuality:false,source:'A',onDetail:()=>{},onSettled:(key:string)=>announced.push(key),clock};
  let tree:any,dieTrees:any[]=[];
  function mount(name:string,fn:(props:any)=>any,p:any){current=name;cursor=0;if(!instances.has(name))instances.set(name,{slots:[],deps:[],cleanup:new Map()});return fn(p);}
  function walk(node:any,predicate:(node:any)=>boolean,out:any[]=[]){if(!node)return out;if(Array.isArray(node)){node.forEach(n=>walk(n,predicate,out));return out;}if(typeof node!=='object')return out;if(predicate(node))out.push(node);walk(node.props?.children,predicate,out);return out;}
  function render(){let safety=0;do{dirty=false;tree=mount('root',exports.DiceSpotlight,props);const gate=walk(tree,n=>n.type===exports.TestGate)[0];if(gate)mount('gate',exports.TestGate,gate.props);else if(instances.has('gate')){instances.get('gate')!.cleanup.forEach(fn=>fn());instances.delete('gate');frames.delete('gate');}dieTrees=walk(tree,n=>n.type===exports.TestDie).map((node,index)=>{const result=mount(`die:${index}`,exports.TestDie,node.props);result.props.ref.current??=new THREE.Group();return result;});while(pending.length)pending.shift()!();assert.ok(++safety<15);}while(dirty);return tree;}
  render();
  const tick=(ms:number)=>{now+=ms;for(const [key,timer] of [...timers])if(timer.at<=now){timers.delete(key);timer.fn();}if(dirty)render();};
  return {props,announced,clock,render,tree:()=>tree,dieTrees:()=>dieTrees,canvas:()=>walk(tree,n=>n.type===Canvas)[0],boundary:()=>walk(tree,n=>n.type===SceneBoundary)[0],tick,
    frame:(ms=0)=>{tick(ms);[...frames.values()].sort((a,b)=>a.priority-b.priority).forEach(f=>f.fn());(scene.onAfterRender as Function).call(scene);if(dirty)render();},
    raf:()=>{const jobs=[...rafs.values()];rafs.clear();jobs.forEach(fn=>fn());if(dirty)render();},
    unmount:()=>{instances.forEach(state=>state.cleanup.forEach(fn=>fn()));assert.equal(scene.onAfterRender,original);},
    visibility:(hidden:boolean)=>{document.hidden=hidden;pageListeners.get('visibilitychange')?.();},pageshow:()=>windowListeners.get('pageshow')?.(),loseContext:()=>listeners.get('webglcontextlost')?.({preventDefault(){}}),now:()=>now,draws:()=>previousDraws};
}

for(const scenario of [{count:1},{count:2},{count:6},{paired:true}])test(`shipping ${JSON.stringify(scenario)} dice: first visible frame, final paint, demand read window and repeat`,()=>{
  const h=spotlight(scenario),count=scenario.paired?2:scenario.count!;
  const throwMs=Math.min(scenario.paired?1800:h.props.durationMs,h.props.durationMs-h.props.resultReadMs);
  h.tick(1000);assert.equal(h.tree().props['data-up-face'],'');assert.equal(h.canvas().props.frameloop,'always');
  h.frame();for(const die of h.dieTrees())assert.notEqual(die.props.ref.current.position.y,0);
  h.frame(throwMs/2);assert.equal(h.canvas().props.frameloop,'always');assert.deepEqual(h.announced,[]);
  h.frame(throwMs/2);assert.equal(h.canvas().props.frameloop,'demand');assert.equal(h.dieTrees().length,count);
  for(const die of h.dieTrees()){assert.equal(die.props.children.length,3);close(die.props.ref.current.position.y,.44);const pips=die.props.children.slice(1);assert.ok(pips.every((mesh:any)=>mesh.props.geometry&&mesh.props.material&&mesh.props.dispose===null));}
  h.raf();assert.deepEqual(h.announced,[]);h.raf();assert.deepEqual(h.announced,['roll:1']);
  const beat={kind:scenario.paired?'duel-dice':'dice',faces:h.props.faces} as PresentationBeat;const settledAt=h.now();
  assert.equal(diceResultReadMs(beat),h.props.resultReadMs);assert.equal(beatCompletionTime(beat,0,h.props.durationMs,settledAt),settledAt+h.props.resultReadMs);
  h.tick(h.props.resultReadMs-1);assert.equal(h.canvas().props.frameloop,'demand');
  h.props.beatKey='roll:2';h.props.startedAt=h.now();h.render();assert.equal(h.canvas().props.frameloop,'always');assert.equal(h.tree().props['data-up-face'],'');
  h.frame();h.frame(throwMs);h.raf();h.raf();assert.deepEqual(h.announced,['roll:1','roll:2']);h.unmount();
});

test('actual pause freezes throw; skip cancels acknowledgement; new dice do not inherit terminal state',()=>{
  const h=spotlight();h.frame();h.frame(500);const before=h.dieTrees()[0].props.ref.current.position.clone();
  h.clock.setPaused(true);h.props.paused=true;h.render();h.frame(5000);assert.ok(before.equals(h.dieTrees()[0].props.ref.current.position));assert.equal(h.canvas().props.frameloop,'demand');assert.deepEqual(h.announced,[]);
  h.clock.setPaused(false);h.props.paused=false;h.render();h.frame(1000);assert.equal(h.canvas().props.frameloop,'demand');h.raf();
  h.props.active=false;h.props.beatKey=undefined;h.render();h.raf();assert.deepEqual(h.announced,[]);assert.equal(h.canvas().props.frameloop,'never');
  h.props.active=true;h.props.beatKey='new';h.render();assert.equal(h.canvas().props.frameloop,'always');h.unmount();
});

test('reduced motion remains immediate and hidden-tab RAF wake keeps one result acknowledgement',()=>{
  const h=spotlight({count:6,reduced:true});assert.equal(h.canvas().props.frameloop,'demand');h.frame();
  h.tick(10000);assert.deepEqual(h.announced,[]);h.raf();h.raf();assert.deepEqual(h.announced,['roll:1']);h.raf();assert.deepEqual(h.announced,['roll:1']);h.unmount();
});

test('renderer failure still reveals authority-confirmed numbers without a successful draw',()=>{
  const h=spotlight();h.boundary().props.onFailure();h.render();h.tick(1500);assert.equal(h.tree().props['data-up-face'],5);h.raf();h.raf();assert.deepEqual(h.announced,['roll:1']);h.unmount();
});

test('render quality, tray, light and result timing remain unchanged; geometry batching is the only draw reduction',()=>{
  const h=spotlight({count:6}),canvas=h.canvas().props;assert.equal(canvas.shadows,true);assert.deepEqual([...canvas.dpr],[1,1.5]);assert.equal(canvas.gl.antialias,true);assert.equal(canvas.gl.alpha,true);
  assert.deepEqual([...canvas.camera.position],[3.7,6.5,5]);assert.equal(canvas.camera.fov,38);
  const source=readFileSync('src/client/scene/DiceSpotlight.tsx','utf8');for(const preserved of ['intensity={1.5}','intensity={3}','shadow-mapSize={[512,512]}','shadow-normalBias={.02}','radius={.095} smoothness={3}','color="#fff9e9" roughness={.3} metalness={.05}','color="#315c62" roughness={.9}'])assert.ok(source.includes(preserved),preserved);
  assert.equal(6*22+5,137);assert.equal(h.dieTrees().reduce((n,die)=>n+die.props.children.length,5),23);h.unmount();
});

for(const kind of ['lost','never-draws','stalled-after-first'] as const)test(`${kind}: bounded numeric fallback without a terminal GPU frame`,()=>{
 const h=spotlight();if(kind==='lost'){h.frame();h.loseContext();h.render();h.tick(1500);}else{if(kind==='stalled-after-first')h.frame(1000);h.tick(4000);}
 assert.equal(h.tree().props['data-up-face'],5);assert.equal(h.canvas(),undefined);h.raf();h.raf();assert.deepEqual(h.announced,['roll:1']);h.unmount();
});

test('fallback clock respects pause and renderer retry restores final dice without replaying the result',()=>{
 const h=spotlight({count:2});h.frame();h.frame(500);h.loseContext();h.render();h.clock.setPaused(true);h.props.paused=true;h.render();h.tick(5000);assert.equal(h.tree().props['data-up-faces'],'');
 h.clock.setPaused(false);h.props.paused=false;h.render();h.tick(1300);assert.equal(h.tree().props['data-up-faces'],'1,2');h.raf();h.raf();assert.deepEqual(h.announced,['roll:1']);
 h.props.rendererResetKey=1;h.render();assert.equal(h.canvas().props.frameloop,'demand');h.frame();for(const die of h.dieTrees())close(die.props.ref.current.position.y,.44);h.raf();h.raf();assert.deepEqual(h.announced,['roll:1']);h.unmount();
});

test('speed-shortened throw and immediate final face retain independent reading windows',()=>{
 for(const duration of [1250,1000]){const h=spotlight();h.props.durationMs=duration;h.render();h.frame();if(duration>1000)h.frame(duration-1000);assert.equal(h.canvas().props.frameloop,'demand');h.raf();h.raf();assert.deepEqual(h.announced,['roll:1']);assert.equal(h.props.resultReadMs,1000);h.unmount();}
});

test('normal-motion tab sleep and BFCache wake never classify a healthy canvas as failed',()=>{
 for(const mode of ['visibility','pageshow']){const h=spotlight();h.frame();h.frame(500);if(mode==='visibility')h.visibility(true);
 // BFCache suspends timers too: this test emits pageshow before checking them.
 if(mode==='visibility')h.tick(20000);else{h.clock.setPaused(true);h.tick(20000);h.clock.setPaused(false);}
 assert.ok(h.canvas());assert.equal(h.tree().props['data-up-face'],'');if(mode==='visibility')h.visibility(false);else h.pageshow();
 h.frame(mode==='pageshow'?1000:0);assert.ok(h.canvas());assert.equal(h.canvas().props.frameloop,'demand');h.raf();h.raf();assert.deepEqual(h.announced,['roll:1']);
 h.props.beatKey='roll:2';h.props.startedAt=h.clock.now();h.render();assert.equal(h.canvas().props.frameloop,'always');h.frame();h.frame(1500);h.raf();h.raf();assert.deepEqual(h.announced,['roll:1','roll:2']);h.unmount();}
});
