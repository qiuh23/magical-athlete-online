import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {RaceMenuPanel} from '../src/client/RaceMenuPanel.js';
import {installRaceMenuDismissal} from '../src/client/race-menu-dismissal.js';

test('ordinary match menu has no modal backdrop or modal semantics',()=>{
 const html=renderToStaticMarkup(createElement(RaceMenuPanel,{onClose(){},children:'设置'}));
 assert.match(html,/<aside[^>]*id="presentation-settings-panel"/);assert.match(html,/aria-labelledby="race-menu-title"/);assert.match(html,/aria-label="关闭比赛菜单"/);
 assert.doesNotMatch(html,/aria-modal|modal-backdrop|role="dialog"/);
 const app=readFileSync(new URL('../src/client/App.tsx',import.meta.url),'utf8');assert.match(app,/settingsOpen && <RaceMenuPanel/);assert.match(app,/endRoom &&[^\n]*<Modal title="结束此房间？"/);assert.match(app,/leaving &&[^\n]*<Modal title="离开这个房间？"/);
 assert.match(app,/setRacePanel\(previous => previous === 'menu' \? undefined : previous\), \[pendingChoice\?\.id, room.code, room.phase\]/);
 const css=readFileSync(new URL('../src/client/ui-theme.css',import.meta.url),'utf8');assert.match(css,/\.race-menu-panel-scroll \{[^}]*overflow:auto/);assert.match(css,/\.race-menu-panel-header \.close-button \{[^}]*width:44px;height:44px/);
});
test('menu dismissal allows normal tabbing, preserves outside input and yields to modal confirmations',()=>{
 const handlers=new Map<string,EventListener>();const inside={},triggerTarget={},outside={};let modal=false,allowed=true;const reasons:string[]=[];
 const doc={querySelector(){return modal?{}:null;},addEventListener(name:string,handler:EventListener){handlers.set(name,handler);},removeEventListener(name:string){handlers.delete(name);}} as unknown as Document;
 const panel={contains(target:unknown){return target===inside;}} as HTMLElement;
 const trigger={contains(target:unknown){return target===triggerTarget;}} as HTMLElement;
 const remove=installRaceMenuDismissal(panel,trigger,reason=>{reasons.push(reason);return allowed;},doc);
 const event=(target:unknown,key='')=>({target,key,defaultPrevented:false,prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},stopImmediatePropagation(){this.stopped=true;}});
 const fire=(name:string,e:ReturnType<typeof event>)=>handlers.get(name)!(e as unknown as Event);
 for(const target of [inside,triggerTarget])fire('pointerdown',event(target));assert.deepEqual(reasons,[]);
 const tab=event(inside,'Tab');fire('keydown',tab);assert.equal(tab.prevented,false);assert.deepEqual(reasons,[]);
 const click=event(outside);fire('pointerdown',click);assert.deepEqual(reasons,['outside']);assert.equal(click.prevented,false);
 const escape=event(inside,'Escape');fire('keydown',escape);assert.equal(escape.prevented,true);assert.equal(reasons.at(-1),'keyboard');
 modal=true;const count=reasons.length;fire('keydown',event(inside,'Escape'));fire('pointerdown',event(outside));assert.equal(reasons.length,count);
 modal=false;allowed=false;const rejected=event(outside);fire('pointerdown',rejected);assert.equal(rejected.prevented,true);assert.equal(rejected.stopped,true);
 remove();assert.equal(handlers.size,0);
});

test('all menu exits keep unsaved settings on cancel and block a submitting form',async()=>{
 const {canDismissRaceMenu}=await import('../src/client/race-menu-dismissal.js');
 let unsaved=false,submitting=false,asked=0;
 const panel={querySelector(selector:string){return selector.includes('submitting')?submitting?{}:null:unsaved?{}:null;}} as unknown as HTMLElement;
 const confirm=()=>{asked++;return false;};
 assert.equal(canDismissRaceMenu(null,confirm),true);assert.equal(canDismissRaceMenu(panel,confirm),true);assert.equal(asked,0);
 unsaved=true;assert.equal(canDismissRaceMenu(panel,confirm),false);assert.equal(asked,1);
 assert.equal(canDismissRaceMenu(panel,()=>true),true);
 submitting=true;assert.equal(canDismissRaceMenu(panel,confirm),false);assert.equal(asked,1);
 const app=readFileSync(new URL('../src/client/App.tsx',import.meta.url),'utf8');
 const menu=app.slice(app.indexOf('{settingsOpen && <RaceMenuPanel'),app.indexOf('</div></RaceMenuPanel>}'));
 assert.doesNotMatch(menu.slice(menu.indexOf('<div className="race-menu-content">')),/setSettingsOpen\(false\)/);
 for(const label of ['onRules','onRename','onLobby','onLeave','onEnd'])assert.ok(menu.includes(`leaveMenu(${label})`));
});

test('menu groups are initially folded and expose only three quick actions',()=>{
 const app=readFileSync(new URL('../src/client/App.tsx',import.meta.url),'utf8');
 const menu=app.slice(app.indexOf('{settingsOpen && <RaceMenuPanel'),app.indexOf('</div></RaceMenuPanel>}'));
 assert.equal((menu.match(/name="race-menu-sections"/g)??[]).length,3);
 assert.doesNotMatch(menu,/<details[^>]*\bopen\b/);
 const quick=menu.slice(menu.indexOf('<nav'),menu.indexOf('</nav>'));
 assert.equal((quick.match(/<Button /g)??[]).length,3);
 for(const label of ['累计积分','事件记录','本场赛事与地图'])assert.ok(quick.includes(`aria-label="${label}"`));
 assert.match(menu,/<RoomConfigPanel[^>]*compact/);
 const config=readFileSync(new URL('../src/client/RoomConfig.tsx',import.meta.url),'utf8');
 assert.match(config,/open=\{compact\?undefined:true\}/);
 const css=readFileSync(new URL('../src/client/ui-theme.css',import.meta.url),'utf8');
 assert.match(css,/\.race-menu-panel :is\(\.preset-options,\.map-options\)[^}]*repeat\(2,minmax\(0,1fr\)\)/);
});
