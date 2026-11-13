import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

/** Execute the actual component source and capture its real useFrame callback.
 * No duplicated implementation and no WebGL/FPS claim. */
function mountQuality(lowQuality=false) {
  const source=readFileSync('src/client/scene/StudioLighting.tsx','utf8');
  const code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const root={current:{dataset:{} as Record<string,string>}},exports:Record<string,any>={};
  let callback:((state:{frameloop:string},delta:number)=>void)|undefined,automaticChanges=0;
  const require=(name:string)=>name==='react'?{useRef:(current:unknown)=>({current})}:name==='@react-three/fiber'?{useThree:()=>({gl:{getPixelRatio:()=>1.5}}),useFrame:(fn:typeof callback)=>{callback=fn;}}:{};
  vm.runInNewContext(code,{exports,require});
  exports.AdaptiveQuality({lowQuality,root,onSlow:()=>automaticChanges++});
  assert.ok(callback);
  return{root,step:(mode:string,delta:number,count=1)=>{for(let i=0;i<count;i++)callback!({frameloop:mode},delta);},automaticChanges:()=>automaticChanges};
}
test('90 real-source demand callbacks at 50ms never report slow frames or change quality',()=>{
 const monitor=mountQuality();monitor.step('demand',.05,90);
 assert.equal(monitor.automaticChanges(),0);assert.equal(monitor.root.current.dataset.quality,'studio');
 assert.equal(monitor.root.current.dataset.sampleFrameMs,undefined);assert.equal(monitor.root.current.dataset.adaptiveReason,undefined);
 assert.equal(monitor.root.current.dataset.pixelRatio,'1.50');
});
test('manual frameloop and gaps reset samples instead of mixing them into animation throughput',()=>{
 for(const [mode,delta]of[['demand',.05],['never',.05],['always',.3],['always',Number.NaN],['always',0]]as const){const monitor=mountQuality();monitor.step('always',.05,89);monitor.step(mode,delta);monitor.step('always',.05);assert.equal(monitor.root.current.dataset.sampleFrameMs,undefined);assert.equal(monitor.automaticChanges(),0);}
});
test('continuous slow frames remain telemetry only, without automatic content or setting changes',()=>{
 const monitor=mountQuality();monitor.step('always',.05,90);
 assert.equal(monitor.root.current.dataset.sampleFrameMs,'50.0');assert.equal(monitor.root.current.dataset.adaptiveReason,'sustained-frame-cost-observed');
 assert.equal(monitor.root.current.dataset.quality,'studio');assert.equal(monitor.automaticChanges(),0);
});
test('explicit economy mode stays selected and is never promoted or silently overwritten',()=>{
 const monitor=mountQuality(true);monitor.step('demand',.05,90);monitor.step('always',.05,90);
 assert.equal(monitor.root.current.dataset.quality,'economy');assert.equal(monitor.root.current.dataset.sampleFrameMs,undefined);assert.equal(monitor.automaticChanges(),0);
});
test('Board uses only explicit quality and retains its existing DPR and renderer policy',()=>{
 const board=readFileSync('src/client/scene/Board3D.tsx','utf8'),app=readFileSync('src/client/App.tsx','utf8');
 assert.ok(!board.includes('automaticLow'));assert.ok(!board.includes('onSlow='));
 assert.ok(!/lowQuality\s*=\s*lowQuality/.test(board));
 assert.ok(board.includes('shadows={!lowQuality} dpr={lowQuality ? 1 : [1, compact ? 1.25 : 1.5]}'));
 assert.ok(board.includes('antialias: !lowQuality'));assert.ok(board.includes('<AdaptiveQuality lowQuality={lowQuality} root={root} />'));
 assert.ok(app.includes("setting('low-quality', false)"));assert.ok(app.includes("localStorage.setItem('magical-athlete:low-quality', String(lowQuality))"));
});
