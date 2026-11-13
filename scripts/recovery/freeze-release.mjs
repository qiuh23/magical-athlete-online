/** Content identity for the integrated checkout. Commit metadata is provenance only.
 * The release report/this generated manifest are excluded to avoid recursive hashes. */
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const excluded='docs/qa/athlete-release/';
const paths=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(p=>p&&!p.startsWith(excluded)).sort();
const files=Object.fromEntries(paths.map(p=>{const b=readFileSync(p);return[p,{bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}];}));
const aggregateSHA256=createHash('sha256').update(JSON.stringify(files)).digest('hex');
writeFileSync(`${excluded}source-manifest.json`,JSON.stringify({schema:1,scope:'Every tracked input outside this release report directory. This includes actual entry, UI, readiness, controllers, frozen geometry, assets, scripts, tests and preserved earlier evidence. Not a browser or continuous-collision certificate.',excluded:[excluded],aggregateSHA256,files},null,2)+'\n');
console.log(JSON.stringify({files:paths.length,aggregateSHA256}));
