import { test, expect, type Page } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import { BACKEND_RULES_VERSION, PROTOCOL_VERSION } from '../../src/shared/backend-protocol.js';
import { mkdirSync } from 'node:fs';

let application: ReturnType<typeof createApplication>, url: string;
const cfOrigin = 'https://cf.backend.test', aliOrigin = 'http://ali.backend.test';
test.beforeAll(async () => {
  application = createApplication(':memory:');
  await new Promise<void>(resolve => application.http.listen(0, '127.0.0.1', resolve));
  const address = application.http.address();
  if (!address || typeof address === 'string') throw Error('No server address');
  url = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => application.close());
test.afterEach(async ({ page }) => {
  // Finish fixture responses before Playwright disposes the page/context.
  await page.unrouteAll({ behavior: 'wait' });
});

// Route only the deployment-owned pages/probes. The browser still enforces its
// real HTTPS/HTTP origin and storage boundaries; no remote service is contacted.
async function mockBackends(page: Page, state: {cloudflare:boolean;aliyun:boolean;aliyunEnabled?:boolean;realtime?:{cloudflare:boolean;aliyun:boolean};probeGate?:Promise<void>}) {
  await page.route(/^(https:\/\/cf|http:\/\/ali)\.backend\.test\//, async route => {
    const request = route.request(), target = new URL(request.url());
    const id = target.origin === cfOrigin ? 'cloudflare' : 'aliyun';
    if (target.pathname === '/backends.json') return route.fulfill({json:{backends:[
      {id:'cloudflare',origin:cfOrigin,transport:'worker',enabled:true},
      {id:'aliyun',origin:aliOrigin,transport:'worker',enabled:state.aliyunEnabled??true,allowInsecureHttp:true},
    ]}});
    if (target.pathname === '/api/connectivity') {
      await state.probeGate;
      return state[id] ? route.fulfill({json:{ok:true,backendId:id,protocolVersion:PROTOCOL_VERSION,rulesVersion:BACKEND_RULES_VERSION}}) : route.abort('failed');
    }
    if (target.pathname === '/api/browser/rooms') return route.fulfill({json:{rooms:[],capacity:{used:0,limit:14}}});
    // APIResponse from page.request belongs to the closing browser context.
    // Copy a native response completely before fulfilling the browser route.
    const response = await fetch(url + target.pathname + target.search, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    const body = Buffer.from(await response.arrayBuffer());
    const headers = Object.fromEntries(response.headers);
    // Native fetch already decodes the body; let fulfillment frame it again.
    for (const header of ['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive']) delete headers[header];
    return route.fulfill({ status: response.status, headers, body });
  });
  await page.routeWebSocket(/^(wss:\/\/cf|ws:\/\/ali)\.backend\.test\/api\/connectivity\/ws$/, ws => {
    const id = ws.url().includes('cf.backend') ? 'cloudflare' : 'aliyun';
    if (state.realtime?.[id]??state[id]) ws.send(JSON.stringify({ok:true,backendId:id,protocolVersion:PROTOCOL_VERSION,rulesVersion:BACKEND_RULES_VERSION})); else ws.close();
  });
}

test('共享预览标明 PR 和提交，手机布局保持可用', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await mockBackends(page,{cloudflare:true,aliyun:true});
  await page.route('**/deployment.json',route=>route.fulfill({json:{target:'preview',commit:'a'.repeat(40),prNumber:23,runId:123}}));
  await page.goto(cfOrigin);
  await expect(page.getByRole('complementary',{name:'测试环境'})).toContainText('PR #23 · 提交 aaaaaaa');
  await expect(page.locator('.current-line')).toContainText('Cloudflare');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('正式部署元数据不显示测试标记', async ({page}) => {
  await mockBackends(page,{cloudflare:true,aliyun:true});
  await page.route('**/deployment.json',route=>route.fulfill({json:{target:'production',commit:'a'.repeat(40),runId:123}}));
  await page.goto(cfOrigin);
  await expect(page.locator('.current-line')).toContainText('可用');
  await expect(page.getByRole('complementary',{name:'测试环境'})).toHaveCount(0);
});

test('游戏首页仅显示当前线路，切换服务器返回同线路统一大厅且不探测混合内容', async ({page}) => {
  await mockBackends(page,{cloudflare:true,aliyun:true});
  const insecureRequests:string[]=[];
  page.on('request',request=>{if(request.url().startsWith(aliOrigin))insecureRequests.push(request.url());});
  await page.goto(cfOrigin);
  await expect(page.getByRole('radiogroup',{name:'服务器',exact:true})).toHaveCount(0);
  await expect(page.locator('.current-line')).toContainText('Cloudflare');
  await page.getByText('线路设置',{exact:true}).click();
  await expect(page.getByRole('link',{name:'切换服务器',exact:true})).toHaveAttribute('href','https://magical-athlete.qiuh23.workers.dev/lobby/#choices');
  expect(insecureRequests).toEqual([]);
  await page.goto(aliOrigin);
  await expect(page.locator('.current-line')).toContainText('阿里云内地');
  await expect(page.getByRole('link',{name:'返回游戏大厅',exact:true})).toHaveAttribute('href','https://magical-athlete-online.cn/');
  await expect(page.getByText('临时 HTTP 连接未加密。请保留当前入口以恢复本机房间身份。')).toBeVisible();
});

test('跨入口邀请自动保留完整房间码，清除查询和片段且不发生循环', async ({page}) => {
  await mockBackends(page,{cloudflare:true,aliyun:true});
  const documents:string[]=[];
  page.on('request',request=>{if(request.isNavigationRequest())documents.push(request.url());});
  await page.goto(cfOrigin+'/room/A-XYZ678?token=private&backend=https://attacker.example#secret');
  await expect(page).toHaveURL(aliOrigin+'/room/A-XYZ678');
  await expect(page.getByLabel('房间码',{exact:true})).toHaveValue('A-XYZ678');
  await expect(page.getByRole('button',{name:'加入这场胡闹',exact:true})).toBeEnabled();
  expect(documents).toHaveLength(2);
  expect(documents[1]).not.toMatch(/private|secret|attacker/);
  await expect(page.getByRole('link',{name:'返回游戏大厅',exact:true})).toHaveAttribute('href','https://magical-athlete-online.cn/');
});

test('跨入口观战邀请保留公开观战状态，刷新后仍预选观战且不携带令牌', async ({page}) => {
  await mockBackends(page,{cloudflare:true,aliyun:true});
  await page.addInitScript(()=>localStorage.setItem('magical-athlete:backend-preference:v1','cloudflare'));
  await page.goto(cfOrigin+'/room/A-XYZ678?spectate=1&token=private&url=https://attacker.example#secret');
  await expect(page).toHaveURL(aliOrigin+'/room/A-XYZ678?spectate=1');
  await expect(page.getByRole('radio',{name:'作为观战者'})).toBeChecked();
  await page.reload();
  await expect(page.getByRole('radio',{name:'作为观战者'})).toBeChecked();
  await expect(page.getByRole('button',{name:'进入房间观战',exact:true})).toBeEnabled();
});

test('当前入口失败不自动改线，建房禁用而大厅导航保留', async ({page}) => {
  await mockBackends(page,{cloudflare:false,aliyun:true});
  await page.goto(cfOrigin);
  await expect(page.locator('.current-line')).toContainText('Cloudflare');
  await expect(page.locator('.current-line')).toContainText('暂不可用');
  await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  await expect(page.getByRole('button',{name:'创建房间，召集朋友',exact:true})).toBeDisabled();
  await expect(page.getByRole('link',{name:'返回游戏大厅',exact:true})).toHaveAttribute('href','https://magical-athlete.qiuh23.workers.dev/lobby/');
});

test('本入口邀请等待初次探测完成，避免将检测中误报为连接失败', async ({page}) => {
  let finishProbe!:()=>void;
  const probeGate=new Promise<void>(resolve=>{finishProbe=resolve;});
  try {
    await mockBackends(page,{cloudflare:true,aliyun:true,probeGate});
    await page.goto(cfOrigin+'/room/C-XYZ678');
    await page.getByLabel('你的昵称').fill('本入口访客');
    const join=page.getByRole('button',{name:'加入这场胡闹',exact:true});
    await expect(join).toBeDisabled();
    await expect(page.locator('.current-line')).toContainText('检测中');
    finishProbe();await expect(join).toBeEnabled();await expect(page.getByRole('alert')).toHaveCount(0);
  } finally {
    // An assertion failure must also unblock the route-draining afterEach.
    finishProbe();
  }
});

test('线路设置重新检测保留当前入口与本机状态', async ({page}) => {
  const state={cloudflare:true,aliyun:false,aliyunEnabled:false};await mockBackends(page,state);
  await page.addInitScript(()=>localStorage.setItem('magical-athlete:backend-preference:v1','aliyun'));
  await page.goto(cfOrigin);
  await expect(page.locator('.current-line')).toContainText('Cloudflare');
  await expect(page.locator('.current-line')).toContainText('可用');
  await page.evaluate(()=>{(window as unknown as {navigationSentinel:string}).navigationSentinel='retained';});
  await page.getByText('线路设置',{exact:true}).click();
  state.cloudflare=false;await page.getByRole('button',{name:'重新检测',exact:true}).click();
  await expect(page.locator('.current-line')).toContainText('暂不可用');
  await expect(page.locator('.current-line')).toContainText('Cloudflare');
  expect(await page.evaluate(()=>(window as unknown as {navigationSentinel:string}).navigationSentinel)).toBe('retained');
  await expect(page).toHaveURL(cfOrigin+'/');
});

test('HTTP 可达但本入口实时连接失败仍禁止建房', async ({page}) => {
  await mockBackends(page,{cloudflare:true,aliyun:true,realtime:{cloudflare:false,aliyun:true}});
  await page.goto(cfOrigin);
  await expect(page.locator('.current-line')).toContainText('暂不可用');
  await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  await expect(page.getByRole('button',{name:'创建房间，召集朋友',exact:true})).toBeDisabled();
});

test('未确认建房请求禁止切服和邀请自动跳转，原回执保持原样', async ({page}) => {
  await mockBackends(page,{cloudflare:true,aliyun:true});
  const receipt={backendId:'cloudflare',requestId:'pending-create-original-id',creation:{name:'原房主'}};
  await page.addInitScript(value=>sessionStorage.setItem('magical-athlete:pending-create:v1',JSON.stringify(value)),receipt);
  await page.goto(cfOrigin+'/room/A-XYZ678');
  await expect(page.getByRole('button',{name:'重试原服务器建房',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'返回游戏大厅',exact:true})).toHaveAttribute('aria-disabled','true');
  await page.getByText('线路设置',{exact:true}).click();
  await expect(page.getByRole('link',{name:'切换服务器',exact:true})).toHaveAttribute('aria-disabled','true');
  await expect(page).toHaveURL(cfOrigin+'/room/A-XYZ678');
  expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('magical-athlete:pending-create:v1')!))).toEqual(receipt);
});

for(const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
  test(`选服和旧码确认在 ${viewport.width}px 可操作`, async ({page}) => {
    await page.setViewportSize(viewport);await mockBackends(page,{cloudflare:true,aliyun:true});await page.goto(cfOrigin);
    await expect(page.locator('.current-line')).toContainText('Cloudflare');
    await expect(page.getByRole('tab',{selected:true})).toHaveCount(0);
    await expect(page.locator('#entry-form')).toHaveCount(0);
    await expect(page.getByRole('link',{name:'返回游戏大厅',exact:true})).toBeVisible();
    mkdirSync('.local/game-entry-tests',{recursive:true});
    await page.screenshot({path:`.local/game-entry-tests/servers-${viewport.width}.png`,fullPage:true});
    await page.getByRole('tab',{name:'现有房间',exact:true}).click();
    await page.getByLabel('房间码',{exact:true}).fill('ABC234');
    await expect(page.getByRole('group',{name:'六位旧房间码所属服务器'})).toBeVisible();
    await page.getByLabel('你的昵称').fill('旧码选服测试');
    await page.getByRole('button',{name:'加入这场胡闹',exact:true}).click();
    await expect(page.getByRole('alert')).toContainText('这是六位旧房间码，请先选择房间所属服务器。');
    await page.getByRole('group',{name:'六位旧房间码所属服务器'}).getByRole('radio',{name:'阿里云内地',exact:true}).check();
    await page.getByRole('button',{name:'加入这场胡闹',exact:true}).click();
    await expect(page).toHaveURL(aliOrigin+'/room/A-ABC234');
    await expect(page.getByLabel('房间码',{exact:true})).toHaveValue('A-ABC234');
    // No nickname, token, preference or private data was carried across origins.
    await expect(page.getByLabel('你的昵称')).toHaveValue('');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  });
}
