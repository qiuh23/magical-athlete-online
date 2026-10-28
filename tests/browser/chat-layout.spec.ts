import { mkdirSync } from 'node:fs';
import { test, expect, type Browser, type Page } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import { createGame } from '../../src/engine/index.js';
import type { Room } from '../../src/shared/types.js';

let application: ReturnType<typeof createApplication>, url: string;
test.beforeAll(async () => {
  application = createApplication(':memory:');
  await new Promise<void>(resolve => application.http.listen(0, '127.0.0.1', resolve));
  const address = application.http.address();
  if (!address || typeof address === 'string') throw Error('Missing test address');
  url = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => { await application.close(); });

function publish(room: Room) {
  application.rooms.rooms.set(room.code, room); application.store.save(room);
  for (const socket of application.io.sockets.sockets.values()) {
    if (socket.data.identity?.roomCode === room.code) socket.emit('snapshot', application.rooms.view(room, socket.data.identity.playerId));
  }
}
async function fixture(browser: Browser, viewport: { width: number; height: number }) {
  const created = application.rooms.create('聊天定位验收', 8, 0);
  for(let index=1;index<8;index++)application.rooms.join(created.identity.roomCode,`选手${index+1}`);
  const room = structuredClone(application.rooms.get(created.identity.roomCode));
  const game = createGame(room.game.players, 123);
  game.phase = 'race'; game.round = 1; game.currentRacerId = 'r0';
  game.racers = game.players.map((player,index)=>({ id: `r${index}`, playerId: player.id, characterId: 'coach', position: 3+index*2, tripped: false, finished: false, eliminated: false, flags: {} }));
  game.baseTurnOrder = game.racers.map(racer=>racer.id); game.queue = []; room.game = game;
  room.version++; room.updatedAt = Date.now() + 60_000; publish(room);
  const context = await browser.newContext({ viewport });
  await context.addInitScript(identity => {
    localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`, JSON.stringify(identity));
    localStorage.setItem('magical-athlete:low-quality', 'true');
    localStorage.setItem('magical-athlete:muted', 'true');
    localStorage.setItem('magical-athlete:reduced-motion', 'true');
  }, created.identity);
  const page = await context.newPage(), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}/room/${room.code}`);
  await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle');
  return { context, page, code: room.code, errors };
}
function choice(code: string, size: 'short' | 'long' | 'none') {
  const room = structuredClone(application.rooms.get(code)); room.version++;
  room.game.pending = size === 'none' ? undefined : {
    id: `chat-layout-${size}-${room.version}`, playerId: room.hostId, racerId: 'r0', kind: 'coach',
    title: '聊天定位：选择技能', optional: false,
    options: Array.from({ length: size === 'long' ? 12 : 1 }, (_, index) => ({ id: `option-${index}`, label: size === 'long' ? `选择第 ${index + 1} 位角色发动技能，查看详细效果` : '选择角色' })), context: {},
  };
  publish(room);
}
async function rect(page: Page) {
  return page.getByTestId('room-community').evaluate(element => {
    const box = element.getBoundingClientRect();
    const child = element.querySelector('.room-chat,.chat-toggle')!.getBoundingClientRect();
    return { top: box.top, bottom: innerHeight-box.bottom, right: innerWidth - box.right, height: box.height, childHeight: child.height };
  });
}
async function stable(page: Page, before: Awaited<ReturnType<typeof rect>>, open: boolean) {
  await expect.poll(async () => Math.abs((await rect(page)).bottom - before.bottom)).toBeLessThan(1);
  const after = await rect(page); expect(Math.abs(after.right - before.right)).toBeLessThan(1);
  // A stale top constraint would stretch this bottom-anchored portal into an
  // invisible overlay that intercepts clicks above its visible contents.
  expect(Math.abs(after.height - after.childHeight)).toBeLessThan(1);
  if (open) expect(Math.abs(after.height - before.height)).toBeLessThan(1);
  expect(await page.evaluate(()=>{
      const chat=document.querySelector('[data-testid="room-community"]')!.getBoundingClientRect(),map=document.querySelector('[data-testid="board-minimap"]')!.getBoundingClientRect();
      return Math.min(chat.right,map.right)>Math.max(chat.left,map.left)&&Math.min(chat.bottom,map.bottom)>Math.max(chat.top,map.top);
    }),'chat must leave the entire minimap visible').toBe(false);
}
async function accessibleChoice(page: Page) {
  const choice = page.getByTestId('skill-choice');
  const boxes = await page.evaluate(() => {
    const chat = document.querySelector('[data-testid="room-chat"]')!.getBoundingClientRect();
    const skill = document.querySelector('[data-testid="skill-choice"]')!.getBoundingClientRect();
    const map=document.querySelector('[data-testid="board-minimap"]')!.getBoundingClientRect();
    return { overlap: Math.min(chat.right, skill.right) > Math.max(chat.left, skill.left) && Math.min(chat.bottom, skill.bottom) > Math.max(chat.top, skill.top), mapOverlap:Math.min(map.right,skill.right)>Math.max(map.left,skill.left)&&Math.min(map.bottom,skill.bottom)>Math.max(map.top,skill.top) };
  });
  expect(boxes.overlap).toBe(false);
  expect(boxes.mapOverlap).toBe(false);
  const button = choice.locator('.choice-options .button').first(); await button.scrollIntoViewIfNeeded();
  expect(await button.evaluate(element => {
    const box = element.getBoundingClientRect(); return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  })).toBe(true);
}

for (const [name, viewport] of [
  ['desktop', { width: 1280, height: 900 }],
  ['small-desktop', { width: 1024, height: 768 }],
  ['phone', { width: 390, height: 844 }],
  ['landscape', { width: 900, height: 500 }],
] as const) {
  test(`race chat stays anchored across skill selection and option resizing on ${name}`, async ({ browser }) => {
    const session = await fixture(browser, viewport); const { page, code } = session;
    try {
      const closed = await rect(page); await stable(page, closed, false);
      const mobile = viewport.width <= 650 || viewport.width <= 1000 && viewport.height <= 570;
      expect(closed.bottom).toBeLessThan(mobile ? 60 : 150);
      expect(closed.top).toBeGreaterThan(viewport.height * .65);
      choice(code, 'short'); await expect(page.getByTestId('skill-choice')).toBeVisible(); await stable(page, closed, false);
      const shortHeight = (await page.getByTestId('skill-choice').boundingBox())!.height;
      choice(code, 'long'); await expect(page.getByTestId('skill-choice').locator('.choice-options .button')).toHaveCount(12);
      expect((await page.getByTestId('skill-choice').boundingBox())!.height).toBeGreaterThanOrEqual(shortHeight);
      await stable(page, closed, false);
      await page.getByRole('button', { name: /^房间聊天/ }).click();
      await expect(page.getByTestId('room-chat')).toBeVisible(); const opened = await rect(page); await stable(page, opened, true);
      expect(Math.abs(opened.bottom - closed.bottom)).toBeLessThan(1); await accessibleChoice(page);
      choice(code, 'short'); await expect(page.getByTestId('skill-choice').locator('.choice-options .button')).toHaveCount(1); await stable(page, opened, true); await accessibleChoice(page);
      choice(code, 'long'); await expect(page.getByTestId('skill-choice').locator('.choice-options .button')).toHaveCount(12); await stable(page, opened, true); await accessibleChoice(page);
      await page.getByLabel('聊天消息', { exact: true }).fill('选择技能时聊天仍可发送');
      await page.getByRole('button', { name: '发送', exact: true }).click();
      await expect(page.getByLabel('聊天消息', { exact: true })).toHaveValue('');
      await expect(page.getByRole('log')).toContainText('选择技能时聊天仍可发送'); await stable(page, opened, true);
      if(!process.env.CI){mkdirSync('docs/qa/blimp-choice-skills', { recursive: true });await page.screenshot({ path: `docs/qa/blimp-choice-skills/chat-${name}.png` });}
      if (name === 'phone') {
        // Exercise the existing visualViewport keyboard bridge without assuming
        // that a desktop browser can display the operating system's phone keyboard.
        await page.evaluate(() => {
          Object.defineProperty(visualViewport!, 'height', { configurable: true, value: innerHeight - 260 });
          visualViewport!.dispatchEvent(new Event('resize'));
        });
        await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--chat-keyboard-offset'))).toBe('260px');
        await accessibleChoice(page);
        await expect(page.getByLabel('聊天消息', { exact: true })).toBeVisible();
        expect(await page.getByLabel('聊天消息', { exact: true }).evaluate(element => {
          const box = element.getBoundingClientRect(); return box.top >= 0 && box.bottom <= visualViewport!.height;
        })).toBe(true);
        await page.evaluate(() => { delete (visualViewport as unknown as { height?: number }).height; visualViewport!.dispatchEvent(new Event('resize')); });
        await stable(page, opened, true);
      }
      await page.getByRole('button', { name: '收起聊天' }).click(); await stable(page, closed, false);
      const room=application.rooms.get(code),sender=room.game.players[1]!;
      for(let index=0;index<3;index++)expect(application.rooms.chat(code,sender.id,{clientMessageId:crypto.randomUUID(),text:`底部新消息 ${index+1}，聊天提示也要给小地图和技能按钮留出空间。`}).ok).toBe(true);
      const batch=application.rooms.chatHistory(code,room.hostId);
      for(const socket of application.io.sockets.sockets.values())if(socket.data.identity?.roomCode===code)socket.emit('chat',batch);
      await expect(page.getByTestId('chat-notice')).toHaveCount(3);
      const noticesOverlap=await page.evaluate(()=>{
        const notices=document.querySelector('.chat-notice-region')!.getBoundingClientRect(),map=document.querySelector('[data-testid="board-minimap"]')!.getBoundingClientRect(),skill=document.querySelector('[data-testid="skill-choice"]')!.getBoundingClientRect();
        const intersects=(a:DOMRect,b:DOMRect)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);
        return {map:intersects(notices,map),skill:intersects(notices,skill)};
      });
      expect(noticesOverlap).toEqual({map:false,skill:false});
      const action=page.getByTestId('skill-choice').locator('.choice-options .button').first();await action.scrollIntoViewIfNeeded();
      expect(await action.evaluate(element=>{const b=element.getBoundingClientRect();return element.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));})).toBe(true);
      if(!process.env.CI)await page.screenshot({path:`docs/qa/blimp-choice-skills/chat-notice-${name}.png`});
      await page.getByRole('button',{name:/^房间聊天/}).click();await expect(page.getByTestId('chat-notice')).toHaveCount(0);
      await page.getByRole('button',{name:'收起聊天',exact:true}).click();
      choice(code, 'none'); await expect(page.getByTestId('skill-choice')).toHaveCount(0); await stable(page, closed, false);
      expect(session.errors).toEqual([]);
    } finally { await session.context.close(); }
  });
}
