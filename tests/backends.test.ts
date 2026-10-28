import test from 'node:test';
import assert from 'node:assert/strict';
import {backendEntryUrl,formatRoomCode,httpEntryUrl,parseRoomCode,roomEntryUrl,validateBackendConfig} from '../src/client/backends.js';

test('external codes carry a stable backend and six-character legacy codes remain unresolved',()=>{
  assert.deepEqual(parseRoomCode(' c-abc234 '),{code:'ABC234',backendId:'cloudflare'});
  assert.deepEqual(parseRoomCode('A-XYZ678'),{code:'XYZ678',backendId:'aliyun'});
  assert.deepEqual(parseRoomCode('ABC234'),{code:'ABC234'});
  assert.equal(formatRoomCode('ABC234','aliyun'),'A-ABC234');
  assert.equal(parseRoomCode('https://untrusted.example/ABC234'),null);
  assert.equal(parseRoomCode('B-ABC234'),null);
});

test('temporary HTTP requires trusted opt-in and HTTPS points at a code-only independent entry',()=>{
  const entries=[{id:'cloudflare',origin:'https://cf.example',transport:'worker',enabled:true},{id:'aliyun',origin:'http://203.0.113.8',transport:'socketio',enabled:true,allowInsecureHttp:true}];
  const backend=validateBackendConfig({backends:entries})[1]!;
  assert.equal(backend.allowInsecureHttp,true);
  assert.equal(httpEntryUrl(backend,'A-XYZ678','https://cf.example'),'http://203.0.113.8/room/A-XYZ678');
  assert.equal(httpEntryUrl(backend,'ABC234','https://cf.example'),'http://203.0.113.8/room/A-ABC234');
  assert.equal(httpEntryUrl(backend,'https://attacker.example/?token=secret','https://cf.example'),'http://203.0.113.8/');
  assert.equal(httpEntryUrl(backend,'A-XYZ678','http://203.0.113.8'),null);
  assert.equal(httpEntryUrl({...backend,enabled:false},'A-XYZ678','https://cf.example'),null);
  assert.equal(httpEntryUrl({...backend,origin:'http://127.0.0.1:3000'},undefined,'https://cf.example'),null);
  for(const origin of ['http://user:secret@203.0.113.8','http://203.0.113.8/path','http://203.0.113.8/?target=elsewhere','ws://203.0.113.8'])assert.throws(()=>validateBackendConfig({backends:[entries[0],{...entries[1],origin}]}));
  assert.throws(()=>validateBackendConfig({backends:[entries[0],{...entries[1],allowInsecureHttp:'true'}]}));
});
test('deployment config accepts independent origins and rejects URL credentials, paths and duplicated IDs',()=>{
  const entries=[{id:'cloudflare',origin:'https://cf.example',transport:'worker',enabled:true},{id:'aliyun',origin:'https://cn.example',transport:'socketio',enabled:false}];
  assert.deepEqual(validateBackendConfig({backends:entries}).map(item=>[item.id,item.label,item.enabled]),[['cloudflare','Cloudflare',true],['aliyun','阿里云内地',false]]);
  for(const origin of ['http://cn.example','https://user:secret@cn.example','https://cn.example/room','https://cn.example/?url=https://other.example'])assert.throws(()=>validateBackendConfig({backends:[entries[0],{...entries[1],origin}]}));
  assert.throws(()=>validateBackendConfig({backends:[entries[0],entries[0]]}));
  assert.throws(()=>validateBackendConfig({backends:entries.slice(0,1)}));
});

test('both directions use trusted entries, retain only the public code and stop at the target origin',()=>{
  const [cf,ali]=validateBackendConfig({backends:[
    {id:'cloudflare',origin:'https://cf.example',transport:'worker',enabled:true},
    {id:'aliyun',origin:'http://203.0.113.8',transport:'socketio',enabled:true,allowInsecureHttp:true},
  ]});
  assert.equal(backendEntryUrl(ali!,undefined,cf!.origin),'http://203.0.113.8/');
  assert.equal(backendEntryUrl(cf!,undefined,ali!.origin),'https://cf.example/');
  assert.equal(backendEntryUrl(ali!,'a-xyz678',cf!.origin),'http://203.0.113.8/room/A-XYZ678');
  assert.equal(backendEntryUrl(cf!,'c-abc234',ali!.origin),'https://cf.example/room/C-ABC234');
  assert.equal(backendEntryUrl(ali!,'A-XYZ678',ali!.origin),null);
  assert.equal(backendEntryUrl(cf!,'C-ABC234',cf!.origin),null);
  assert.equal(backendEntryUrl({...cf!,origin:''},undefined,cf!.origin),null);
  assert.equal(backendEntryUrl({...ali!,enabled:false},undefined,cf!.origin),null);
  for(const input of ['https://attacker.example/?token=secret','A-XYZ678?token=secret','ABC234#secret']) {
    assert.equal(backendEntryUrl(ali!,input,cf!.origin),'http://203.0.113.8/');
  }
  assert.equal(roomEntryUrl(cf!,'ABC234'),'https://cf.example/room/C-ABC234');
});

test('entry routing uses each environment registry without production fallbacks',async()=>{
  const {deploymentSettings}=await import(new URL('../scripts/deploy/ci-release.mjs',import.meta.url).href);
  const production=deploymentSettings('production'),preview=deploymentSettings('preview');
  for(const settings of [production,preview]) {
    const [cf,ali]=validateBackendConfig({backends:[
      {id:'cloudflare',origin:settings.cloudflareOrigin,transport:'worker',enabled:true},
      {id:'aliyun',origin:settings.aliyunOrigin,transport:'socketio',enabled:true,allowInsecureHttp:true},
    ]});
    assert.equal(backendEntryUrl(ali!,'A-ABC234',settings.cloudflareOrigin),`${settings.aliyunOrigin}/room/A-ABC234`);
    assert.equal(backendEntryUrl(cf!,'C-ABC234',settings.aliyunOrigin),`${settings.cloudflareOrigin}/room/C-ABC234`);
    assert.equal(backendEntryUrl(ali!,'A-ABC234',settings.aliyunOrigin),null);
  }
  assert.notEqual(preview.cloudflareOrigin,production.cloudflareOrigin);
  assert.notEqual(preview.aliyunOrigin,production.aliyunOrigin);
});
