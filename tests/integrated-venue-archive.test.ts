import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,mkdirSync,readFileSync,rmSync,symlinkSync,unlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {validateIntegratedVenueEvidence} from './helpers/integrated-venue-evidence.js';

const directory='docs/qa/integrated-venue';
const identity=JSON.parse(readFileSync(`${directory}/identity-link.json`,'utf8'));
const archived=[
 ['src/client/scene/environment/stadium-turf.ts','tests/fixtures/integrated-venue-pre-turf/stadium-turf.ts.txt'],
 ['src/client/scene/DioramaStadium.tsx','tests/fixtures/integrated-venue-pre-turf/DioramaStadium.tsx.txt'],
] as const;
// The fixture only links existing inputs. Changed files are unlinked before
// writing, so negative tests cannot edit a real source, asset or report.
function fixture(changePath:string,change:(source:string)=>string){
 const root=mkdtempSync(join(tmpdir(),'athlete-archive-'));
 const paths=new Set<string>([
  `${directory}/identity-link.json`,...Object.keys(identity.currentInputs),...Object.keys(identity.historicalArtifacts),
  ...Object.values(identity.sourceDelta).map((entry:any)=>entry.historicalSnapshot),
  ...identity.evidence.map((entry:any)=>entry.path),...archived.map(([,snapshot])=>snapshot),
  ...['src/client/scene/environment/full-coverage.ts','src/client/scene/environment/FullCoverageMechanismLayer.tsx','src/client/scene/Board3D.tsx','tests/helpers/integrated-venue-evidence.ts'].map(path=>`docs/qa/mechanism-motion/historical-main-1e08851/${path}.txt`),
 ]);
 try{
  for(const path of paths){const target=resolve(root,path);mkdirSync(dirname(target),{recursive:true});symlinkSync(resolve(path),target);}
  const target=resolve(root,changePath),source=readFileSync(target,'utf8');unlinkSync(target);writeFileSync(target,change(source));
  return {root,dispose:()=>rmSync(root,{recursive:true,force:true})};
 }catch(error){rmSync(root,{recursive:true,force:true});throw error;}
}
test('archived grass and stadium source bytes retain the exact pre-turf report identity',()=>{
 for(const [path,snapshot] of archived){
  const digest=createHash('sha256').update(readFileSync(snapshot)).digest('hex');
  assert.equal(digest,identity.currentInputs[path]);
 }
 validateIntegratedVenueEvidence();
});
test('historical validation does not claim to certify current presentation source',()=>{
 for(const [path] of archived){const copy=fixture(path,source=>source+'\n// Later presentation edit.\n');
  try{validateIntegratedVenueEvidence(copy.root);}finally{copy.dispose();}
 }
});
test('changed archived source bytes fail closed even when current presentation is unchanged',()=>{
 for(const [,snapshot] of archived){const copy=fixture(snapshot,source=>source+'\n');
  try{assert.throws(()=>validateIntegratedVenueEvidence(copy.root),/AssertionError/);}finally{copy.dispose();}
 }
});
test('archived reports and current physical inputs remain strict, with no old contact authorization',()=>{
 for(const path of ['docs/qa/punch-r1-contact/release-evidence.json','src/client/scene/mechanisms/contact-plan.ts','src/client/scene/Board3D.tsx']){
  const copy=fixture(path,source=>source+(path.endsWith('Board3D.tsx')?'\n// SceneMechanismController\n':'\n'));
  try{assert.throws(()=>validateIntegratedVenueEvidence(copy.root),/AssertionError/);}finally{copy.dispose();}
 }
});
