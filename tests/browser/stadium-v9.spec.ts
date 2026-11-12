import { test, expect, type Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
let server: ViteDevServer;
let url: string;
test.beforeAll(async () => {
  server = await createServer({ server: { host:'127.0.0.1', port:0 }, logLevel:'error' });
  await server.listen();
  const address=server.httpServer!.address();
  if (!address || typeof address === 'string') throw Error('Missing fixture server address');
  url=`http://127.0.0.1:${address.port}/tests/fixtures/stadium-v9.html`;
});
test.afterAll(async()=>{await server?.close();});
async function overview(page:Page) {
  await page.getByLabel('镜头设置',{exact:true}).click();
  await page.getByRole('button',{name:'总览',exact:true}).click();
  await page.getByLabel('镜头设置',{exact:true}).click();
}
for (const viewport of [{width:1280,height:900},{width:390,height:844}]) {
  test(`stadium V9 preserves real board ${viewport.width}px across mode/quality/lifecycle`,async({page},testInfo)=>{
    await page.setViewportSize(viewport);
    const errors:string[]=[]; page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url);
    const board=page.getByTestId('board-3d');
    await expect(board).toHaveAttribute('data-track-model','stadium-v9',{timeout:60000});
    await expect(page.locator('.pawn-seat')).toHaveCount(8);
    await overview(page);
    await expect(board).toHaveAttribute('data-stadium-tall-count','2');
    for(const mode of ['day','dusk','night','day'] as const) {
      await page.evaluate(mode=>window.stadiumFixture({mode}),mode);
      await expect(board).toHaveAttribute('data-appearance-mode',mode);
      await page.screenshot({path:testInfo.outputPath(`${viewport.width}-${mode}.png`)});
    }
    const metrics=()=>board.evaluate(element=>Object.fromEntries(['drawCalls','triangles','geometries','textures','programs','renderFrameCount'].map(key=>[key,Number((element as HTMLElement).dataset[key])])));
    const warm=await metrics();
    await testInfo.attach('warm-renderer-info',{body:JSON.stringify(warm),contentType:'application/json'});
    for(let cycle=0;cycle<3;cycle++) {
      await page.evaluate(()=>window.stadiumFixture({lowQuality:true,mode:'night'}));
      await expect(board).toHaveAttribute('data-track-model','procedural');
      await expect(board).toHaveAttribute('data-quality','economy');
      await page.evaluate(()=>window.stadiumFixture({lowQuality:false,mode:'day'}));
      await expect(board).toHaveAttribute('data-track-model','stadium-v9');
    }
    const after=await metrics();
    for(const key of ['geometries','textures','programs']) expect(after[key]).toBeLessThanOrEqual(warm[key]!+2);
    await page.getByRole('button',{name:'恢复默认视角',exact:true}).click();
    await expect(board).toHaveAttribute('data-stadium-tall-count','0');
    for(const position of [0,7,30]) {
      await page.evaluate(position=>window.stadiumFixture({position,reversed:true,track:'wild'}),position);
      await expect(page.locator('.pawn-seat')).toHaveCount(8);
      await page.screenshot({path:testInfo.outputPath(`${viewport.width}-reversed-${position}.png`)});
    }
    await page.evaluate(()=>window.stadiumFixture({intro:true,position:0}));
    await expect(board).toHaveAttribute('data-stadium-tall-count','0');
    await page.evaluate(()=>window.stadiumFixture({intro:false,paused:true}));
    await expect(board).toHaveAttribute('data-frameloop','demand');
    // Explicit sleep measures demand-idle behavior, not an FPS claim.
    await page.waitForTimeout(800);
    const idle=Number(await board.getAttribute('data-render-frame-count'));
    await page.waitForTimeout(800);
    expect(Number(await board.getAttribute('data-render-frame-count'))-idle).toBeLessThanOrEqual(1);
    await page.evaluate(()=>window.stadiumFixture({mounted:false}));
    await expect(board).toHaveCount(0);
    await page.evaluate(()=>window.stadiumFixture({mounted:true,paused:false,track:'mild',position:0,reversed:false}));
    await expect(board).toHaveAttribute('data-track-model','stadium-v9');
    await expect(page.locator('.pawn-seat')).toHaveCount(8);
    expect(errors).toEqual([]);
  });
}
test('missing GLB keeps procedural track, labels and camera usable',async({page})=>{
  await page.route('**/models/stadium-v7/*.glb',route=>route.abort());
  await page.goto(url);
  const board=page.getByTestId('board-3d');
  await expect(page.locator('.pawn-seat')).toHaveCount(8);
  await expect(board).toHaveAttribute('data-track-model','procedural');
  await expect(page.locator('.scene-fallback')).toHaveCount(0);
  await overview(page);
  await expect(board).toHaveAttribute('data-camera-state','overview');
});
