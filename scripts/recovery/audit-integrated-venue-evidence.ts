/** Seal the independently reproduced finite deltas, never rewrite history. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateIntegratedVenueEvidence} from '../../tests/helpers/integrated-venue-evidence.js';
const root='docs/qa/integrated-venue';
const sha=(p:string)=>createHash('sha256').update(readFileSync(p)).digest('hex');
const json=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const maps=['mild','twisty-twirl','bridges','squiggle','boardwalks','whirly-world','wild'];
const evidence=[...maps.flatMap(track=>['full','economy'].map(q=>({kind:'foundations',path:`${root}/${track}-${q}.json`}))),{kind:'finishes',path:root+'/retained-finishes.json'},{kind:'lights',path:root+'/light-joints/observation.json'},{kind:'sightlines',path:root+'/light-joints/sightline-observation.json'}];
const currentInputs:Record<string,string>={};
for(const entry of evidence){const report=json(entry.path);for(const [key,value] of Object.entries(report.inputs)){const path=key.replace(/^(lighting|environment)\//,'');assert.equal(sha(path),value,path);if(currentInputs[path])assert.equal(currentInputs[path],value,path);currentInputs[path]=value as string;}}
for(const path of ['scripts/recovery/audit-integrated-venue-evidence.ts','tests/helpers/integrated-venue-evidence.ts','tests/scene-mechanisms.test.ts','tests/parked-scene-fallbacks.test.ts','tests/punch-r1-evidence.test.ts'])currentInputs[path]=sha(path);
const historicalPaths=['src/client/scene/environment/scene-mechanisms-manifest.json','src/client/scene/environment/parked-fallbacks/manifest.json','docs/qa/punch-r1-contact/release-evidence.json','docs/qa/floodlight-rows/reference-envelopes.json','docs/qa/floodlight-rows/display-envelope-inputs.json','docs/qa/floodlight-rows/display-envelopes-0.json','docs/qa/floodlight-rows/display-envelopes-1.json'];
const sourceDelta=Object.fromEntries(['runtime','layout','floodlights'].map(name=>{const path=`src/client/scene/environment/${name}.ts`,historicalSnapshot=`${root}/historical-inputs/${name}.ts.txt`;return[path,{historicalSHA256:sha(historicalSnapshot),historicalSnapshot,currentSHA256:sha(path)}];}));
const sidecar={schema:'integrated-venue-finite-delta-v1',scope:'Immutable historical proofs remain historical. Current additions are linked only by finite actual-mesh delta evidence; no new actor, continuous-time, all-character or current R1 contact authorization. Retained Trip scope excludes moved Boardwalk19/23. Fixed structural interfaces remain explicit contacts.',historicalR1CurrentContactAuthorization:false,excludedContactAnchors:['wild:23','wild:24','boardwalks:19','boardwalks:23'],retainedTripFixtures:20,sourceDelta,historicalArtifacts:Object.fromEntries(historicalPaths.map(p=>[p,sha(p)])),currentInputs,evidence:evidence.map(e=>({...e,sha256:sha(e.path)}))};
writeFileSync(root+'/identity-link.json',JSON.stringify(sidecar,null,2));validateIntegratedVenueEvidence();
console.log(JSON.stringify({evidence:evidence.length,currentInputs:Object.keys(currentInputs).length,historicalArtifacts:historicalPaths.length,retainedTripFixtures:20,status:'finite-delta-validated'}));
