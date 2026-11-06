import { readSiteEdition, validateSiteRegistry, CN_COMMUNICATION_DISABLED } from '../shared/site-policy.js';
import { publicEventBatch } from '../shared/public-events.js';
import { chatBatch } from '../shared/chat.js';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { Store } from './store.js';
import { Rooms } from './rooms.js';
import { systemRoomAction as systemAction } from '../engine/runtime.js';
import type { ActionEnvelope, Identity } from '../shared/types.js';
import { validateRoomConfig } from '../shared/room-config.js';
import { connectivityInfo, multiplayerQuota, trustedOrigins, type BackendId } from '../shared/backend-protocol.js';
import { adminTokenConfigured, moderationAction, routeOperation, SECURITY_UNAVAILABLE } from '../shared/security.js';

const action=z.discriminatedUnion('type',[
  z.object({type:z.literal('kick'),playerId:z.string().uuid()}).strict(),
  z.object({type:z.literal('pause')}).strict(),z.object({type:z.literal('resume')}).strict(),
  z.object({type:z.literal('continue-vote'),continuationId:z.string().max(100),continue:z.boolean()}).strict(),
  z.object({type:z.literal('results-seen'),continuationId:z.string().max(100)}).strict(),
  z.object({type:z.literal('configure'),config:z.unknown().transform(value=>validateRoomConfig(value))}).strict(),
  z.object({type:z.literal('ready'),ready:z.boolean()}).strict(),z.object({type:z.literal('start'),threePlayerMode:z.enum(['single','double']).optional()}).strict(),
  z.object({type:z.literal('draft'),characterId:z.string().max(50)}).strict(),z.object({type:z.literal('select'),characterIds:z.array(z.string().max(50)).min(1).max(2)}).strict(),z.object({type:z.literal('practice-team'),characterIds:z.array(z.string().max(50)).refine(ids=>[4,6,8].includes(ids.length))}).strict(),
  z.object({type:z.literal('roll')}).strict(),z.object({type:z.literal('choose'),choiceId:z.string().max(100),optionId:z.string().max(100)}).strict(),
  z.object({type:z.literal('next')}).strict(),z.object({type:z.literal('rematch')}).strict(),z.object({type:z.literal('close')}).strict(),z.object({type:z.literal('transfer'),playerId:z.string().uuid()}).strict()]);
const envelope=z.object({actionId:z.string().uuid(),expectedVersion:z.number().int().nonnegative(),action}).strict();
const identity=z.object({roomCode:z.string().regex(/^[A-Z2-9]{6}$/),playerId:z.string().uuid(),token:z.string().min(40).max(100),role:z.enum(['player','spectator']).optional()}).strict();
const nickname=z.string().trim().min(1,'请输入昵称。').max(20,'昵称最多20个字。').refine(s=>!/[\p{Cc}\p{Cf}]/u.test(s),'昵称不能含控制字符。');
class RateLimiter { map=new Map<string,{count:number;at:number}>(); constructor(readonly limit:number,readonly ms:number){} accept(key:string):boolean {const now=Date.now();let r=this.map.get(key); if(!r||now-r.at>this.ms){r={count:0,at:now};this.map.set(key,r);} if(this.map.size>10000) for(const [k,v]of this.map)if(now-v.at>this.ms)this.map.delete(k);return ++r.count<=this.limit;} }

export function createApplication(dbPath=resolve(process.env.DATA_DIR??'data','rooms.sqlite')) {
  const siteEdition=readSiteEdition(process.env.SITE_EDITION,process.env.NODE_ENV==='production');
  if(process.env.NODE_ENV==='production'){const marker=JSON.parse(readFileSync(resolve('dist/client/site-edition.json'),'utf8'));if(marker.siteEdition!==siteEdition)throw Error('前端产物与 SITE_EDITION 不匹配。');}
  validateSiteRegistry(process.env.BACKENDS_CONFIG_JSON,siteEdition,'socketio');
  const backendId:BackendId=process.env.BACKEND_ID==='aliyun'||(process.env.BACKEND_ID===undefined&&siteEdition==='cn')?'aliyun':'cloudflare';
  if(process.env.BACKEND_ID&&backendId!==(siteEdition==='cn'?'aliyun':'cloudflare'))throw Error('BACKEND_ID 与 SITE_EDITION 不匹配。');
  const quota=multiplayerQuota(process.env.DUAL_BACKEND_ENABLED==='true'||backendId==='aliyun',process.env.MULTIPLAYER_ROOM_LIMIT);
  const store=new Store(dbPath,quota,siteEdition!=='cn'); const rooms=new Rooms(store,Number(process.env.ACTION_TIMEOUT_SECONDS??120),Date.now,siteEdition);
  const app=express(); const http=createServer(app);
  const controlled=process.env.CONTROLLED_VALIDATION==='true'&&['127.0.0.1','::1'].includes(process.env.HOST??'');
  const acceptingRooms=process.env.NODE_ENV!=='production'||process.env.PUBLIC_ACCESS_ENABLED==='true'||controlled;
  const origins=trustedOrigins([process.env.PUBLIC_ORIGIN,process.env.PUBLIC_ORIGINS].filter(Boolean).join(','));
  const allowedOrigin=(o:string|undefined)=>!o || origins.includes(o) || ((process.env.NODE_ENV!=='production'||controlled)&&/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(o));
  app.disable('x-powered-by'); if(process.env.TRUST_PROXY==='1') app.set('trust proxy',1);
  // GLTFLoader decodes embedded textures through blob URLs (fetch or image loading).
  app.use((req,res,next)=>{ res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'wasm-unsafe-eval'; img-src 'self' data: blob:; connect-src 'self' https: http: ws: wss: blob:; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"); if(req.method==='POST'&&!allowedOrigin(req.headers.origin)){res.status(403).json({error:'来源不被允许。'});return;}next();});
  app.use('/api',(req,res,next)=>{const origin=req.headers.origin;if(!allowedOrigin(origin)){res.status(403).json({error:'来源不被允许。'});return;}res.vary('Origin');if(origin)res.setHeader('Access-Control-Allow-Origin',origin);if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Max-Age','600');res.status(204).end();return;}next();});
  app.use(express.json({limit:'4kb'})); const apiRate=new RateLimiter(120,60000);
  app.use('/api',(req,res,next)=>{res.setHeader('Cache-Control','no-store');if(!apiRate.accept(req.ip??'unknown')){res.status(429).json({error:'请求太频繁，请稍后再试。'});return;}next();});
  app.use('/api',(req,_res,next)=>{if(['/health','/connectivity','/security/health'].includes(req.path))return next();try{store.security.append({kind:'network',operation:routeOperation(req.path),outcome:'attempt',transport:'http',ip:req.ip});next();}catch(error){next(error);}});
  app.get('/api/security/health',(_req,res)=>{const status=store.security.status();res.status(status.ok?200:503).json(status);});
  app.use('/api/stationmaster',(req,res,next)=>{
    if(siteEdition==='cn'){res.status(404).json({error:'当前站点已停用交流处置和安全审计。'});return;}
    const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress??'')&&req.headers['x-forwarded-for']===undefined&&req.headers['x-forwarded-proto']===undefined;
    if(!req.secure&&!local){res.status(403).json({error:'站长工具需要HTTPS或本机SSH隧道。'});return;}
    const secret=process.env.SECURITY_ADMIN_TOKEN,provided=req.headers.authorization?.replace(/^Bearer /,'')??'';
    if(!adminTokenConfigured(secret)||provided.length!==secret.length||!timingSafeEqual(Buffer.from(provided),Buffer.from(secret))){
      try{store.security.append({kind:'security',operation:'stationmaster-auth',outcome:'denied',transport:'http',ip:req.ip});}catch{}
      res.status(401).json({error:'站长权限验证失败或未配置。'});return;
    }next();
  });
  app.post('/api/stationmaster/rooms/:code',(req,res,next)=>{try{res.json(rooms.moderate(String(req.params.code).toUpperCase(),moderationAction(req.body)));}catch(error){next(error);}});
  app.get('/api/stationmaster/logs',(req,res,next)=>{try{const after=Number(req.query.after??0);if(!Number.isSafeInteger(after)||after<0)throw Error('游标错误。');res.json({records:store.security.list(after)});}catch(error){next(error);}});
  app.get('/api/stationmaster/evidence/:id',(req,res,next)=>{try{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)throw Error('编号错误。');res.json({record:store.security.evidence(id)??null});}catch(error){next(error);}});
  app.post('/api/stationmaster/logs/:id/hold',(req,res,next)=>{try{const b=z.object({held:z.boolean(),reason:z.string().trim().min(1).max(200)}).strict().parse(req.body),id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)throw Error('编号错误。');store.security.hold(id,b.held,b.reason);res.json({ok:true});}catch(error){next(error);}});
  app.use('/api/rooms',(_req,res,next)=>{if(!acceptingRooms){res.status(503).json({error:'阿里云内地尚未开放。'});return;}next();});
  const io=new Server(http,{maxHttpBufferSize:8192,serveClient:false,cors:{origin:(origin,callback)=>callback(null,allowedOrigin(origin)),methods:['GET','POST']},allowRequest:(req,cb)=>cb(null,allowedOrigin(req.headers.origin)),pingInterval:15000,pingTimeout:20000});
  let storageAlertAt=0;
  const storageAlert=()=>{if(Date.now()-storageAlertAt>60000){storageAlertAt=Date.now();console.error('ROOM_STORAGE_UNAVAILABLE: publication paused; inspect persistent storage.');}};
  const expireSafe=(code:string)=>{try{return rooms.expire(code);}catch{storageAlert();return true;}};
  const broadcast=(code:string)=>{if(expireSafe(code))return;const room=rooms.rooms.get(code);if(!room||room.closedAt!==undefined)return;for(const socket of io.sockets.sockets.values()) if(socket.data.identity?.roomCode===code) {
    const id=socket.data.identity.playerId;
    if(!room.game.players.some(p=>p.id===id)&&!room.spectators?.some(p=>p.id===id)){socket.emit('room-kicked',{code,message:'你已被房主踢出房间，原席位和准备状态已清除。'});socket.disconnect(true);continue;}
    socket.emit('snapshot',rooms.view(room,id));
  }};
  rooms.onChanged=broadcast;
  const notifyClosed=(code:string)=>{const room=rooms.rooms.get(code),closed=rooms.closed(code);if(room?.closedAt===undefined&&!closed)return;const sockets=[...io.sockets.sockets.values()].filter(socket=>socket.data.identity?.roomCode===code);for(const socket of sockets)socket.emit('room-closed',{code,closedAt:closed?.closedAt??room!.closedAt,...(closed?{reason:closed.reason}:{})});for(const socket of sockets)socket.disconnect(true);};
  rooms.onExpired=(code,expiresAt,reason='expired')=>{resuming.delete(code);const sockets=[...io.sockets.sockets.values()].filter(socket=>socket.data.identity?.roomCode===code);for(const socket of sockets)socket.emit('room-closed',{code,closedAt:expiresAt,reason});for(const socket of sockets)socket.disconnect(true);};
  const resuming=new Set<string>();let closing=false;
  const scheduleContinuation=(code:string)=>{if(closing||expireSafe(code))return;const current=rooms.rooms.get(code);if(resuming.has(code)||!current||current.closedAt!==undefined||current.pause||(current.continuation&&current.continuation.stage!=='playing')||!systemAction(current.game))return;resuming.add(code);setImmediate(()=>{resuming.delete(code);if(closing||expireSafe(code))return;const room=rooms.rooms.get(code);if(!room||room.closedAt!==undefined||room.pause)return;try{const next=systemAction(room.game);if(!next)return;const result=rooms.act(code,next.playerId,{actionId:crypto.randomUUID(),expectedVersion:room.version,action:next.action});if(result.ok){broadcast(code);scheduleContinuation(code);}}catch{storageAlert();}});};
  app.get('/api/health',(_req,res)=>res.json({ok:true,storage:'sqlite',version:'0.1.0',security:store.security.status(),publicAccessEnabled:process.env.PUBLIC_ACCESS_ENABLED==='true',controlledValidation:controlled}));
  app.get('/api/connectivity',(_req,res)=>res.json({...connectivityInfo(backendId),siteEdition}));
  app.get('/api/rooms',(_req,res,next)=>{try{res.json({rooms:rooms.list(),capacity:rooms.capacity()});}catch(e){next(e);}});
  app.post('/api/rooms',(req,res,next)=>{try{const b=z.object({name:nickname,nicknameId:z.string().optional(),maxPlayers:z.number().int().min(2).max(8).default(8),timeoutSeconds:z.union([z.literal(0),z.number().int().min(30).max(600)]).optional(),mode:z.enum(['multiplayer','practice','ai']).optional(),aiCount:z.number().int().min(1).max(7).optional(),characterPool:z.enum(['original','second-wind','mixed','wurstii','all']).optional(),config:z.unknown().optional().transform(value=>value===undefined?undefined:validateRoomConfig(value)),requestId:z.string().regex(/^[a-zA-Z0-9_-]{16,100}$/).optional()}).strict().parse(req.body);res.status(201).json(rooms.create(b.name,b.maxPlayers,b.timeoutSeconds,b.mode,b.aiCount,b.characterPool,b.config,b.requestId,b.nicknameId));}catch(e){next(e);}});
  app.post('/api/rooms/:code/join',(req,res,next)=>{try{const b=z.object({name:nickname,nicknameId:z.string().optional(),role:z.enum(['player','spectator']).optional()}).strict().parse(req.body);const r=rooms.join(String(req.params.code),b.name,b.role,b.nicknameId);res.status(201).json(r);broadcast(r.identity.roomCode);}catch(e){next(e);}});
  app.post('/api/rooms/:code/resume-status',(req,res,next)=>{try{
    const i=identity.parse(req.body) as Identity;if(i.roomCode!==String(req.params.code).toUpperCase())throw Error('房间身份不匹配。');
    rooms.expire(i.roomCode);const existing=rooms.rooms.get(i.roomCode);
    if(!existing){res.status(rooms.closed(i.roomCode)?410:404).json({error:rooms.closed(i.roomCode)?'房间已关闭。请创建或加入其他房间。':'房间不存在或已过期，请检查房间码。'});return;}
    if(existing.closedAt!==undefined){res.status(410).json({error:'房间已关闭。请创建或加入其他房间。'});return;}
    let room=existing;try{room=rooms.authenticate(i);}catch{res.status(401).json({error:'恢复凭据无效。'});return;}
    // Inspecting a saved room is not a connection: only a real socket may
    // restore presence and cancel the owner's departure deadline.
    const view=rooms.view(room,i.playerId);
    res.json({ok:true,ownerId:room.ownerId??room.hostId,mode:room.mode??'multiplayer',phase:room.game.phase,createdAt:room.createdAt,hostLeftAt:room.hostLeftAt,expiresAt:view.expiresAt});
  }catch(e){next(e);}});
  app.post('/api/rooms/:code/leave',(req,res,next)=>{try{
    const i=identity.parse(req.body) as Identity;if(i.roomCode!==String(req.params.code).toUpperCase())throw Error('房间身份不匹配。');
    rooms.expire(i.roomCode);const room=rooms.rooms.get(i.roomCode);
    if(!room){res.status(rooms.closed(i.roomCode)?410:404).json({error:rooms.closed(i.roomCode)?'房间已关闭。请创建或加入其他房间。':'房间不存在或已过期，请检查房间码。'});return;}
    if(room.closedAt!==undefined){res.status(410).json({error:'房间已解散。请创建或加入其他房间。'});return;}
    try{rooms.authenticate(i);}catch{res.status(401).json({error:'退出凭据无效。'});return;}
    const result=rooms.leave(i);res.json(result);
    for(const socket of io.sockets.sockets.values())if(socket.data.identity?.roomCode===i.roomCode&&socket.data.identity.playerId===i.playerId)socket.disconnect(true);
    if(rooms.rooms.get(i.roomCode)?.closedAt!==undefined)notifyClosed(i.roomCode);else broadcast(i.roomCode);
  }catch(e){next(e);}});
  const connections=new Map<string,Set<string>>(); const socketRate=new RateLimiter(40,10000);
  io.use((socket,next)=>{try{
    const address=socket.handshake.address,ip=process.env.TRUST_PROXY==='1'&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address)?String(socket.handshake.headers['x-real-ip']??address):address;
    if(!apiRate.accept(ip))throw Error('连接太频繁。');
    if(socket.handshake.auth?.probe===true){socket.data.probe=true;next();return;}
    store.security.append({kind:'network',operation:'socket-auth',outcome:'attempt',transport:'socketio',ip});
    if(!acceptingRooms)throw Error('阿里云内地尚未开放。');const i=identity.parse(socket.handshake.auth) as Identity;rooms.authenticate(i);
    if((connections.get(`${i.roomCode}:${i.playerId}`)?.size??0)>=5)throw Error('同一身份打开的页面过多。');
    store.security.append({kind:'network',operation:'socket-auth',outcome:'accepted',transport:'socketio',ip,roomCode:i.roomCode,playerId:i.playerId});socket.data.identity=i;socket.data.securityIp=ip;next();
  }catch(e){next(Error(e instanceof Error?e.message:'身份无效。'));}});
  io.on('connection',socket=>{
    if(socket.data.probe){socket.emit('connectivity',{...connectivityInfo(backendId),siteEdition});const timeout=setTimeout(()=>socket.disconnect(true),1500);timeout.unref();socket.once('disconnect',()=>clearTimeout(timeout));return;}
    const i=socket.data.identity as Identity;if(expireSafe(i.roomCode)){socket.disconnect(true);return;}if(rooms.rooms.get(i.roomCode)?.closedAt!==undefined){notifyClosed(i.roomCode);return;}const key=`${i.roomCode}:${i.playerId}`;let set=connections.get(key);if(!set){set=new Set();connections.set(key,set);}set.add(socket.id);
    try{rooms.presence(i.roomCode,i.playerId,true);}catch{storageAlert();set.delete(socket.id);socket.disconnect(true);return;}broadcast(i.roomCode);
    socket.on('sync',()=>{try{if(expireSafe(i.roomCode))return;const room=rooms.rooms.get(i.roomCode);if(room?.closedAt!==undefined){notifyClosed(i.roomCode);return;}if(room&&socketRate.accept(key))socket.emit('snapshot',rooms.view(room,i.playerId));}catch{storageAlert();}});
    socket.on('events',(input:unknown,ack:unknown)=>{
      if(typeof ack!=='function')return;
      try{if(!socketRate.accept(key))throw Error('动画记录请求太频繁。');const query=z.object({afterId:z.number().int().nonnegative()}).strict().parse(input);ack({ok:true,batch:publicEventBatch(rooms.get(i.roomCode),i.playerId,query.afterId)});}
      catch(error){ack({ok:false,error:error instanceof z.ZodError?'动画记录请求格式不正确。':error instanceof Error?error.message:'无法读取动画记录。'});}
    });
    const publishChat=()=>{
      // A committed send/rename can cross the owner's absence deadline before
      // publication; rename's preceding snapshot broadcast may already close it.
      if(expireSafe(i.roomCode))return;
      const room=rooms.rooms.get(i.roomCode);if(!room||room.closedAt!==undefined)return;
      if(siteEdition==='cn')return;
      const batch=chatBatch(room.chat);
      for(const target of io.sockets.sockets.values())if(target.data.identity?.roomCode===i.roomCode)target.emit('chat',batch);
    };
    for(const event of ['phrase-send','emoji-send','reaction','player-message'])socket.on(event,(_input:unknown,ack:unknown)=>{if(typeof ack==='function')ack({ok:false,error:siteEdition==='cn'?CN_COMMUNICATION_DISABLED:'消息协议不支持。'});});
    socket.on('chat-send',(input:unknown,ack:unknown)=>{
      const result=socketRate.accept(key)?rooms.chat(i.roomCode,i.playerId,input):{ok:false,error:'操作太频繁。'};if(typeof ack==='function')ack(result);if(result.ok&&!result.duplicate)publishChat();
    });
    socket.on('chat-sync',(input:unknown,ack:unknown)=>{
      if(typeof ack!=='function')return;
      try{if(!socketRate.accept(key))throw Error('聊天同步太频繁。');const query=z.object({afterId:z.number().int().nonnegative().optional()}).strict().parse(input);ack({ok:true,...rooms.chatHistory(i.roomCode,i.playerId,query.afterId??0)});}
      catch(error){ack({ok:false,error:error instanceof Error?error.message:'聊天同步失败。'});}
    });
    socket.on('rename',(input:unknown,ack:unknown)=>{
      let result;try{if(!socketRate.accept(key))throw Error('操作太频繁。');const query=z.object({requestId:z.string().max(100),name:z.string()}).strict().parse(input);result=rooms.rename(i.roomCode,i.playerId,query.requestId,query.name);}catch(error){result={ok:false,error:error instanceof Error?error.message:'修改昵称失败。'};}
      if(typeof ack==='function')ack(result);if(result.ok){broadcast(i.roomCode);publishChat();}
    });
    socket.on('action',(input:unknown,ack:unknown)=>{let result;let parsed:ActionEnvelope|undefined;try{if(!socketRate.accept(key))throw Error('操作太快，请稍后重试。');parsed=envelope.parse(input) as ActionEnvelope;result=rooms.act(i.roomCode,i.playerId,parsed);}catch(e){result={ok:false,error:e instanceof z.ZodError?'操作格式不正确。':e instanceof Error?e.message:'操作失败。'};} if(typeof ack==='function')ack(result);if(result.ok&&(rooms.rooms.get(i.roomCode)?.closedAt!==undefined||rooms.closed(i.roomCode))){resuming.delete(i.roomCode);notifyClosed(i.roomCode);return;}if(result.ok&&!result.duplicate&&parsed?.action.type==='kick')publishChat();broadcast(i.roomCode);scheduleContinuation(i.roomCode);});
    socket.on('disconnect',()=>{try{store.security.append({kind:'network',operation:'socket-close',outcome:'disconnected',transport:'socketio',ip:socket.data.securityIp,roomCode:i.roomCode,playerId:i.playerId});}catch{}const list=connections.get(key);list?.delete(socket.id);if(!list?.size){connections.delete(key);try{rooms.presence(i.roomCode,i.playerId,false);broadcast(i.roomCode);}catch{storageAlert();}}});
  });
  const timer=setInterval(()=>{try{for(const code of rooms.tick()){broadcast(code);scheduleContinuation(code);}}catch{storageAlert();}},250);timer.unref();
  const cleanup=setInterval(()=>{try{store.security.cleanup(500,new Set(rooms.rooms.keys()));}catch{console.error('SECURITY_CLEANUP_FAILED: retained records left intact.');}},15*60_000);cleanup.unref();
  for(const code of rooms.rooms.keys())scheduleContinuation(code);
  const clientDir=resolve(fileURLToPath(new URL('../../../dist/client/',import.meta.url)));
  // Compiled entry is dist/server/server/index.js; dev entry is src/server/index.ts.
  const staticDir=existsSync(resolve('dist/client/index.html'))?resolve('dist/client'):clientDir;
  app.get('/backends.json',(_req,res)=>{res.setHeader('Cache-Control','no-store');res.json({siteEdition,backends:[{id:backendId,origin:'',transport:'socketio',enabled:true}]});});
  app.get(/^\/lobby$/,(req,res)=>{res.setHeader('Cache-Control','no-store');res.redirect(308,'/lobby/'+new URL(req.originalUrl,'http://localhost').search);});
  app.get('/lobby/',(_req,res)=>{res.setHeader('Cache-Control','no-store');res.sendFile(resolve(staticDir,'lobby/index.html'));});
  app.use(express.static(staticDir,{index:false,maxAge:'1h',setHeaders:(res,path)=>{if(path.endsWith('backends.json')||path.includes(`${sep}lobby${sep}`))res.setHeader('Cache-Control','no-store');}}));
  app.get('/{*path}',(_req,res)=>{if(existsSync(resolve(staticDir,'index.html')))res.sendFile(resolve(staticDir,'index.html'));else res.status(503).send('前端尚未构建。请运行 pnpm build。');});
  app.use((e:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{res.status(e instanceof Error&&e.message===SECURITY_UNAVAILABLE?503:400).json({error:e instanceof z.ZodError?e.issues[0]?.message:e instanceof Error?e.message:'请求失败。'});});
  return {app,http,io,rooms,store,close:async()=>{closing=true;clearInterval(timer);clearInterval(cleanup);await new Promise<void>(r=>io.close(()=>r()));if(http.listening)await new Promise<void>(r=>http.close(()=>r()));store.close();}};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const application=createApplication(); const port=Number(process.env.PORT??3000);
  application.http.listen(port,process.env.HOST??'0.0.0.0',()=>console.log(`Magical Athlete listening on ${port}`));
  for(const signal of ['SIGTERM','SIGINT'] as const)process.once(signal,()=>{void application.close().then(()=>process.exit(0));});
}
