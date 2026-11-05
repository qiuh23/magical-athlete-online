import { test, expect } from './fixtures.js';
test.use({actionTimeout:10000});

test('手机与桌面直接操作全部玩法，规则菜单完整且不改动草稿',async({page},info)=>{
  await page.goto('/');await page.getByRole('tab',{name:'创建房间',exact:true}).click();
  for(const [width,height] of [[320,568],[390,844],[844,390],[1440,900]]){
    await page.setViewportSize({width:width!,height:height!});
    for(const selector of ['.competition-settings','.map-settings','.pack-settings','.player-settings','.special-event-settings'])await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator('.room-config-fields details,.room-config-fields a')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    const fields=await page.locator('.room-config-fields').boundingBox(),submit=await page.locator('.entry-submit').boundingBox();
    expect(submit!.width).toBeCloseTo(fields!.width,0);
  }
  await page.setViewportSize({width:390,height:844});
  await page.getByLabel('房间人数上限').selectOption('3');
  await page.getByRole('radio',{name:'三人双角色',exact:true}).check();
  await page.getByRole('checkbox',{name:'Extra Mile',exact:true}).check();
  await page.getByLabel('比赛场数').selectOption('8');
  await page.getByRole('checkbox',{name:'Extra Mile',exact:true}).uncheck();
  await expect(page.getByRole('alert')).toContainText('缺');
  await expect(page.locator('.config-total')).toHaveClass(/is-insufficient/);
  await expect(page.getByRole('button',{name:'创建房间，召集朋友',exact:true})).toBeDisabled();
  await page.getByRole('checkbox',{name:'Extra Mile',exact:true}).check();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button',{name:'添加 Mild Mile',exact:true}).click();
  await page.getByRole('button',{name:'添加 Mild Mile',exact:true}).click();
  await page.getByRole('button',{name:'上移第4项',exact:true}).click();
  const rotation=await page.locator('.rotation-list li>span').allTextContents();
  await page.getByRole('checkbox',{name:'启用特殊赛事',exact:true}).check();
  await page.getByRole('checkbox',{name:'第 8 场',exact:true}).check();
  await page.getByRole('radio',{name:/经典赛/}).check();
  await expect(page.getByRole('alert')).toContainText('第 8 场超出当前 4 场');
  await expect(page.getByRole('checkbox',{name:'第 8 场（超出当前 4 场）',exact:true})).toBeChecked();
  await page.getByRole('radio',{name:'自定义积分赛',exact:true}).check();
  expect(await page.locator('.rotation-list li>span').allTextContents()).toEqual(rotation);
  await expect(page.getByRole('checkbox',{name:'Extra Mile',exact:true})).toBeChecked();
  await expect(page.getByRole('radio',{name:'三人双角色',exact:true})).toBeChecked();
  await page.getByLabel('比赛场数').selectOption('4');
  await expect(page.getByRole('alert')).toContainText('原设置已保留');
  // This out-of-range control is removed by the click itself.
  await page.getByRole('checkbox',{name:'第 8 场（超出当前 4 场）',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'第 8 场（超出当前 4 场）',exact:true})).toHaveCount(0);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button',{name:'怎么玩',exact:true}).click();
  await page.getByRole('tab',{name:'特殊赛事',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'怎么玩',exact:true});
  await expect(dialog).toContainText('不是同时启用36项');
  await expect(dialog.locator('table').filter({has:page.getByRole('columnheader',{name:'本场规则',exact:true})}).locator('tbody tr')).toHaveCount(36);
  await dialog.getByRole('heading',{name:'事件清单',exact:true}).scrollIntoViewIfNeeded();
  await page.getByRole('tab',{name:'地图与计分',exact:true}).click();
  await expect(dialog).toContainText('同分共享胜利');
  await page.getByRole('tab',{name:'角色包与人数',exact:true}).click();
  await expect(dialog).toContainText('跨扩展组合待复核');
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  expect(await page.locator('.rotation-list li>span').allTextContents()).toEqual(rotation);
  await page.locator('.room-config-fields').screenshot({path:info.outputPath('visible-mobile-options.png')});
});
