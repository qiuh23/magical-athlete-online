import test from 'node:test';
import assert from 'node:assert/strict';
import {formatRoomCode,httpEntryUrl,parseRoomCode,validateBackendConfig} from '../src/client/backends.js';

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
