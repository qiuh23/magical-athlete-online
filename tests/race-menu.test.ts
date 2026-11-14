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
