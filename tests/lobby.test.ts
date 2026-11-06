import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// @ts-ignore Browser-native module.
import { games, validateConfig, readInvitation, entryURL, currentLobby, lobbyURL, readPreference } from '../lobby/routing.mjs';
const source=JSON.parse(readFileSync(new URL('../lobby/config.json',import.meta.url),'utf8'));
function config(edition:string){const server=edition==='cn'?'aliyun':'cloudflare';return validateConfig({version:2,siteEdition:edition,lobbies:{[server]:source.lobbies[server]},entries:Object.fromEntries(games.map((game:string)=>[game,{[server]:source.entries[game][server]}]))});}

test('each independently built lobby exposes exactly its own three entries and no cross-site link',()=>{
 for(const edition of ['cn','global']){
  const site=config(edition),server=edition==='cn'?'aliyun':'cloudflare',other=server==='aliyun'?'cloudflare':'aliyun';
  assert.equal(currentLobby(site,source.lobbies[server].url),server);
  assert.equal(currentLobby(site,source.lobbies[other].url),null);
  for(const game of games){assert.equal(new URL(entryURL(site,game,server)).origin,source.entries[game][server].origin);assert.equal(entryURL(site,game,other),null);}
  assert.equal(lobbyURL(site,other),null);
  assert.equal(currentLobby(site,'http://127.0.0.1:9876/?server='+other),server);
 }
 assert.equal(readPreference({getItem:()=> 'aliyun'}),null);
});

test('invitations retain only same-site game/code/role and never carry credentials or foreign navigation',()=>{
 for(const edition of ['cn','global']){
  const site=config(edition),server=edition==='cn'?'aliyun':'cloudflare',prefix=edition==='cn'?'A':'C',other=prefix==='A'?'C':'A';
  for(const game of games){
   const code=game==='wizard'?'ABCD2345':'ABC234';
   const invite=readInvitation(`?game=${game}&room=${prefix}-${code}&token=secret&next=https://evil.example`);
   const url=new URL(entryURL(site,game,server,invite));assert.ok(!url.href.includes('secret')&&!url.href.includes('evil'));
   const foreign=readInvitation(`?game=${game}&room=${other}-${code}`);assert.equal(entryURL(site,game,server,foreign),null);
  }
 }
 for(const query of ['?game=athlete&room=A-ABC234&server=cloudflare','?game=athlete&room=ABC234','?game=catan&room=A-ABC234&watch=1','?game=wizard&room=C-ABCD2345&game=athlete'])assert.throws(()=>readInvitation(query));
});

test('deployment config rejects missing/mixed editions, duplicate game origins and unsafe URLs',()=>{
 for(const edition of ['cn','global']){
  const site=config(edition),server=edition==='cn'?'aliyun':'cloudflare';
  for(const origin of ['http://evil.example','https://evil.example/path','https://user:password@evil.example','https://evil.example/?token=x']){const bad=structuredClone(site);bad.entries.athlete[server].origin=origin;assert.throws(()=>validateConfig(bad));}
  const mixed=structuredClone(site);mixed.lobbies[server==='aliyun'?'cloudflare':'aliyun']=source.lobbies[server];assert.throws(()=>validateConfig(mixed));
 }
 assert.throws(()=>validateConfig(source));
});
