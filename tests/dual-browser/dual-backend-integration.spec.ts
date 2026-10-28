import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';

const nodeOrigin = 'http://127.0.0.1:3321', workerOrigin = 'https://127.0.0.1:8797';
// A management-only SSH tunnel can validate the actual deployed Node instance
// with the same independent browser flow, without exposing a public game API.
const aliyunOrigin = process.env.ALIYUN_TEST_ORIGIN ?? nodeOrigin;
const entryOrigin = process.env.DUAL_ENTRY_ORIGIN ?? nodeOrigin;
const deployment = {backends: [
  {id: 'cloudflare', origin: workerOrigin, transport: 'worker', enabled: true},
  {id: 'aliyun', origin: aliyunOrigin, transport: 'socketio', enabled: true},
]};
let application: ReturnType<typeof createApplication>;
test.beforeAll(async () => {
  process.env.BACKEND_ID = 'aliyun';
  process.env.BACKENDS_CONFIG_JSON = JSON.stringify(deployment);
  application = createApplication(':memory:');
  await new Promise<void>(resolve => application.http.listen(3321, '127.0.0.1', resolve));
});
test.afterAll(async () => application.close());

async function configured(context: BrowserContext) {
  await context.route('**/backends.json', route => route.fulfill({json: deployment}));
  await context.addInitScript(() => {
    localStorage.setItem('magical-athlete:low-quality', 'true');
    localStorage.setItem('magical-athlete:reduced-motion', 'true');
  });
}

test('legacy cross-entry identity stays at its original webpage and restores the same room',async({browser})=>{
  const context=await browser.newContext();await configured(context);
  try {
    const response=await context.request.post(workerOrigin+'/api/browser/rooms',{data:{name:'旧入口房主',maxPlayers:2,timeoutSeconds:0}});
    expect(response.status()).toBe(201);
    const reply=await response.json(),identity={...reply.identity,backendId:'cloudflare'};
    const route='/room/C-'+identity.roomCode,key=`magical-athlete:identity:cloudflare:${identity.roomCode}`;
    await context.addInitScript(({identity,key,entry})=>{
      if(location.origin===entry&&!localStorage.getItem(key)){
        localStorage.setItem(key,JSON.stringify(identity));
        localStorage.setItem(key+':player',JSON.stringify(identity));
      }
    },{identity,key,entry:entryOrigin});
    const page=await context.newPage();
    await page.goto(entryOrigin+route);await online(page);
    await expect(page).toHaveURL(entryOrigin+route);
    await expect(page.getByRole('radio',{name:'阿里云内地',exact:true})).toHaveCount(0);
    await expect(page.locator('.selectable-link')).toHaveAttribute('href',workerOrigin+route);
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('Test manual copy'))}}));
    await page.getByRole('button',{name:'邀请朋友',exact:true}).click();
    await expect(page.getByLabel('待复制的邀请内容')).toHaveValue(workerOrigin+route);
    await page.getByRole('button',{name:'完成',exact:true}).click();
    await page.getByRole('button',{name:'我准备好了',exact:true}).click();
    await page.reload();await online(page);
    await expect(page).toHaveURL(entryOrigin+route);
    await expect(page.getByRole('button',{name:'取消准备',exact:true})).toBeVisible();
    expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),key)).toEqual(identity);
    await page.goto(entryOrigin);
    await page.getByRole('button',{name:'返回刚才创建的房间',exact:true}).click();
    await online(page);await expect(page).toHaveURL(entryOrigin+route);
    expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),key)).toEqual(identity);
    await page.getByRole('button',{name:'结束房间',exact:true}).click();
    await page.getByRole('button',{name:'确认结束',exact:true}).click();
    await expect(page.locator('[data-room-closed="true"]')).toBeVisible();
  } finally {await context.close();}
});
async function online(page: Page) { await expect(page.locator('.connection.is-online')).toBeVisible(); }
async function sendChat(page: Page, text: string) {
  await page.getByRole('button', {name: /^房间聊天/}).click();
  await page.getByLabel('聊天消息', {exact: true}).fill(text);
  await page.getByRole('button', {name: '发送', exact: true}).click();
  await expect(page.getByRole('log', {name: '聊天记录'})).toContainText(text);
}

for (const backend of ['cloudflare', 'aliyun'] as const) {
  test(`${backend}: independent sessions create/join/action/chat/reconnect across webpage entries`, async ({browser}, testInfo) => {
    const contexts: BrowserContext[] = [], errors: string[] = [];
    try {
      for (let i = 0; i < 2; i++) { const context = await browser.newContext(); contexts.push(context); await configured(context); }
      const host = await contexts[0]!.newPage(), guest = await contexts[1]!.newPage();
      for (const page of [host, guest]) page.on('pageerror', error => errors.push(error.message));
      await host.goto(entryOrigin);
      const server = host.getByRole('radio', {name: backend === 'cloudflare' ? 'Cloudflare' : '阿里云内地', exact: true});
      await expect(server).toBeEnabled(); await server.click();
      await expect(host).toHaveURL((backend === 'cloudflare' ? workerOrigin : aliyunOrigin)+'/');
      await host.getByRole('tab', {name: '创建房间', exact: true}).click();
      await host.getByLabel('你的昵称').fill(`房主${backend}`);
      await host.getByLabel('房间人数上限').selectOption('2');
      await host.getByLabel('每次操作时限').selectOption('0');
      await host.getByRole('button', {name: '创建房间，召集朋友', exact: true}).click();
      await online(host);
      const route = new URL(host.url()).pathname;
      expect(route).toMatch(backend === 'cloudflare' ? /^\/room\/C-[A-Z2-9]{6}$/ : /^\/room\/A-[A-Z2-9]{6}$/);
      // An independently hosted webpage must use the invitation's backend, not its own origin.
      await guest.goto(workerOrigin + route);
      await expect(guest).toHaveURL((backend === 'cloudflare' ? workerOrigin : aliyunOrigin)+route);
      await guest.getByLabel('你的昵称').fill(`客人${backend}`);
      await guest.getByRole('button', {name: '加入这场胡闹', exact: true}).click();
      await online(guest);
      await expect(host.locator('.lobby-seats')).toContainText(`客人${backend}`);
      await host.getByRole('button', {name: '我准备好了', exact: true}).click();
      await expect(host.getByRole('button', {name: '取消准备', exact: true})).toBeVisible();
      const message = `${backend}跨入口消息`;
      await sendChat(host, message);
      await guest.getByRole('button', {name: /^房间聊天/}).click();
      await expect(guest.getByRole('log', {name: '聊天记录'})).toContainText(message);
      const before = await guest.evaluate(() => JSON.parse(sessionStorage.getItem('magical-athlete:route-identity:v1')!));
      await contexts[1]!.setOffline(true);
      await expect(guest.locator('.connection.is-online')).toHaveCount(0);
      await contexts[1]!.setOffline(false); await online(guest);
      await guest.reload(); await online(guest);
      expect(await guest.evaluate(() => JSON.parse(sessionStorage.getItem('magical-athlete:route-identity:v1')!))).toEqual(before);
      await guest.getByRole('button', {name: /^房间聊天/}).click();
      await expect(guest.getByRole('log', {name: '聊天记录'})).toContainText(message);
      await host.getByRole('button', {name: '收起聊天'}).click();
      await host.screenshot({path: testInfo.outputPath(`${backend}-desktop.png`), fullPage: true});
      await host.getByRole('button',{name:'结束房间',exact:true}).click();
      await host.getByRole('button',{name:'确认结束',exact:true}).click();
      await expect(guest.locator('[data-room-closed="true"]')).toBeVisible();
      expect(errors).toEqual([]);
    } finally { await Promise.all(contexts.map(context => context.close())); }
  });

  test(`${backend}: practice and AI start through the selected backend`, async ({browser}) => {
    const context = await browser.newContext(); await configured(context);
    try {
      const page = await context.newPage();
      for (const mode of ['practice', 'ai'] as const) {
        await page.goto(entryOrigin);
        const server = page.getByRole('radio', {name: backend === 'cloudflare' ? 'Cloudflare' : '阿里云内地', exact: true});
        await expect(server).toBeEnabled(); await server.click();
        await expect(page).toHaveURL((backend === 'cloudflare' ? workerOrigin : aliyunOrigin)+'/');
        await page.getByRole('tab', {name: mode === 'practice' ? '自己练习' : '人机对战', exact: true}).click();
        await page.getByLabel('你的昵称').fill(`冒烟${mode}`);
        if (mode === 'ai') await page.getByLabel('AI 人数', {exact: true}).selectOption('1');
        await page.getByRole('button', {name: mode === 'practice' ? '开始自己练习' : '开始人机对战', exact: true}).click();
        await online(page);
        expect(new URL(page.url()).pathname).toMatch(backend === 'cloudflare' ? /\/C-/ : /\/A-/);
        await expect(page.getByRole('heading', {name: '组建你的队伍', exact: true})).toBeVisible();
        if (mode === 'practice') {
          for (let index = 0; index < 4; index++) await page.locator('.practice-pool .character-card').nth(index).getByRole('button', {name: /^选择/}).click();
          await page.getByRole('button', {name: '确认练习阵容', exact: true}).click();
          await expect(page.getByRole('heading', {name: '组建你的队伍', exact: true})).toHaveCount(0);
        }
        await page.getByRole('button',{name:'结束房间',exact:true}).click();
        await page.getByRole('button',{name:'确认结束',exact:true}).click();
        await expect(page.locator('[data-room-closed="true"]')).toBeVisible();
      }
    } finally { await context.close(); }
  });
}
