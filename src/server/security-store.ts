import { DatabaseSync } from 'node:sqlite';
import { chmodSync, mkdirSync, statfsSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { SECURITY_UNAVAILABLE, networkExpiry, securityEvent, type SecurityEvent } from '../shared/security.js';

export class SecurityStore {
  readonly db:DatabaseSync; private failure=false; private warnings:string[]=[];private alertedAt=0;
  constructor(readonly path:string,readonly now=Date.now,public enabled=true) {
    if(path!==':memory:')mkdirSync(dirname(path),{recursive:true,mode:0o750});
    this.db=new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL;PRAGMA synchronous=FULL;PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS security_events(id INTEGER PRIMARY KEY AUTOINCREMENT,at INTEGER NOT NULL,expires_at INTEGER NOT NULL,held INTEGER NOT NULL DEFAULT 0,event TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS security_expiry ON security_events(held,expires_at,id);
      CREATE TABLE IF NOT EXISTS moderation(room_code TEXT NOT NULL,kind TEXT NOT NULL,target TEXT NOT NULL,at INTEGER NOT NULL,expires_at INTEGER NOT NULL,event_id INTEGER,PRIMARY KEY(room_code,kind,target));
      CREATE TABLE IF NOT EXISTS security_evidence(id INTEGER PRIMARY KEY,room_code TEXT NOT NULL,at INTEGER NOT NULL,expires_at INTEGER NOT NULL,held INTEGER NOT NULL DEFAULT 0,evidence TEXT NOT NULL);`);
    this.db.exec('CREATE TABLE IF NOT EXISTS security_health(id INTEGER PRIMARY KEY CHECK(id=1),at INTEGER NOT NULL);INSERT OR IGNORE INTO security_health VALUES(1,0);');
    if(path!==':memory:')for(const file of [path,path+'-wal',path+'-shm']){try{chmodSync(file,0o600);}catch{}}
  }
  private capacity():void {
    this.warnings=[];if(this.path===':memory:')return;
    const stats=statfsSync(dirname(this.path)),free=Number(stats.bavail)*Number(stats.bsize),total=Number(stats.blocks)*Number(stats.bsize);
    const reserve=Number(process.env.SECURITY_MIN_FREE_BYTES??67108864),warnRatio=Number(process.env.SECURITY_DISK_WARN_RATIO??0.2),max=Number(process.env.SECURITY_MAX_BYTES??1073741824);
    const value=(name:string)=>Number(Object.values(this.db.prepare('PRAGMA '+name).get()!)[0]);
    const bytes=(value('page_count')-value('freelist_count'))*value('page_size');
    if(!Number.isFinite(reserve)||reserve<0||!Number.isFinite(max)||max<1048576||!Number.isFinite(warnRatio)||warnRatio<0||warnRatio>1)throw Error('Invalid security capacity configuration');
    if(free<total*warnRatio||free<reserve*2)this.warnings.push('disk-space-low');
    if(bytes>max*0.8)this.warnings.push('security-database-near-limit');
    if(free<=reserve||bytes>=max)throw Error('Security capacity reserve reached');
  }
  append(input:Omit<SecurityEvent,'at'|'expiresAt'>):number {
    if(!this.enabled)return 0;
    try{this.capacity();const event=securityEvent(input,this.now());const result=this.db.prepare('INSERT INTO security_events(at,expires_at,event) VALUES(?,?,?)').run(event.at,event.expiresAt,JSON.stringify(event));this.failure=false;return Number(result.lastInsertRowid);}
    catch{this.failure=true;if(Date.now()-this.alertedAt>=60000){this.alertedAt=Date.now();console.error('SECURITY_WRITE_FAILED: required publication blocked; inspect disk/storage (no request data logged).');}throw Error(SECURITY_UNAVAILABLE);}
  }
  status(){if(!this.enabled)return {ok:true,enabled:false,warnings:[]};try{this.capacity();this.db.prepare('UPDATE security_health SET at=? WHERE id=1').run(this.now());this.failure=false;}catch{this.failure=true;}return {ok:!this.failure,warnings:this.warnings};}
  list(after=0,limit=100){return this.db.prepare('SELECT id,at,expires_at,held,event FROM security_events WHERE id>? ORDER BY id LIMIT ?').all(after,Math.max(1,Math.min(500,limit)));}
  hold(id:number,held:boolean,reason?:string):void {
    this.db.exec('BEGIN IMMEDIATE');try{
      const result=this.db.prepare('UPDATE security_events SET held=? WHERE id=?').run(held?1:0,id);if(!result.changes)throw Error('记录不存在。');
      this.db.prepare('UPDATE security_evidence SET held=? WHERE id=?').run(held?1:0,id);
      if(!held)this.db.prepare("UPDATE security_events SET held=0 WHERE json_extract(event,'$.kind')='admin' AND json_extract(event,'$.operation')='hold' AND json_extract(event,'$.target')=?").run(String(id));
      if(reason!==undefined){const reasonId=this.append({kind:'admin',operation:held?'hold':'release-hold',outcome:'enforced',target:String(id),reason});if(held)this.db.prepare('UPDATE security_events SET held=1 WHERE id=?').run(reasonId);}
      this.db.exec('COMMIT');
    }catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  disposition(code:string,kind:'hidden'|'restricted'|'name'|'closed',target:string,reason:string,evidence?:unknown):number {
    this.db.exec('BEGIN IMMEDIATE');
    try{const id=this.append({kind:'admin',operation:kind,outcome:'enforced',roomCode:code,target,reason}),at=this.now();
      this.db.prepare('INSERT INTO moderation VALUES(?,?,?,?,?,?) ON CONFLICT(room_code,kind,target) DO UPDATE SET at=excluded.at,expires_at=excluded.expires_at,event_id=excluded.event_id').run(code,kind,target,at,networkExpiry(at),id);
      if(kind==='name'&&typeof (evidence as {eventThrough?:unknown}|undefined)?.eventThrough==='number')this.db.prepare('INSERT INTO moderation VALUES(?,?,?,?,?,?) ON CONFLICT(room_code,kind,target) DO UPDATE SET at=excluded.at,expires_at=excluded.expires_at,event_id=excluded.event_id').run(code,'events',String((evidence as {eventThrough:number}).eventThrough),at,networkExpiry(at),id);
      if(evidence!==undefined)this.db.prepare('INSERT INTO security_evidence(id,room_code,at,expires_at,evidence) VALUES(?,?,?,?,?)').run(id,code,at,at+90*86400000,JSON.stringify(evidence));
      this.db.exec('COMMIT');return id;
    }catch{this.db.exec('ROLLBACK');this.failure=true;console.error('SECURITY_DISPOSITION_FAILED: no moderation change acknowledged.');throw Error(SECURITY_UNAVAILABLE);}
  }
  evidence(id:number){return this.db.prepare('SELECT id,room_code,at,expires_at,held,evidence FROM security_evidence WHERE id=?').get(id);}
  targets(code:string,kind:string):Set<string>{return new Set((this.db.prepare('SELECT target FROM moderation WHERE room_code=? AND kind=?').all(code,kind) as {target:string}[]).map(x=>x.target));}
  revision(code:string):number{return Number((this.db.prepare('SELECT max(event_id) AS revision FROM moderation WHERE room_code=?').get(code) as {revision:number|null}).revision??0);}
  closedAt(code:string):number|undefined{return (this.db.prepare("SELECT at FROM moderation WHERE room_code=? AND kind='closed'").get(code) as {at:number}|undefined)?.at;}
  isRestricted(code:string,id:string){return this.targets(code,'restricted').has(id)||this.targets(code,'name').has(id);}
  cleanup(limit=500,activeRooms:ReadonlySet<string>=new Set()):number {
    if(!this.enabled)return 0;
    const batch=Math.max(1,Math.min(1000,limit)),now=this.now();
    const deleted=this.db.prepare('DELETE FROM security_events WHERE id IN (SELECT id FROM security_events WHERE held=0 AND expires_at<=? ORDER BY expires_at,id LIMIT ?)').run(now,batch).changes;
    this.db.prepare('DELETE FROM security_evidence WHERE id IN (SELECT id FROM security_evidence WHERE held=0 AND expires_at<=? LIMIT ?)').run(now,batch);
    const active=[...activeRooms],exclude=active.length?' AND room_code NOT IN ('+active.map(()=>'?').join(',')+')':'';
    const marks=this.db.prepare('SELECT rowid FROM moderation WHERE expires_at<=?'+exclude+' AND NOT EXISTS(SELECT 1 FROM security_events WHERE security_events.id=moderation.event_id AND held=1) LIMIT ?').all(now,...active,batch) as {rowid:number}[];
    for(const mark of marks)this.db.prepare('DELETE FROM moderation WHERE rowid=?').run(mark.rowid);
    this.db.exec('PRAGMA wal_checkpoint(PASSIVE)');return Number(deleted);
  }
  close(){this.db.close();}
}
