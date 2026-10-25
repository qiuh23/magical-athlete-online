import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const {validateRequest}=await import(new URL('../scripts/deploy/ci-install.mjs',import.meta.url).href);
const request={target:'preview',commit:'a'.repeat(40),runId:123,artifactUrl:'https://productionresultssa0.blob.core.windows.net/actions-results/artifact.zip?sig=temporary',artifactSha256:'b'.repeat(64),prNumber:23};
const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64');
const python=process.platform==='win32'?'python':'python3';

test('preview deploy identity cannot promote an artifact to production or invoke unexpected fields',()=>{
  assert.equal(validateRequest(encode(request),'athlete-preview-deploy').target,'preview');
  assert.equal(validateRequest(encode({...request,target:'production',prNumber:0}),'athlete-deploy').target,'production');
  assert.throws(()=>validateRequest(encode({...request,target:'production',prNumber:0}),'athlete-preview-deploy'));
  assert.throws(()=>validateRequest(encode(request),'athlete-deploy'));
  assert.throws(()=>validateRequest(encode({...request,command:'touch /root/unsafe'}),'athlete-preview-deploy'));
  assert.throws(()=>validateRequest(encode(request),'root'));
});

test('installer accepts only signed GitHub Actions result storage with exact artifact metadata',()=>{
  for(const artifactUrl of ['http://productionresultssa0.blob.core.windows.net/x','https://attacker.example/x','https://productionresultssa0.blob.core.windows.net.attacker.example/x','https://user:password@productionresultssa0.blob.core.windows.net/x','https://productionresultssa0.blob.core.windows.net:444/x'])assert.throws(()=>validateRequest(encode({...request,artifactUrl}),'athlete-preview-deploy'));
  for(const change of [{commit:'main'},{commit:'A'.repeat(40)},{runId:0},{prNumber:0},{artifactSha256:'bad'}])assert.throws(()=>validateRequest(encode({...request,...change}),'athlete-preview-deploy'));
  assert.throws(()=>validateRequest('not encoded!','athlete-preview-deploy'));
});

test('rollback requests bind the same operating-system identity and exact workflow attempt',()=>{
  const rollback={action:'rollback',target:'preview',commit:request.commit,runId:request.runId};
  assert.equal(validateRequest(encode(rollback),'athlete-preview-deploy').action,'rollback');
  assert.throws(()=>validateRequest(encode({...rollback,target:'production'}),'athlete-preview-deploy'));
  assert.throws(()=>validateRequest(encode({...rollback,artifactUrl:request.artifactUrl}),'athlete-preview-deploy'));
  assert.throws(()=>validateRequest(encode({...rollback,action:'shell'}),'athlete-preview-deploy'));
});

test('release extraction rejects parent traversal, external symlinks and unexpected root files',()=>{
  const work=mkdtempSync(join(tmpdir(),'athlete-release-extraction-'));
  const extractor=fileURLToPath(new URL('../scripts/deploy/extract-release.py',import.meta.url));
  try{
    const create=join(work,'create.py');
    writeFileSync(create,`import io,sys,tarfile\nwith tarfile.open(sys.argv[1], 'w:gz') as out:\n name=sys.argv[2]\n item=tarfile.TarInfo(name)\n if name=='node_modules/escape':\n  item.type=tarfile.SYMTYPE\n  item.linkname='/tmp/outside-release'\n  out.addfile(item)\n else:\n  item.size=2\n  out.addfile(item,io.BytesIO(b'ok'))\n`);
    const valid=join(work,'valid.tar.gz');
    execFileSync(python,[create,valid,'dist/client/index.html']);
    execFileSync(python,[extractor,valid,join(work,'release')]);
    assert.equal(readFileSync(join(work,'release','dist','client','index.html'),'utf8'),'ok');
    for(const name of ['../outside','root-owned-command.sh','node_modules/escape']){
      const archive=join(work,'invalid.tar.gz');
      execFileSync(python,[create,archive,name]);
      assert.throws(()=>execFileSync(python,[extractor,archive,join(work,'release')],{stdio:'pipe'}));
    }
  }finally{rmSync(work,{recursive:true,force:true});}
});
