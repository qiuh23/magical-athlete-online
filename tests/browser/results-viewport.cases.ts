import {readFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
import {createApplication} from '../../src/server/index.js';
import {createGame} from '../../src/engine/index.js';

test.describe("results viewport matrix", () => {
let application:ReturnType<typeof createApplication>,url:string;
const edition=JSON.parse(readFileSync('dist/client/site-edition.json','utf8')).siteEdition as 'cn'|'global';
const backendId=edition==='cn'?'aliyun':'cloudflare';
test.beforeAll(async()=>{
  const previous=process.env.SITE_EDITION;
  process.env.SITE_EDITION=edition;
  try { application=createApplication(':memory:'); }
  finally { if(previous===undefined)delete process.env.SITE_EDITION;else process.env.SITE_EDITION=previous; }
  await new Promise<void>(resolve=>application.http.listen(0,'127.0.0.1',resolve));
  const address=application.http.address();if(!address||typeof address==='string')throw Error('Missing test address');
  url=`http://127.0.0.1:${address.port}`;
});
test.afterAll(async()=>{await application.close();});
for (const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]) {
  for (const mode of ['eight-single','three-dual','eight-dual-stress'] as const) {
    for (const form of ['round','final','guest','spectator'] as const) {
      test(`${form} ${mode} ${viewport.width}x${viewport.height}: complete standings and fixed actions`, async ({browser}, info) => {
        const count = mode === 'three-dual' ? 3 : 8, dual = mode !== 'eight-single';
        const host = application.rooms.create('房主同学', count, 0), code = host.identity.roomCode;
        const members = [host, ...Array.from({length:count-1}, (_,i) => application.rooms.join(code, `选手${i+2}`))];
        const watcher = application.rooms.join(code, '观众', 'spectator');
        const room = application.rooms.get(code), game = createGame(room.game.players, 42);
        game.phase = form === 'final' ? 'finished' : 'results'; game.round = 1;
        game.players.forEach((p,i) => {p.score=16-i;});
        const characters = ['banana','coach'];
        game.racers = game.players.flatMap((p,i) => Array.from({length:dual?2:1}, (_,j) => ({id:`r${i}-${j}`,playerId:p.id,characterId:characters[j]!,position:30,tripped:false,finished:true,rank:i+j*count+1,eliminated:false,flags:{}})));
        const placements = [...game.racers].sort((a,b)=>a.rank!-b.rank!).map(r=>({racerId:r.id,playerId:r.playerId,characterId:r.characterId,rank:r.rank!,points:3}));
        game.results = Array.from({length:6}, (_,i)=>({round:i+1,placements,scores:game.players.map(p=>({playerId:p.id,placement:3,map:1,skill:0,event:0,total:4})),...(form==='round'?{drawReason:'forced-cycle' as const}:{})}));
        room.game = game; room.version++; application.store.save(room);
        const originalResults = structuredClone(game.results);
        const identity = form === 'guest' ? members[1]!.identity : form === 'spectator' ? watcher.identity : host.identity;
        const context = await browser.newContext({viewport});
        await context.addInitScript(({identity,backendId}) => {
          localStorage.setItem(`magical-athlete:identity:${backendId}:${identity.roomCode}`,JSON.stringify({...identity,backendId}));
          localStorage.setItem('magical-athlete:low-quality','true');
          localStorage.setItem('magical-athlete:muted','true');
        }, {identity,backendId});
        try {
          const page = await context.newPage();
          await page.goto(`${url}/room/${backendId==='aliyun'?'A':'C'}-${code}`);
          const panel = page.locator('.results-panel');
          await expect(panel).toBeVisible();
          await expect(panel.locator('.result-racer')).toHaveCount(form === 'final' ? 0 : count*(dual?2:1));
          await expect(panel.locator('.final-ranking > div')).toHaveCount(form === 'final' ? count : 0);
          const check = async () => {
            expect(await panel.evaluate(el => {
              const panel = el.getBoundingClientRect();
              const footer = el.querySelector('.results-actions')!.getBoundingClientRect();
              const rows = [...el.querySelectorAll('.result-racer,.final-ranking > div')].map(row=>row.getBoundingClientRect());
              const controls = [...el.querySelectorAll('.results-actions button')];
              return {
                inside: panel.top>=0 && panel.bottom<=innerHeight+1 && panel.left>=0 && panel.right<=innerWidth+1,
                noPanelScroll: el.scrollHeight<=el.clientHeight+1,
                noPageScroll: document.documentElement.scrollHeight<=innerHeight+1 && document.documentElement.scrollWidth<=innerWidth+1,
                rowsVisible: rows.every(row=>row.top>=panel.top && row.bottom<=footer.top && row.left>=panel.left && row.right<=panel.right),
                footerHit: controls.every(button=>{const r=button.getBoundingClientRect(); return button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),
              };
            })).toEqual({inside:true,noPanelScroll:true,noPageScroll:true,rowsVisible:true,footerHit:true});
          };
          await check();
          if (form === 'guest' || form === 'spectator') {
            await expect(panel.locator('.results-actions button')).toHaveCount(0);
            await expect(panel.locator('.results-actions')).toContainText('等待房主进入下一场');
          } else {
            await expect(panel.getByRole('button',{name:form==='final'?'原房间，再来一局':'前往下一场',exact:true})).toBeEnabled();
            await expect(panel.getByRole('button',{name:'解散房间',exact:true})).toBeVisible();
          }
          if (dual && form !== 'final') {
            expect(await panel.locator('.result-team').evaluateAll(groups=>groups.every(g=>g.children.length===2))).toBe(true);
          }
          await expect(panel.locator('.score-audit')).not.toHaveAttribute('open');
          await panel.locator('.score-audit > summary').click(); await check();
          await panel.locator('.score-audit').evaluate(el=>{el.scrollTop=el.scrollHeight;}); await check();
          await panel.locator('.score-audit > summary').click();
          if(form==='final') {
            await expect(panel.locator('.room-config-panel')).not.toHaveAttribute('open');
            await panel.getByText('下一局设置',{exact:true}).click(); await check();
            await panel.locator('.room-config-panel').evaluate(el=>{el.scrollTop=el.scrollHeight;}); await check();
            await panel.getByText('下一局设置',{exact:true}).click();
          }
          await page.screenshot({path:info.outputPath('results.png')});
          expect(room.game.results).toEqual(originalResults);
          if(form === 'round') {
            await panel.locator('.result-racer > button').first().click();
            await expect(page.getByRole('dialog')).toBeVisible();
            await page.getByRole('dialog').getByRole('button',{name:'关闭',exact:true}).click();
            await check();
          }
        } finally { await context.close(); application.rooms.rooms.delete(code); application.store.closeRoom({code,closedAt:Date.now(),reason:"dismissed"}); }
      });
    }
  }
}

});
