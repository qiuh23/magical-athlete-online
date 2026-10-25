import { test, expect, type Page } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import { BACKEND_RULES_VERSION, PROTOCOL_VERSION } from '../../src/shared/backend-protocol.js';
import { mkdirSync } from 'node:fs';

let application: ReturnType<typeof createApplication>, url: string;
test.beforeAll(async () => {
  application = createApplication(':memory:');
  await new Promise<void>(resolve => application.http.listen(0, '127.0.0.1', resolve));
  const address = application.http.address();
  if (!address || typeof address === 'string') throw Error('No server address');
  url = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => application.close());

async function mockBackends(page: Page, state: {cloudflare:boolean;aliyun:boolean;aliyunEnabled?:boolean;realtime?:{cloudflare:boolean;aliyun:boolean};probeGate?:Promise<void>}) {
  await page.route('**/backends.json', route => route.fulfill({json:{backends:[
    {id:'cloudflare',origin:'https://cf.backend.test',transport:'worker',enabled:true},
    {id:'aliyun',origin:'https://ali.backend.test',transport:'worker',enabled:state.aliyunEnabled??true},
  ]}}));
  const probe = (id:'cloudflare'|'aliyun') => ({ok:true,backendId:id,protocolVersion:PROTOCOL_VERSION,rulesVersion:BACKEND_RULES_VERSION});
  await page.route(/https:\/\/(cf|ali)\.backend\.test\/api\/connectivity$/, async route => {
    await state.probeGate;
    const id = route.request().url().includes('cf.backend') ? 'cloudflare' : 'aliyun';
    return state[id] ? route.fulfill({json:probe(id),headers:{'access-control-allow-origin':'*'}}) : route.abort('failed');
  });
  await page.routeWebSocket(/wss:\/\/(cf|ali)\.backend\.test\/api\/connectivity\/ws$/, ws => {
    const id = ws.url().includes('cf.backend') ? 'cloudflare' : 'aliyun';
    if (state.realtime?.[id]??state[id]) ws.send(JSON.stringify(probe(id))); else ws.close();
  });
  await page.route(/https:\/\/(cf|ali)\.backend\.test\/api\/browser\/rooms$/, route => {
    if(route.request().method()==='GET')return route.fulfill({json:{rooms:[],capacity:{used:0,limit:15}},headers:{'access-control-allow-origin':'*'}});
    return route.abort();
  });
}

test('共享预览标明 PR 和提交，手机布局保持可用', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await mockBackends(page,{cloudflare:true,aliyun:true});
  await page.route('**/deployment.json',route=>route.fulfill({json:{target:'preview',commit:'a'.repeat(40),prNumber:23,runId:123}}));
  await page.goto(url);
  await expect(page.getByRole('complementary',{name:'测试环境'})).toContainText('PR #23 · 提交 aaaaaaa');
  await expect(page.getByRole('radio',{name:'阿里云内地',exact:true})).toBeEnabled();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('正式部署元数据不显示测试标记', async ({page}) => {
  await mockBackends(page,{cloudflare:true,aliyun:true});
  await page.route('**/deployment.json',route=>route.fulfill({json:{target:'production',commit:'a'.repeat(40),runId:123}}));
  await page.goto(url);
  await expect(page.getByRole('radio',{name:'Cloudflare',exact:true})).toBeEnabled();
  await expect(page.getByRole('complementary',{name:'测试环境'})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.dataset.previewEnvironment)).toBeUndefined();
});

test('HTTPS 入口提前说明 HTTP 限制并保留邀请房间码，不发送混合内容请求', async ({page}) => {
  await mockBackends(page,{cloudflare:true,aliyun:true});
  let insecureRequests=0;
  page.on('request',request=>{if(request.url().startsWith('http://203.0.113.8'))insecureRequests++;});
  await page.route('https://secure.entry.test/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/backends.json')return route.fulfill({json:{backends:[
      {id:'cloudflare',origin:'https://cf.backend.test',transport:'worker',enabled:true},
      {id:'aliyun',origin:'http://203.0.113.8',transport:'socketio',enabled:true,allowInsecureHttp:true},
    ]}});
    return route.fulfill({response:await page.request.get(url+path)});
  });
  await page.goto('https://secure.entry.test/room/A-XYZ678');
  const ali=page.getByRole('radio',{name:'阿里云内地',exact:true});
  await expect(ali).toBeDisabled();await expect(ali).toContainText('HTTPS 页面无法连接此 HTTP 服务器');
  await expect(page.getByRole('link',{name:'从临时 HTTP 入口加入此房间'})).toHaveAttribute('href','http://203.0.113.8/room/A-XYZ678');
  expect(insecureRequests).toBe(0);
});

test('Cloudflare 连接失败时禁选并推荐阿里云，建房共用该选择', async ({page}) => {
  await mockBackends(page,{cloudflare:false,aliyun:true});
  await page.goto(url);
  const cf=page.getByRole('radio',{name:'Cloudflare',exact:true}), ali=page.getByRole('radio',{name:'阿里云内地',exact:true});
  await expect(cf).toBeDisabled();await expect(cf).toContainText('暂不可用');await expect(cf).toContainText('连接失败');
  await expect(ali).toBeEnabled();await expect(ali).toHaveAttribute('aria-checked','true');await expect(ali).toContainText(/连接延迟 \d+ ms/);
  for(const [entry,submit] of [['创建房间','创建房间，召集朋友'],['自己练习','开始自己练习'],['人机对战','开始人机对战']]) {
    await page.getByRole('tab',{name:entry,exact:true}).click();await expect(page.getByRole('button',{name:submit,exact:true})).toBeEnabled();
  }
});

test('邀请加入等待初次探测完成，避免将检测中误报为连接失败', async ({page}) => {
  let finishProbe!:()=>void;
  const probeGate = new Promise<void>(resolve=>{finishProbe=resolve;});
  await mockBackends(page,{cloudflare:true,aliyun:true,probeGate});
  await page.goto(`${url}/room/A-XYZ678`);
  await page.getByLabel('你的昵称').fill('跨入口访客');
  const join=page.getByRole('button',{name:'加入这场胡闹',exact:true});
  await expect(join).toBeDisabled();
  await expect(page.getByRole('radio',{name:'阿里云内地',exact:true})).toContainText('检测中');
  finishProbe();
  await expect(join).toBeEnabled();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('未部署与两端均不可达分别显示，并禁用在线建房', async ({page}) => {
  const state={cloudflare:false,aliyun:false,aliyunEnabled:false};await mockBackends(page,state);
  await page.goto(url);
  await expect(page.getByRole('radio',{name:'阿里云内地',exact:true})).toContainText('未部署');
  await expect(page.getByText('当前没有可用服务器，暂时无法在线建房。请稍后重新检测。')).toBeVisible();
  await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  await expect(page.getByRole('button',{name:'创建房间，召集朋友',exact:true})).toBeDisabled();
  state.aliyunEnabled=true;
  await page.getByRole('button',{name:'重新检测',exact:true}).click();
  await expect(page.getByRole('radio',{name:'阿里云内地',exact:true})).toContainText('暂不可用');
  await expect(page.getByRole('radio',{name:'Cloudflare',exact:true})).toBeDisabled();
});

test('HTTP 可达但实时连接失败的服务器仍禁选', async ({page}) => {
  await mockBackends(page,{cloudflare:true,aliyun:true,realtime:{cloudflare:false,aliyun:true}});
  await page.goto(url);
  await expect(page.getByRole('radio',{name:'Cloudflare',exact:true})).toContainText('暂不可用');
  await expect(page.getByRole('radio',{name:'Cloudflare',exact:true})).toBeDisabled();
  await expect(page.getByRole('radio',{name:'阿里云内地',exact:true})).toHaveAttribute('aria-checked','true');
});

test('保存可用偏好，手动选择后重新检测不会擅自切换', async ({page}) => {
  const state={cloudflare:true,aliyun:true};await mockBackends(page,state);
  await page.addInitScript(()=>localStorage.setItem('magical-athlete:backend-preference:v1','aliyun'));
  await page.goto(url);
  const cf=page.getByRole('radio',{name:'Cloudflare',exact:true}), ali=page.getByRole('radio',{name:'阿里云内地',exact:true});
  await expect(ali).toHaveAttribute('aria-checked','true');
  await cf.click();await expect(cf).toHaveAttribute('aria-checked','true');
  state.cloudflare=false;
  await page.getByRole('button',{name:'重新检测',exact:true}).click();
  await expect(cf).toContainText('暂不可用');await expect(cf).toHaveAttribute('aria-checked','true');
  await expect(ali).toHaveAttribute('aria-checked','false');
  await page.getByRole('tab',{name:'自己练习',exact:true}).click();
  await expect(page.getByRole('button',{name:'开始自己练习',exact:true})).toBeDisabled();
});

for(const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
  test(`选服和旧码确认在 ${viewport.width}px 可操作`, async ({page},testInfo) => {
    await page.setViewportSize(viewport);await mockBackends(page,{cloudflare:true,aliyun:true});await page.goto(url);
    await expect(page.getByRole('radio',{name:'Cloudflare',exact:true})).toHaveAttribute('aria-checked','true');
    await expect(page.getByRole('tab',{selected:true})).toHaveCount(0);
    await expect(page.locator('#entry-form')).toHaveCount(0);
    await page.getByRole('radio',{name:'阿里云内地',exact:true}).click();
    await expect(page.getByRole('radio',{name:'阿里云内地',exact:true})).toHaveAttribute('aria-checked','true');
    mkdirSync('docs/qa/dual-backend',{recursive:true});
    await page.screenshot({path:`docs/qa/dual-backend/servers-${viewport.width}.png`,fullPage:true});
    await page.getByRole('tab',{name:'现有房间',exact:true}).click();
    await page.getByLabel('房间码',{exact:true}).fill('ABC234');
    await expect(page.getByRole('group',{name:'六位旧房间码所属服务器'})).toBeVisible();
    await page.getByLabel('你的昵称').fill('旧码选服测试');
    let joined = false;
    await page.route('https://cf.backend.test/api/browser/rooms/ABC234/join', route => {
      const headers = {'access-control-allow-origin':'*','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type'};
      if(route.request().method()==='OPTIONS') return route.fulfill({status:204,headers});
      joined = true;return route.fulfill({status:404,json:{error:'房间不存在（选服测试）'},headers});
    });
    await page.getByRole('button',{name:'加入这场胡闹',exact:true}).click();
    await expect(page.getByRole('alert')).toContainText('这是六位旧房间码，请先选择房间所属服务器。');
    expect(joined).toBe(false);
    await page.getByRole('group',{name:'六位旧房间码所属服务器'}).getByRole('radio',{name:'Cloudflare',exact:true}).check();
    await page.getByRole('button',{name:'加入这场胡闹',exact:true}).click();
    await expect(page.getByRole('alert')).toContainText('房间不存在（选服测试）');expect(joined).toBe(true);
    await page.getByLabel('房间码',{exact:true}).fill('A-XYZ678');
    await expect(page.getByRole('group',{name:'六位旧房间码所属服务器'})).toHaveCount(0);
    await expect(page.getByText('此房间属于 阿里云内地，将直接连接该服务器。')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    expect(await page.getByRole('region',{name:'连接设置'}).boundingBox()).not.toBeNull();
  });
}
