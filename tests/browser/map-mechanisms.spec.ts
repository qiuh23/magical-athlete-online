import {test,expect} from '@playwright/test';
import {setCameraView} from './camera-controls.js';
/** Run the dev server first: node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5186.
 * These tests deliberately use the real Board3D and engine-arrival QA harness. */
const url=process.env.MECHANISM_QA_URL??'http://127.0.0.1:5186';
for(const [width,height] of [[390,844],[844,390],[1280,900]])test(`all maps and fixed mechanisms ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width:width!,height:height!});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${url}/qa/mechanisms.html?mechanisms=1`);
 for(const [track,count]of [['mild',0],['wild',10],['squiggle',13],['boardwalks',19],['bridges',0],['twisty-twirl',0],['whirly-world',12]]as const){
  await page.getByLabel('地图',{exact:true}).selectOption(track);const board=page.getByTestId('board-3d');await expect(board).toHaveAttribute('data-track',track);
  if(count){await expect(board).toHaveAttribute('data-mechanism-load','ready');await expect(board).toHaveAttribute('data-mechanism-count',String(count));}else{await expect(board).not.toHaveAttribute('data-mechanism-count');}
  await expect(board.locator('.scene-fallback')).toHaveCount(0);await expect(board.locator('.pawn-seat[data-racer-id="r0"]')).toHaveAttribute('data-model-ready','true');await setCameraView(board,'总览');
  await page.screenshot({path:`test-results/map-mechanisms/${track}-${width}x${height}.png`});
 }
 expect(errors).toEqual([]);
});
test('approved tile load failure preserves the board and retry recovers the exact cache group',async({page})=>{
 await page.route('**/models/mechanisms/approved_soft_track_tile.glb',route=>route.abort());await page.goto(`${url}/qa/mechanisms.html?mechanisms=1`);
 const board=page.getByTestId('board-3d');await expect(board.locator('.mechanism-load-error')).toBeVisible();await expect(board.locator('.scene-fallback')).toHaveCount(0);
 await page.unroute('**/models/mechanisms/approved_soft_track_tile.glb');await page.getByRole('button',{name:'重新载入机关'}).click();await expect(board.locator('.mechanism-load-error')).toHaveCount(0);await expect(board).toHaveAttribute('data-mechanism-load','ready');
});

for(const [width,height]of [[390,844],[844,390]]as const)test(`real arrow path and explicit pause ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});await page.goto(`${url}/qa/mechanisms.html?mechanisms=1`);await page.getByRole('button',{name:'后退24',exact:true}).click();const board=page.getByTestId('board-3d');await expect(board).toHaveAttribute('data-mechanism-load','ready');await expect(board.locator('.pawn-seat[data-racer-id="r0"]')).toHaveAttribute('data-model-ready','true');
 await page.getByRole('button',{name:'真实到达事件',exact:true}).click();await expect(board).toHaveAttribute('data-punch-state','prepare');await expect(board).toHaveAttribute('data-punch-state','fire');await page.getByRole('button',{name:'暂停',exact:true}).click();await expect(board).toHaveAttribute('data-playback-paused','true');const before=await board.getAttribute('data-mechanism-progress');await page.waitForTimeout(200);expect(await board.getAttribute('data-mechanism-progress')).toBe(before);await page.screenshot({path:`test-results/map-mechanisms/arrow-paused-${width}x${height}.png`});await page.getByRole('button',{name:'继续',exact:true}).click();await expect(board.locator('[data-testid="scene-racer"][data-racer-id="r0"]')).toHaveAttribute('data-position','22');
});
test('native two-person trip uses arrival reflow and only the real new target',async({page})=>{
 await page.setViewportSize({width:1280,height:900});await page.goto(`${url}/qa/mechanisms.html?mechanisms=1`);await page.getByRole('button',{name:'原生双人绊倒5',exact:true}).click();const board=page.getByTestId('board-3d');await expect(board).toHaveAttribute('data-mechanism-load','ready');for(const id of ['r0','r1'])await expect(board.locator(`.pawn-seat[data-racer-id="${id}"]`)).toHaveAttribute('data-model-ready','true');await page.getByRole('button',{name:'真实到达事件',exact:true}).click();await expect(board).toHaveAttribute('data-trip-state','entry');await expect(board).toHaveAttribute('data-trip-state','trip');await expect(board).toHaveAttribute('data-mechanism-actions','5:trip:r0');await page.screenshot({path:'test-results/map-mechanisms/native-trip.png'});
});

for(const [button,mode]of[['传送双人5','single-resident-reflow'],['传送五人5','hidden-until-snapshot']]as const)test(`warp occupants, pause/quality/skip restoration: ${mode}`,async({page})=>{
 await page.setViewportSize({width:844,height:390});await page.goto(`${url}/qa/mechanisms.html?mechanisms=1`);await page.getByRole('button',{name:button,exact:true}).click();const board=page.getByTestId('board-3d'),target=board.locator('.pawn-seat[data-racer-id="r0"]');await expect(board).toHaveAttribute('data-mechanism-load','ready');await expect(target).toHaveAttribute('data-model-ready','true');await page.getByRole('button',{name:'真实到达事件',exact:true}).click();await expect(target).toHaveAttribute('data-warp-mode',mode);await page.getByRole('button',{name:'暂停',exact:true}).click();const opacity=await target.evaluate(e=>e.style.opacity);await page.getByRole('button',{name:'标准画质',exact:true}).click();await page.waitForTimeout(150);expect(await target.evaluate(e=>e.style.opacity)).toBe(opacity);await page.screenshot({path:`test-results/map-mechanisms/warp-${mode}.png`});await page.getByRole('button',{name:'跳过当前段',exact:true}).click();await expect(target).toHaveAttribute('data-warp-mode','ordinary');await expect.poll(()=>target.evaluate(e=>e.style.opacity)).toBe('');await expect(board.locator('[data-testid="scene-racer"][data-racer-id="r0"]')).toHaveAttribute('data-position','5');await expect(board.locator('[data-testid="scene-racer"][data-racer-id="r1"]')).toHaveAttribute('data-position','5');
});

for(const [width,height]of [[390,844],[1280,900]]as const)test(`finite certified Trip, down pose and pause ${width}x${height}`,async({page})=>{
 await page.setViewportSize({width,height});await page.goto(`${url}/qa/mechanisms.html?mechanisms=1`);await page.getByRole('button',{name:'认证绊倒17',exact:true}).click();const board=page.getByTestId('board-3d');await expect(board).toHaveAttribute('data-mechanism-load','ready');await expect(board.locator('.pawn-seat[data-racer-id="r0"]')).toHaveAttribute('data-model-ready','true');await page.getByRole('button',{name:'真实到达事件',exact:true}).click();await expect(board).toHaveAttribute('data-certified-trip',new RegExp('wild/17/'));await page.getByRole('button',{name:'暂停',exact:true}).click();const before=await board.getAttribute('data-certified-trip-progress');await page.waitForTimeout(150);expect(await board.getAttribute('data-certified-trip-progress')).toBe(before);await page.screenshot({path:`test-results/map-mechanisms/certified-trip-${width}x${height}.png`});await page.getByRole('button',{name:'继续',exact:true}).click();await expect(board).toHaveAttribute('data-phase','idle');await expect(board.locator('[data-testid="scene-racer"][data-racer-id="r0"]')).toContainText('绊倒');
});
