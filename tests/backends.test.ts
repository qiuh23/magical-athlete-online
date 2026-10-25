import test from 'node:test';
import assert from 'node:assert/strict';
import {formatRoomCode,parseRoomCode,validateBackendConfig} from '../src/client/backends.js';

test('external codes carry a stable backend and six-character legacy codes remain unresolved',()=>{
  assert.deepEqual(parseRoomCode(' c-abc234 '),{code:'ABC234',backendId:'cloudflare'});
  assert.deepEqual(parseRoomCode('A-XYZ678'),{code:'XYZ678',backendId:'aliyun'});
  assert.deepEqual(parseRoomCode('ABC234'),{code:'ABC234'});
  assert.equal(formatRoomCode('ABC234','aliyun'),'A-ABC234');
  assert.equal(parseRoomCode('https://untrusted.example/ABC234'),null);
  assert.equal(parseRoomCode('B-ABC234'),null);
});
test('deployment config accepts independent origins and rejects URL credentials, paths and duplicated IDs',()=>{
  const entries=[{id:'cloudflare',origin:'https://cf.example',transport:'worker',enabled:true},{id:'aliyun',origin:'https://cn.example',transport:'socketio',enabled:false}];
  assert.deepEqual(validateBackendConfig({backends:entries}).map(item=>[item.id,item.label,item.enabled]),[['cloudflare','Cloudflare',true],['aliyun','阿里云内地',false]]);
  for(const origin of ['http://cn.example','https://user:secret@cn.example','https://cn.example/room','https://cn.example/?url=https://other.example'])assert.throws(()=>validateBackendConfig({backends:[entries[0],{...entries[1],origin}]}));
  assert.throws(()=>validateBackendConfig({backends:[entries[0],entries[0]]}));
  assert.throws(()=>validateBackendConfig({backends:entries.slice(0,1)}));
});
