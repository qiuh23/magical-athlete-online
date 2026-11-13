/** Historical identity is immutable. Only three explicitly named environment
 * inputs can cross into the separately hashed, finite current-scene delta. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const directory='docs/qa/integrated-venue';
const historical:Record<string,string>={
 'src/client/scene/environment/runtime.ts':'74918a8d2df75f27004619fcac7f8a5531c4da586af65c29f399e3211b6e32e7',
 'src/client/scene/environment/layout.ts':'9dd7d51090293ff1fdb4cea733d63c695e4d1c90a83a346e77cb2f2120e1780e',
 'src/client/scene/environment/floodlights.ts':'d62641418c9eebd3f40d04bdaacffa60c83c4cdc4b9af8d36293c36a0615d0df',
};
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const validated=new Set<string>();
export function validateIntegratedVenueEvidence(root='.'){
 root=resolve(root);if(validated.has(root))return;
 const p=json(resolve(root,directory,'identity-link.json'));
 assert.equal(p.schema,'integrated-venue-finite-delta-v1');
 assert.equal(p.historicalR1CurrentContactAuthorization,false);
 assert.deepEqual(p.excludedContactAnchors,['wild:23','wild:24','boardwalks:19','boardwalks:23']);
 assert.equal(p.retainedTripFixtures,20);
 assert.deepEqual(Object.keys(p.sourceDelta).sort(),Object.keys(historical).sort());
 for(const [path,expected] of Object.entries(historical)){
  const entry=p.sourceDelta[path];assert.equal(entry.historicalSHA256,expected);
  assert.equal(sha(resolve(root,entry.historicalSnapshot)),expected);
  assert.equal(sha(resolve(root,path)),entry.currentSHA256);
  assert.equal(p.currentInputs[path],entry.currentSHA256);
 }
 const immutableArtifacts:Record<string,string>={
  'src/client/scene/environment/scene-mechanisms-manifest.json':'95f7d262a34c66d711d3c6ee16dfe4a7e041e120a96e6095990a179681da1705',
  'src/client/scene/environment/parked-fallbacks/manifest.json':'e512144445bde520e9e75c7f684674863bea6e91d625ae0db73cf1c1c7b446a2',
  'docs/qa/punch-r1-contact/release-evidence.json':'015de96de01b9658682e79eea24ca5683609cdc19b9c1a8b4162bb0a6033696d',
 };
 for(const [path,expected] of Object.entries(immutableArtifacts))assert.equal(p.historicalArtifacts[path],expected,path);
 assert.equal(p.evidence.length,17);for(const kind of ['finishes','lights','sightlines'])assert.equal(p.evidence.filter((e:any)=>e.kind===kind).length,1,kind);
 for(const [path,expected] of Object.entries(p.historicalArtifacts))assert.equal(sha(resolve(root,path)),expected,path);
 for(const path of ['src/client/scene/environment/scene-mechanisms-manifest.json','src/client/scene/environment/parked-fallbacks/manifest.json','docs/qa/punch-r1-contact/release-evidence.json'])assert.ok(p.historicalArtifacts[path],path);
 for(const [path,expected] of Object.entries(p.currentInputs))assert.equal(sha(resolve(root,path)),expected,path);
 for(const path of ['src/client/scene/environment/seating-clearance.ts','src/client/scene/environment/full-coverage.ts','src/client/scene/environment/tile-finish.ts'])assert.ok(p.currentInputs[path],path);
 const sceneKeys=new Set<string>();let tripFixtures=0;
 for(const item of p.evidence){
  assert.equal(sha(resolve(root,item.path)),item.sha256,item.path);const evidence=json(resolve(root,item.path));
  for(const [key,value] of Object.entries(evidence.inputs))assert.equal(p.currentInputs[key.replace(/^(lighting|environment)\//,'')],value,key);
  if(item.kind==='foundations'){
   const key=evidence.track+':'+evidence.lowQuality;assert.ok(!sceneKeys.has(key));sceneKeys.add(key);
   assert.equal(evidence.failures.length,0,key);assert.equal(evidence.review.length,0,key);assert.deepEqual(evidence.changedDuringRun,[]);
   assert.equal(evidence.auditProtocolSHA256,p.currentInputs['scripts/recovery/audit-integrated-venue-foundations.ts']);
   for(const r of evidence.retainedDomains){assert.ok(['excluded-moved-anchor','aabb-excluded','actual-envelope-volume-excluded','finite-targeted-replay-clear'].includes(r.status),r.key);assert.equal(r.fixedSupportHits?.length??0,0);assert.equal(r.targetedHits?.length??0,0);if(r.status==='finite-targeted-replay-clear')assert.equal(r.targetedSamples,51);}
  }else if(item.kind==='finishes'){
   assert.equal(evidence.solidHits.length,0);tripFixtures=evidence.reports.filter((r:any)=>r.scope==='old-trip-finite').length;assert.equal(tripFixtures,20);
  }else if(item.kind==='lights'){
   assert.equal(evidence.failures.length,0);assert.equal(evidence.support.length,112);assert.deepEqual(evidence.changedDuringRun,[]);
  }else if(item.kind==='sightlines'){
   assert.equal(evidence.blocked.length,0);assert.equal(evidence.reports.length,14);assert.deepEqual(evidence.changedDuringRun,[]);
  }else assert.fail('Unknown evidence kind');
 }
 assert.equal(sceneKeys.size,14);assert.equal(tripFixtures,20);
 for(const map of ['mild','twisty-twirl','bridges','squiggle','boardwalks','whirly-world','wild'])for(const low of [false,true])assert.ok(sceneKeys.has(map+':'+low));
 validated.add(root);
}
export function assertHistoricalVenueInput(path:string,expected:unknown,root='.'){
 if(sha(resolve(root,path))===expected)return;
 assert.equal(expected,historical[path],'Only explicit historical environment inputs may use a delta: '+path);
 assert.ok(historical[path],path);validateIntegratedVenueEvidence(root);
}
