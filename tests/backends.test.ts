import test from 'node:test';
import assert from 'node:assert/strict';
import { backendEntryUrl, formatRoomCode, getBackend, getBackends, httpEntryUrl, parseRoomCode, readBackendPreference, roomEntryUrl, validateBackendConfig } from '../src/client/backends.js';

test('same-site legacy and prefixed codes remain valid while explicit foreign ownership is rejected',()=>{
 assert.deepEqual(parseRoomCode(' c-abc234 '),{code:'ABC234',backendId:'cloudflare'});
 assert.deepEqual(parseRoomCode('A-XYZ678'),{code:'XYZ678',backendId:'aliyun'});
 assert.deepEqual(parseRoomCode('ABC234'),{code:'ABC234'});
 assert.equal(formatRoomCode('ABC234','cloudflare'),'C-ABC234');
 assert.equal(parseRoomCode('https://evil.example/ABC234'),null);
 const backend=getBackend('cloudflare');
 assert.equal(backendEntryUrl(backend,'C-ABC234'),null);
 assert.throws(()=>getBackend('aliyun'),/此邀请不属于当前站点/);
 assert.throws(()=>backendEntryUrl(backend,'A-ABC234'),/此邀请不属于当前站点/);
 assert.throws(()=>roomEntryUrl(backend,'A-ABC234'),/此邀请不属于当前站点/);
 assert.equal(httpEntryUrl(backend,'C-ABC234'),null);
 assert.equal(roomEntryUrl(backend,'ABC234'),'http://localhost/room/C-ABC234');
 assert.equal(readBackendPreference(),'cloudflare');
 assert.equal(getBackends().length,1);
});

test('public configuration contains exactly the compiled site with same-origin API and no foreign endpoint',()=>{
 const entry={id:'cloudflare',origin:'',transport:'worker',enabled:true};
 assert.equal(validateBackendConfig({siteEdition:'global',backends:[entry]}).length,1);
 for(const bad of [undefined,{backends:[entry]},{siteEdition:'cn',backends:[entry]},
 {siteEdition:'global',backends:[entry,entry]},
 {siteEdition:'global',backends:[{...entry,id:'aliyun'}]},
 ...['https://evil.example','http://203.0.113.8','https://user:secret@evil.example','/'].map(origin=>({siteEdition:'global',backends:[{...entry,origin}]}))])assert.throws(()=>validateBackendConfig(bad));
});
