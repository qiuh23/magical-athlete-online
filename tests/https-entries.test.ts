import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { backendEntryUrl, roomEntryUrl, spectatorInvite, validateBackendConfig } from '../src/client/backends.js';
const {deploymentSettings,deploymentRegistry,validateDeployedRegistry,workerVariables}=await import(new URL('../scripts/deploy/ci-release.mjs',import.meta.url).href);
const {httpsGameDomain,renderHttpsSite}=await import(new URL('../scripts/deploy/render-https.mjs',import.meta.url).href);
const entries=JSON.parse(readFileSync(new URL('../deploy/entries.json',import.meta.url),'utf8'));

test('release registries and worker policy stay within the trusted site and preview environment',()=>{
 for(const target of ['production','preview']){
  const settings=deploymentSettings(target,entries);
  for(const [edition,origin,id] of [['global',settings.cloudflareOrigin,'cloudflare'],['cn',settings.aliyunOrigin,'aliyun']]){
   const registry=deploymentRegistry(settings,edition);assert.equal(registry.siteEdition,edition);assert.equal(registry.backends.length,1);assert.equal(registry.backends[0].id,id);assert.equal(registry.backends[0].origin,'');
   validateDeployedRegistry(registry,origin,settings);
   assert.throws(()=>validateDeployedRegistry(registry,id==='cloudflare'?settings.aliyunOrigin:settings.cloudflareOrigin,settings));
  }
  const vars=workerVariables(settings,{OTHER:'preserved'});assert.equal(vars.SITE_EDITION,'global');assert.equal(vars.PUBLIC_ORIGINS,settings.cloudflareOrigin);assert.equal(vars.OTHER,'preserved');
 }
 const source=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
 assert.deepEqual(source.vars,workerVariables(deploymentSettings('production',entries),source.vars));
 assert.deepEqual(JSON.parse(readFileSync(new URL('../public/backends.json',import.meta.url),'utf8')),deploymentRegistry(deploymentSettings('production',entries),'global'));
 const unsafe=structuredClone(entries);unsafe.production.aliyunOrigin='http://115.29.188.62';assert.throws(()=>deploymentSettings('production',unsafe));
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


test('mainland templates and host migration stop new access audits while retaining fault and game recovery data',()=>{
 for(const name of ['nginx-http.conf.template','nginx-preview.conf.template','nginx.conf.template','nginx-lobby.conf.template']){
  const nginx=readFileSync(new URL('../deploy/'+name,import.meta.url),'utf8');assert.match(nginx,/access_log off;/);assert.doesNotMatch(nginx,/access_log \/var\/log\/game-network/);assert.match(nginx,/error_log \/var\/log\/nginx\/error\.log warn;/);
 }
 const migrate=readFileSync(new URL('../scripts/deploy/disable-cn-audit.sh',import.meta.url),'utf8');assert.match(migrate,/\/etc\/cron\.d\/game-network-rotation/);assert.doesNotMatch(migrate,/rm[^\n]*(?:security\.sqlite|rooms\.sqlite|game-network\/.*\.log)/);
 for(const name of ['security-preflight.sh','security-maintenance.sh'])assert.match(readFileSync(new URL('../scripts/deploy/'+name,import.meta.url),'utf8'),/SITE_EDITION=cn/);
 const rollback=readFileSync(new URL('../scripts/deploy/rollback.sh',import.meta.url),'utf8');assert.match(rollback,/site-edition\.json/);assert.match(rollback,/siteEdition!=='cn'/);
});
