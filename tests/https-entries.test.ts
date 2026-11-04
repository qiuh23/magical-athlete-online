import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { backendEntryUrl, roomEntryUrl, spectatorInvite, validateBackendConfig } from '../src/client/backends.js';
const {deploymentSettings,deploymentRegistry,validateDeployedRegistry,workerVariables}=await import(new URL('../scripts/deploy/ci-release.mjs',import.meta.url).href);
const {httpsGameDomain,renderHttpsSite}=await import(new URL('../scripts/deploy/render-https.mjs',import.meta.url).href);
const entries=JSON.parse(readFileSync(new URL('../deploy/entries.json',import.meta.url),'utf8'));

test('one reviewed registry supplies builds and repeated releases without HTTPS falling back to legacy HTTP',()=>{
  assert.deepEqual(JSON.parse(readFileSync(new URL('../public/backends.json',import.meta.url),'utf8')),deploymentRegistry(deploymentSettings('production',entries)));
  const transitioned=structuredClone(entries);
  transitioned.production.aliyunOrigin=transitioned.production.plannedAliyunOrigin;
  transitioned.production.allowInsecureHttp=false;
  const settings=deploymentSettings('production',transitioned);
  const registry=deploymentRegistry(settings);
  assert.equal(registry.backends[1].origin,'https://athlete.magical-athlete-online.cn');
  assert.equal(registry.backends[1].allowInsecureHttp,undefined);
  assert.deepEqual(deploymentRegistry(deploymentSettings('production',transitioned)),registry);
  assert.equal(deploymentSettings('preview',transitioned).aliyunOrigin,entries.preview.aliyunOrigin);
  validateBackendConfig(registry);
  const nodeRegistry=structuredClone(registry);
  nodeRegistry.backends[0].origin=settings.cloudflareOrigin;
  nodeRegistry.backends[1].origin='';
  validateDeployedRegistry(nodeRegistry,settings.aliyunOrigin,settings);
  validateDeployedRegistry(registry,settings.cloudflareOrigin,settings);
  const stale=deploymentRegistry(deploymentSettings('production',entries));
  assert.throws(()=>validateDeployedRegistry(stale,settings.cloudflareOrigin,settings),/differs/);
  transitioned.production.aliyunOrigin='http://115.29.188.62';
  assert.throws(()=>deploymentSettings('production',transitioned),/HTTPS/);
  for(const invalid of ['https://cn.example/path','https://user:secret@cn.example','https://cn.example/?redirect=https://evil.example','*']) {
    transitioned.production.aliyunOrigin=invalid;
    assert.throws(()=>deploymentSettings('production',transitioned));
  }
});

test('HTTPS spectator invitations keep server and public role while discarding tokens and arbitrary destinations',()=>{
  const target={id:'aliyun' as const,label:'国内',origin:'https://athlete.magical-athlete-online.cn',transport:'socketio' as const,enabled:true};
  const invitation=roomEntryUrl(target,'A-ABC234',true);
  assert.equal(invitation,'https://athlete.magical-athlete-online.cn/room/A-ABC234?spectate=1');
  assert.equal(backendEntryUrl(target,'A-ABC234','https://magical-athlete.qiuh23.workers.dev',true),invitation);
  assert.equal(backendEntryUrl(target,'A-ABC234',target.origin,true),null);
  assert.equal(spectatorInvite('?token=private&spectate=1&url=https://evil.example'),true);
  assert.equal(spectatorInvite('?spectate=0'),false);
  assert.equal(roomEntryUrl(target,'A-ABC234?token=private',true),target.origin+'/');
});

test('HTTPS activation preserves exact old-page Origins in both Worker release paths without mixing preview or navigation targets',()=>{
  const transitioned=structuredClone(entries);
  transitioned.production.aliyunOrigin=transitioned.production.plannedAliyunOrigin;
  transitioned.production.allowInsecureHttp=false;
  const settings=deploymentSettings('production',transitioned);
  assert.deepEqual(settings.publicOrigins,['https://athlete.magical-athlete-online.cn','http://115.29.188.62']);
  const variables=workerVariables(settings,{OTHER:'preserved',PUBLIC_ORIGINS:'stale'});
  assert.equal(variables.OTHER,'preserved');
  assert.equal(variables.PUBLIC_ORIGINS,'https://athlete.magical-athlete-online.cn,http://115.29.188.62');
  assert.deepEqual(JSON.parse(variables.BACKENDS_CONFIG_JSON),deploymentRegistry(settings));
  assert.equal(JSON.parse(variables.BACKENDS_CONFIG_JSON).backends[1].origin,settings.aliyunOrigin);
  assert.deepEqual(deploymentSettings('preview',transitioned).publicOrigins,['http://115.29.188.62:8080']);
  const source=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
  assert.deepEqual(source.vars,workerVariables(deploymentSettings('production',entries),source.vars),'Workers Builds source configuration must match the same policy as checked-artifact prepare()');
  for(const value of ['*','https://*.example.cn','https://cn.example/path','https://user:pass@cn.example','https://cn.example/?token=x','https://cn.example/#x','http://115.29.188.62:8080',entries.preview.cloudflareOrigin]) {
    const bad=structuredClone(transitioned);bad.production.legacyOrigins=[value];
    assert.throws(()=>deploymentSettings('production',bad));
  }
  for(const value of ['http://115.29.188.62',['http://115.29.188.62','http://115.29.188.62']]) {
    const bad=structuredClone(transitioned);bad.production.legacyOrigins=value;
    assert.throws(()=>deploymentSettings('production',bad),/Legacy origins/);
  }
});

test('HTTPS vhost keeps ACME renewal, exact host/origin and realtime upgrades separate from IP and preview',()=>{
  const domain='athlete.magical-athlete-online.cn',config=renderHttpsSite(domain);
  assert.match(config,/server_name athlete\.magical-athlete-online\.cn;/);
  assert.match(config,/listen 443 ssl/);
  assert.match(config,/proxy_pass http:\/\/127\.0\.0\.1:3000/);
  assert.match(config,/proxy_set_header Host \$http_host/);
  assert.match(config,/proxy_set_header Origin \$http_origin/);
  assert.match(config,/proxy_set_header Upgrade \$http_upgrade/);
  assert.match(config,/location \^~ \/\.well-known\/acme-challenge\//);
  assert.doesNotMatch(config,/default_server|8080|3001|115\.29\.188\.62|ssl_protocols.*TLSv1[ ;]/);
  assert.doesNotMatch(renderHttpsSite(domain,false),/ssl_certificate/);
  for(const value of ['*.example.cn','https://example.cn','example.cn;','127.0.0.1','example.cn:443','other.cn\nlisten 1234;'])assert.throws(()=>httpsGameDomain(value));
});
