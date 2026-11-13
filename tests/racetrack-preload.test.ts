import test from 'node:test';
import assert from 'node:assert/strict';
import { useGLTF } from '@react-three/drei';
import { upcomingTrack, schedulePreload } from '../src/client/racetrack-preload.js';
import { racetrackAssetGroups, preloadRacetrackGroup } from '../src/client/scene/preload-racetrack-assets.js';
import { createMatchPlan, presetCompetition } from '../src/shared/competition.js';
import { COMMON_ASSETS, environmentUrl, mapEnvironmentAssets } from '../src/client/scene/environment/layout.js';
import { FLOODLIGHT_ASSETS, floodlightUrl } from '../src/client/scene/environment/floodlights.js';
import { DISPLAY_URLS, fullCoveragePlacements } from '../src/client/scene/environment/full-coverage.js';
import { mechanismPadUrl } from '../src/client/scene/mechanisms/models.js';
import { TRACKS, type TrackId } from '../src/shared/tracks.js';

const matchPlan = createMatchPlan({ competition: presetCompetition('extended') });
test('draft uses frozen next-round map, never stale previous track or editable settings', () => {
  assert.equal(upcomingTrack({ phase:'draft', round:5, track:'whirly-world', matchPlan }), 'squiggle');
  assert.equal(upcomingTrack({ phase:'draft', round:1, track:'wild', matchPlan }), 'mild');
  assert.equal(upcomingTrack({ phase:'draft', round:1, track:'wild' }), null);
  assert.equal(upcomingTrack({ phase:'selection', round:2, track:'mild' }), null);
  assert.equal(upcomingTrack({ phase:'selection', round:5, track:'wild', matchPlan }), 'wild');
  for (const phase of ['lobby','race','results','finished','paused'] as const) assert.equal(upcomingTrack({ phase, round:5, track:'wild', matchPlan }), null);
  assert.equal(upcomingTrack(null), null);
});
test('only current map assets, exact renderer cache groups, chosen quality and opt-outs', () => {
  for (const track of Object.keys(TRACKS) as TrackId[]) {
    const groups = racetrackAssetGroups(track,false,'?environment=1&mechanisms=1');
    assert.deepEqual(groups.slice(0,3),[COMMON_ASSETS.map(environmentUrl),mapEnvironmentAssets(track).map(environmentUrl),FLOODLIGHT_ASSETS.map(floodlightUrl)]);
    assert.equal(groups[3],mechanismPadUrl(false));
    assert.deepEqual(groups.slice(4),[...new Set(fullCoveragePlacements(track).map(p=>p.variant))].map(v=>DISPLAY_URLS[v]));
    assert.equal(racetrackAssetGroups(track,true,'?environment=1&mechanisms=1')[3],mechanismPadUrl(true));
    assert.equal(racetrackAssetGroups(track,false,'?environment=1&mechanisms=0').length,3);
    assert.deepEqual(racetrackAssetGroups(track,false,'?environment=0&mechanisms=1'),[]);
  }
});
test('idle queue yields between requests and cancellation prevents stale map work', () => {
  const queue: {run:()=>void;cancelled:boolean}[] = [], loaded: string[] = [];
  const idle = (run:()=>void) => { const job={run,cancelled:false}; queue.push(job); return ()=>{job.cancelled=true;}; };
  const stop=schedulePreload(['common','old-map','fixtures'],x=>loaded.push(x),idle);
  assert.equal(loaded.length,0);assert.equal(queue.length,1);
  queue[0]!.run();assert.deepEqual(loaded,['common']);assert.equal(queue.length,2);
  stop();queue[1]!.run();assert.deepEqual(loaded,['common']);assert.equal(queue[1]!.cancelled,true);
  schedulePreload(['new-map'],x=>loaded.push(x),idle);queue[2]!.run();assert.deepEqual(loaded,['common','new-map']);
});
test('optional preload error does not block subsequent preparation', () => {
  const queue:(()=>void)[]=[],loaded:string[]=[];
  schedulePreload(['bad','good'],x=>{if(x==='bad')throw Error('network');loaded.push(x);},fn=>{queue.push(fn);return()=>{};});
  queue.shift()!();queue.shift()!();assert.deepEqual(loaded,['good']);
});
test('real Drei preload reuses parsed array cache without a second network request', async () => {
  let requests=0;
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async ()=>{requests++;return new Response(JSON.stringify({asset:{version:'2.0'},scene:0,scenes:[{nodes:[]}]}),{headers:{'Content-Type':'model/gltf+json'}});};
  const urls=['https://preload-test.invalid/a.gltf','https://preload-test.invalid/b.gltf'];
  // Three's browser progress event is absent from Node, unrelated to cache logic.
  const old=globalThis.ProgressEvent;
  if(!old)globalThis.ProgressEvent=class extends Event { constructor(type:string){super(type);} } as unknown as typeof ProgressEvent;
  try {
    preloadRacetrackGroup(urls);preloadRacetrackGroup([...urls]);
    // Pinned Drei/Fiber useGLTF is a synchronous suspense-cache accessor (also
    // used by ToyCharacter). Read the foreground consumer's exact cache key.
    let loaded:ReturnType<typeof useGLTF>[]|undefined;
    for(let i=0;i<4&&!loaded;i++)try{loaded=useGLTF(urls);}catch(error){if(error&&typeof(error as Promise<unknown>).then==='function')await error;else throw error;}
    assert.ok(loaded);assert.equal(requests,2);
    assert.equal(useGLTF([...urls])[0]!.scene,loaded[0]!.scene);
    preloadRacetrackGroup(urls);assert.equal(requests,2);
  } finally {useGLTF.clear(urls);if(!old)delete (globalThis as {ProgressEvent?:typeof ProgressEvent}).ProgressEvent;globalThis.fetch=originalFetch;}
});
test('browser scheduling waits for idle time, rechecks visibility, and cancels callbacks', async () => {
  const { browserIdle } = await import('../src/client/racetrack-preload.js');
  const descriptors = ['window','document','setTimeout','clearTimeout'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)] as const);
  const timers:(()=>void)[]=[],callbacks:((d:{timeRemaining():number})=>void)[]=[],cancelled:number[]=[];
  const doc={hidden:false};let runs=0;
  Object.defineProperty(globalThis,'window',{configurable:true,value:{requestIdleCallback:(cb:(d:{timeRemaining():number})=>void)=>{callbacks.push(cb);return callbacks.length;},cancelIdleCallback:(id:number)=>cancelled.push(id)}});
  Object.defineProperty(globalThis,'document',{configurable:true,value:doc});
  Object.defineProperty(globalThis,'setTimeout',{configurable:true,value:(cb:()=>void)=>{timers.push(cb);return timers.length;}});
  Object.defineProperty(globalThis,'clearTimeout',{configurable:true,value:()=>{}});
  try {
    const stop=browserIdle(()=>runs++);assert.equal(runs,0);
    timers.shift()!();doc.hidden=true;callbacks.shift()!({timeRemaining:()=>50});assert.equal(runs,0);
    doc.hidden=false;timers.shift()!();callbacks.shift()!({timeRemaining:()=>2});assert.equal(runs,0);
    timers.shift()!();callbacks.shift()!({timeRemaining:()=>50});assert.equal(runs,1);stop();
    const stopBefore=browserIdle(()=>runs++);timers.shift()!();stopBefore();callbacks.shift()!({timeRemaining:()=>50});assert.equal(runs,1);assert.ok(cancelled.length);
  } finally {for(const [key,descriptor]of descriptors)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}
});
