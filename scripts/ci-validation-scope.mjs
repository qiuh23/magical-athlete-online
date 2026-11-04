import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Automated runs validate releasable artifacts. Gameplay and browser suites are
// explicit manual choices; commit trailers cannot opt automatic releases into UI.
export function validationSuite(requested,_message,changedPaths=[],eventName='push') {
  if(eventName!=='workflow_dispatch') return 'release';
  const suite=requested?.trim() || 'release';
  if (!['release','all','eight-only','ability-interactions','deployment'].includes(suite)) throw new Error(`Unknown validation suite: ${suite}`);
  if(suite==='deployment' && changedPaths.some(path=>/^src\/(engine|shared)\//.test(path))) return 'eight-only';
  return suite;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const ref=process.env.HEAD_SHA || 'HEAD';
  const message=execFileSync('git',['show','-s','--format=%B',ref],{encoding:'utf8'});
  const paths=execFileSync('git',['diff','--name-only',`${ref}^`,ref],{encoding:'utf8'}).trim().split('\n');
  const suite=validationSuite(process.env.REQUESTED_SUITE,message,paths,process.env.GITHUB_EVENT_NAME);
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`suite=${suite}\n`);
  console.log(`Validation suite: ${suite}`);
}
