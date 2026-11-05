// Local workerd/SQLite DO smoke. Uses Wrangler's existing Miniflare dependency;
// never calls a Cloudflare API, deploys, or adds a remote CI job.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp,rm,mkdir,writeFile,realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve,join,sep } from 'node:path';
const require=createRequire(await realpath(resolve('node_modules/wrangler/package.json')));
const {Miniflare}=require('miniflare'),{build}=require('esbuild');
const directory=await mkdtemp(join(tmpdir(),'athlete-workerd-'));
const secret='local_test_admin_0123456789_ABCDEF';
let mf;
try{
  // Test-only storage seeding is compiled into this temporary harness, never
  // src/ or production. It advances retention fixtures without waiting months.
  const source=`import handler,{RoomRelay as Base} from ${JSON.stringify(resolve('src/worker/index.ts').replaceAll('\\','/'))};
    export class RoomRelay extends Base {
      async fetch(request){const path=new URL(request.url).pathname;
        if(path==='/__test__/expire'){
          const entries=await this.ctx.storage.list({prefix:'security:event:'});
          for(const [key,row]of entries){await this.ctx.storage.delete('security:expiry:'+String(row.expires_at).padStart(16,'0')+':e:'+String(row.id).padStart(16,'0'));row.expires_at=Date.now()-1;await this.ctx.storage.put(key,row);if(!row.held)await this.ctx.storage.put('security:expiry:'+String(row.expires_at).padStart(16,'0')+':e:'+String(row.id).padStart(16,'0'),{type:'event',id:row.id});}
          await this.alarm();return Response.json({ok:true});
        }
        return super.fetch(request);
      }
    }
    export default handler;`;
  const bundle=await build({stdin:{contents:source,resolveDir:process.cwd(),sourcefile:'local-security-harness.ts'},bundle:true,write:false,format:'esm',platform:'browser',target:'es2023',external:['cloudflare:workers']});
  const options={name:'athlete-security-local',modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-10-20',durableObjects:{ROOMS:{className:'RoomRelay',useSQLite:true}},resourcePersistencePath:join(directory,'objects'),bindings:{SECURITY_ADMIN_TOKEN:secret,SECURITY_MAX_BYTES:'1048576',DUAL_BACKEND_ENABLED:'true'},serviceBindings:{ASSETS:()=>new Response('local asset')},log:new (require('miniflare').Log)(require('miniflare').LogLevel.ERROR)};
  mf=new Miniflare(require('miniflare').convertV4MiniflareOptions(options));await mf.ready;
  const request=(path,init={})=>mf.dispatchFetch('https://local.test'+path,init);
  const post=(path,body,admin=false)=>request(path,{method:'POST',headers:{'Content-Type':'application/json',...(admin?{Authorization:'Bearer '+secret}:{})},body:JSON.stringify(body)});
  const created=await (await post('/api/browser/rooms',{name:'待处理昵称',maxPlayers:2,requestId:'local_create_0123456789'})).json();assert.ok(created.identity,JSON.stringify(created));
  const code=created.identity.roomCode,identity=created.identity;
  const connect=async()=>{const response=await request('/api/browser/ws/'+code,{headers:{Upgrade:'websocket'}});assert.equal(response.status,101);const socket=response.webSocket;socket.accept();const messages=[];socket.addEventListener('message',event=>messages.push(JSON.parse(event.data)));socket.send(JSON.stringify({type:'auth',identity}));await until(()=>messages.some(message=>message.type==='auth-ok'));return {socket,messages};};
  async function until(predicate){const end=Date.now()+8000;while(!predicate()){assert.ok(Date.now()<end,'local workerd message timed out');await new Promise(done=>setTimeout(done,10));}}
  const peer=await connect();peer.socket.send(JSON.stringify({type:'chat-send',requestId:'send-local',clientMessageId:'local-message',text:'本地需隐藏原文'}));await until(()=>peer.messages.some(message=>message.result?.ok));
  const adminPath='/api/stationmaster/rooms/'+code;
  assert.equal((await post(adminPath,{action:'inspect'})).status,401);
  const hidden=await post(adminPath,{action:'hide-chat',seq:1,reason:'本地举报测试'},true);assert.equal(hidden.status,200);const recordId=(await hidden.json()).recordId;
  await until(()=>peer.messages.some(message=>message.type==='chat'&&message.messages.some(item=>item.hidden)));
  assert.equal((await post(adminPath,{action:'reset-name',memberId:identity.playerId,reason:'本地昵称测试'},true)).status,200);
  await until(()=>peer.messages.some(message=>message.type==='snapshot'&&message.room.players[0].name.startsWith('成员')));
  peer.socket.close();await mf.dispose();mf=new Miniflare(require('miniflare').convertV4MiniflareOptions(options));await mf.ready;
  const restored=await connect(),last=restored.messages.filter(message=>message.type==='snapshot').at(-1);assert.ok(last.room.players[0].name.startsWith('成员'));assert.equal(last.room.chat[0].hidden,true);assert.equal(JSON.stringify(last).includes('本地需隐藏原文'),false);
  assert.equal((await post('/api/stationmaster/logs/'+recordId+'/hold',{held:true,reason:'本地保全'},true)).status,200);
  assert.equal((await post(adminPath,{action:'close-room',reason:'本地关闭测试'},true)).status,200);
  const ns=await mf.getDurableObjectNamespace('ROOMS'),ledger=ns.get(ns.idFromName('security-ledger-v1'));
  let list=await (await ledger.fetch('https://local/security/list',{method:'POST',body:JSON.stringify({after:0})})).json();assert.ok(list.records.length>0);
  const evidence=await (await request('/api/stationmaster/evidence/'+recordId,{headers:{Authorization:'Bearer '+secret}})).json();assert.equal(evidence.record.text,'本地需隐藏原文');
  await ledger.fetch('https://local/__test__/expire');list=await (await ledger.fetch('https://local/security/list',{method:'POST',body:'{"after":0}'})).json();assert.equal(list.records.length,2);assert.ok(list.records.every(record=>record.held));
  await ledger.fetch('https://local/security/hold',{method:'POST',body:JSON.stringify({id:recordId,held:false})});await ledger.fetch('https://local/__test__/expire');list=await (await ledger.fetch('https://local/security/list',{method:'POST',body:'{"after":0}'})).json();assert.equal(list.records.length,0);
  let appended=0;for(;appended<10000;appended++){const response=await ledger.fetch('https://local/security/append',{method:'POST',body:JSON.stringify({kind:'network',operation:'capacity-local',outcome:'accepted',reason:'a'.repeat(200)})});if(response.status===503)break;assert.equal(response.status,200);}
  assert.ok(appended<10000);const blocked=await post('/api/browser/rooms',{name:'不可发布'});assert.equal(blocked.status,503);const status=await(await request('/api/security/health')).json();assert.equal(status.ok,false);
  await ledger.fetch('https://local/__test__/expire');assert.equal((await post('/api/browser/rooms',{name:'清理后恢复'})).status,201);
  const result={checkedAt:new Date().toISOString(),runtime:'local Miniflare/workerd, real SQLite-backed RoomRelay',passed:['independent admin permission','real WebSocket message hiding','nickname replacement','persistent restart and reconnect','room closure keeps separate ledger','targeted evidence and hold','expiry cleanup and release','configured capacity failure blocks create','expired-page reuse restores publication'],notVerified:['production Cloudflare deployment/quota/billing','physical mobile device','real six-month elapsed time (expiry fixtures seeded by local harness)']};
  await mkdir('.local',{recursive:true});await writeFile('.local/security-worker-smoke-result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{
  await mf?.dispose();
  if(!resolve(directory).startsWith(resolve(tmpdir())+sep+'athlete-workerd-'))throw Error('Unexpected test directory');
  await rm(directory,{recursive:true,force:true});
}
