import {test,expect} from '@playwright/test';
import {MOTION_ACTORS,MOTION_CASES} from '../../qa/motion-fixtures.js';
const url=process.env.MOTION_QA_URL??'http://127.0.0.1:5191';
/** Browser pixel/mesh checks. This suite must actually run before claiming browser QA.
 * It uses original Board3D, real engine events and original character GLBs. */
for(const [width,height] of [[390,844],[1280,900]] as const)for(const low of [false,true])test(`real mechanism meshes ${width}x${height} ${low?'economy':'standard'}`,async({page})=>{
 test.setTimeout(900_000);await page.setViewportSize({width,height});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${url}/qa/motion-proof.html?environment=1&mechanisms=1${low?'&low=1':''}`);
 for(const actor of MOTION_ACTORS)for(const scenario of MOTION_CASES){
  await page.getByLabel('角色',{exact:true}).selectOption(actor.label);await page.getByLabel('事件',{exact:true}).selectOption(scenario.id);
  await expect.poll(()=>page.evaluate(()=>(window as any).__motionProof?.snapshot().actorReady)).toBe(true);
  const read=()=>page.evaluate(()=>(window as any).__motionProof.snapshot());
  await expect.poll(async()=>{const s=await read();return s.meshes.some((m:any)=>m.anchor===`${scenario.track}:${scenario.node}`);}).toBe(true);
  await page.getByRole('button',{name:'0',exact:true}).click();const before=await read();
  await page.getByRole('button',{name:'0.22',exact:true}).click();
  await expect.poll(async()=>{const mid=await read();return mid.meshes.some((m:any)=>m.anchor&&before.meshes.some((b:any)=>b.anchor===m.anchor&&b.name===m.name&&b.matrix.some((x:number,i:number)=>Math.abs(x-m.matrix[i])>1e-4)));}).toBe(true);
  await expect(page.getByTestId('board-3d').locator('.scene-fallback')).toHaveCount(0);
  if(actor.label==='blimp'||actor.label==='hog-knight-mounted')await page.screenshot({path:`test-results/motion-proof/${scenario.id}-${actor.label}-${width}-${low?'low':'standard'}-mid.png`});
  await page.getByRole('button',{name:'1',exact:true}).click();
 }
 expect(errors).toEqual([]);
});
