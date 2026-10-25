import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// A reviewed commit can request a focused feature check without disabling the
// build/type/packaging checks. Manual dispatch always overrides that request.
export function validationSuite(requested,message,changedPaths=[]) {
  const trailer=/^Validation-Scope:\s*(ability-interactions|deployment)\s*$/m.exec(message)?.[1];
  const suite=requested?.trim() || trailer || 'eight-only';
  if (!['all','eight-only','ability-interactions','deployment'].includes(suite)) throw new Error(`Unknown validation suite: ${suite}`);
  if(suite==='deployment' && changedPaths.some(path=>/^src\/(engine|shared)\//.test(path))) return 'eight-only';
  return suite;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const ref=process.env.HEAD_SHA || 'HEAD';
  const message=execFileSync('git',['show','-s','--format=%B',ref],{encoding:'utf8'});
  const paths=execFileSync('git',['diff','--name-only',`${ref}^`,ref],{encoding:'utf8'}).trim().split('\n');
  const suite=validationSuite(process.env.REQUESTED_SUITE,message,paths);
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,`suite=${suite}\n`);
  console.log(`Validation suite: ${suite}`);
}
