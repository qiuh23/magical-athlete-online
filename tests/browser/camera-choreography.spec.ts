import { test, expect, type Browser, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createApplication } from '../../src/server/index.js';
import { createGame, resolveTasks } from '../../src/engine/index.js';
import type { GameState } from '../../src/shared/types.js';
import { boardPoint } from '../../src/client/scene/math.js';
import { cameraProject, pawnWorldPoint } from '../../src/client/scene/camera.js';

let app: ReturnType<typeof createApplication>, url: string;
test.beforeAll(async () => {
  app = createApplication(':memory:');
  await new Promise<void>(resolve => app.http.listen(0, '127.0.0.1', resolve));
  const address = app.http.address();
  if (!address || typeof address === 'string') throw Error('Missing camera test address');
  url = `http://127.0.0.1:${address.port}`;
  mkdirSync('docs/qa/camera-choreography', { recursive: true });
});
test.afterAll(async () => { await app.close(); });

async function fixture(browser: Browser, compact: boolean, configure: (game: GameState) => void, reduced = false) {
  const created = app.rooms.create('镜头验收', 1, 0, 'practice', 0, 'mixed'), code = created.identity.roomCode;
  const room = structuredClone(app.rooms.get(code)), game = createGame(room.game.players, 123, 'practice', 'mixed');
  game.phase = 'race'; game.round = 1; game.currentRacerId = 'r0';
  game.racers = ['coach', 'scoocher', 'leaf-triangle-man'].map((characterId, index) => ({ id: `r${index}`, playerId: game.players[0]!.id, characterId, position: 11 + index, tripped: false, finished: false, eliminated: false, flags: {} }));
  game.baseTurnOrder = game.racers.map(racer => racer.id);
  game.flags.testDice = [3]; game.queue = [{ kind: 'beginTurn', racerId: 'r0' }]; resolveTasks(game);
  configure(game); room.game = game; room.version++; room.updatedAt = Date.now() + 60_000;
  app.rooms.rooms.set(code, room); app.store.save(room);
  const context = await browser.newContext({ viewport: compact ? { width: 390, height: 844 } : { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  await context.addInitScript(({ identity, reduced }) => {
    localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`, JSON.stringify(identity));
    localStorage.setItem('magical-athlete:animation-speed', '1');
    localStorage.setItem('magical-athlete:low-quality', 'true');
    localStorage.setItem('magical-athlete:reduced-motion', String(reduced));
    localStorage.setItem('magical-athlete:muted', 'true');
  }, { identity: created.identity, reduced });
  const page = await context.newPage(), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}/room/${code}`);
  await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle');
  await expect.poll(async () => Number(await page.getByTestId('board-3d').getAttribute('data-triangles'))).toBeGreaterThan(100);
  await recordCamera(page);
  return { context, page, code, errors };
}

function publish(code: string, change: (game: GameState) => void) {
  const room = structuredClone(app.rooms.get(code)); change(room.game);
  room.version++; room.updatedAt = Date.now() + 60_000;
  app.rooms.rooms.set(code, room); app.store.save(room);
  for (const socket of app.io.sockets.sockets.values()) if (socket.data.identity?.roomCode === code) socket.emit('snapshot', app.rooms.view(room, socket.data.identity.playerId));
}

interface CameraRecord { phase: string; state: string; events: number[]; ids: string; positions: number[]; shot: string; piece: string; x: number; z: number; zoom: number }
async function recordCamera(page: Page) {
  await page.evaluate(() => {
    const records: unknown[] = []; (window as unknown as { __cameraRecords: unknown[] }).__cameraRecords = records;
    const board = document.querySelector('[data-testid="board-3d"]') as HTMLElement;
    let previous = '';
    const capture = () => {
      const data = board.dataset;
      const value = { phase: data.phase, state: data.cameraState, events: data.eventIds?.split(',').filter(Boolean).map(Number), ids: data.cameraTargetIds, positions: data.cameraPositions?.split(',').filter(Boolean).map(Number), shot: data.cameraShot, piece: data.cameraPiece ?? '', x: Number(data.cameraX), z: Number(data.cameraZ), zoom: Number(data.cameraZoom) };
      const key = JSON.stringify(value); if (key !== previous) { previous = key; records.push(value); }
    };
    new MutationObserver(capture).observe(board, { attributes: true, attributeFilter: ['data-phase', 'data-event-ids', 'data-camera-state', 'data-camera-target-ids', 'data-camera-positions', 'data-camera-shot', 'data-camera-piece', 'data-camera-target', 'data-camera-zoom'] });
    capture();
  });
}
const records = (page: Page): Promise<CameraRecord[]> => page.evaluate(() => (window as unknown as { __cameraRecords: CameraRecord[] }).__cameraRecords);
async function saveEvidence(page: Page, name: string) {
  const path = test.info().outputPath(`${name}.json`); writeFileSync(path, JSON.stringify(await records(page), null, 2));
  await test.info().attach(`${name}.json`, { path, contentType: 'application/json' });
}

for (const compact of [false, true]) {
  const device = compact ? 'phone' : 'desktop';
  test(`Blimp repeated marker moves stay at the event position on ${device}`, async ({ browser }) => {
    const f = await fixture(browser, compact, game => {
      game.racers = [game.racers[0]!]; game.racers[0]!.position = 17;
      game.flags.thirds = { id: 'blimp', round: 1, held: {}, extraCards: [], npc: { id: 'blimp', position: 16 } };
    });
    try {
      const board = f.page.getByTestId('board-3d');
      for (const from of [16, 17]) {
        publish(f.code, game => { game.queue = [{ kind: 'beginTurn', racerId: 'r0' }]; resolveTasks(game); });
        const marker = app.rooms.get(f.code).game.logs.findLast(event => event.type === 'event-marker')!;
        expect(marker.before).toEqual([from]); expect(marker.after).toEqual([from + 1]);
        await expect.poll(async () => (await records(f.page)).some(value => value.events.includes(marker.id) && value.piece === 'event-npc' && value.positions.includes(from) && value.positions.includes(from + 1))).toBe(true);
        await expect(board).toHaveAttribute('data-phase', 'idle', { timeout: 20000 });
        const seen = (await records(f.page)).filter(value => value.events.includes(marker.id));
        expect(seen.length).toBeGreaterThan(0);
        expect(seen.every(value => !value.positions.includes(0))).toBe(true);
        const start = boardPoint(0, compact);
        expect(seen.every(value => Math.hypot(value.x - start[0], value.z - start[2]) > 5), 'the real moving camera must never detour through the start').toBe(true);
      }
      await f.page.screenshot({ path: `docs/qa/camera-choreography/blimp-${device}.png` });
      await saveEvidence(f.page, `blimp-${device}`); expect(f.errors).toEqual([]);
    } finally { await saveEvidence(f.page, 'camera-observations').catch(() => {}); await f.context.close(); }
  });

  test(`nearby Triangle and Scoocher skills share a stable shot on ${device}`, async ({ browser }) => {
    const f = await fixture(browser, compact, () => {});
    try {
      await f.page.getByTestId('roll-button').click();
      const board = f.page.getByTestId('board-3d');
      const logs = app.rooms.get(f.code).game.logs;
      const triangle = logs.find(event => event.type === 'power' && event.source === 'r2')!;
      const scoocher = logs.find(event => event.type === 'power' && event.source === 'r1')!;
      expect(triangle).toBeDefined(); expect(scoocher).toBeDefined();
      await expect.poll(async () => (await records(f.page)).some(value => value.events.includes(scoocher.id))).toBe(true);
      const seen = await records(f.page), first = seen.find(value => value.events.includes(triangle.id))!, second = seen.find(value => value.events.includes(scoocher.id))!;
      expect(first.ids.split(',').sort()).toEqual(['r1', 'r2']); expect(second.shot).toBe(first.shot); expect(second.positions).toEqual(first.positions);
      await expect(board).toHaveAttribute('data-phase', 'skill');
      // The composition is held long enough for the real smoothed camera to
      // land. Verify the model bounds, then capture this shared skill shot.
      await expect.poll(async () => {
        const value = (await records(f.page)).at(-1)!;
        const focusPoints = [12, 13, 14].map(position => boardPoint(position, compact));
        const x = (Math.min(...focusPoints.map(point => point[0])) + Math.max(...focusPoints.map(point => point[0]))) / 2;
        const z = (Math.min(...focusPoints.map(point => point[2])) + Math.max(...focusPoints.map(point => point[2]))) / 2;
        return Math.hypot(value.x - x, value.z - z);
      }).toBeLessThan(.18);
      const current = (await records(f.page)).at(-1)!, viewport = f.page.viewportSize()!;
      const banner = await f.page.getByTestId('skill-banner').boundingBox(); expect(banner).not.toBeNull();
      const displayed = app.rooms.get(f.code).game.racers.map(racer => ({ ...racer, position: racer.id === 'r2' ? 14 : racer.id === 'r1' ? 12 : 11 }));
      for (const id of ['r1', 'r2']) {
        const racer = displayed.find(value => value.id === id)!, point = pawnWorldPoint(racer, displayed, racer.position, compact);
        const corners: { x: number; y: number }[] = [];
        for (const dx of [-.9, .9]) for (const dz of [-.9, .9]) for (const y of [-.3, 2.65]) {
          const projected = cameraProject([point[0] - current.x + dx, point[1] + y, point[2] - current.z + dz], compact);
          expect(Math.abs(projected.x) * current.zoom).toBeLessThan(viewport.width / 2 - 10);
          expect(Math.abs(projected.y) * current.zoom).toBeLessThan(viewport.height / 2 - 90);
          corners.push({ x: viewport.width / 2 + projected.x * current.zoom, y: viewport.height / 2 - projected.y * current.zoom });
        }
        const left = Math.min(...corners.map(value => value.x)), right = Math.max(...corners.map(value => value.x));
        const top = Math.min(...corners.map(value => value.y)), bottom = Math.max(...corners.map(value => value.y));
        expect(banner!.x > right || banner!.x + banner!.width < left || banner!.y > bottom || banner!.y + banner!.height < top, 'the skill caption must leave both models fully visible').toBe(true);
      }
      await f.page.screenshot({ path: `docs/qa/camera-choreography/nearby-skills-${device}.png` });
      await expect(board).toHaveAttribute('data-phase', 'idle', { timeout: 30000 });
      await saveEvidence(f.page, `nearby-skills-${device}`);
      // User camera intent still takes precedence throughout a new chain.
      await f.page.getByRole('button', { name: '总览', exact: true }).click();
      publish(f.code, game => { game.flags.testDice = [3]; game.queue = [{ kind: 'beginTurn', racerId: 'r0' }]; resolveTasks(game); });
      await f.page.getByTestId('roll-button').click();
      await expect(board).toHaveAttribute('data-phase', 'dice');
      await expect(board).toHaveAttribute('data-camera-state', 'overview');
      await f.page.getByRole('button', { name: '恢复默认视角', exact: true }).click();
      // Start on the board canvas, outside the overlaid dice canvas on phones.
      const x = compact ? 25 : 400, y = compact ? 560 : 480;
      expect(await f.page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.board-webgl'), { x, y })).toBe(true);
      await f.page.mouse.move(x, y); await f.page.mouse.down();
      await f.page.mouse.move(x + 55, y + 20, { steps: 5 }); await f.page.mouse.up();
      await expect(board).toHaveAttribute('data-camera-state', 'manual');
      const nextTriangle = app.rooms.get(f.code).game.logs.findLast(event => event.type === 'power' && event.source === 'r2')!;
      await expect.poll(async () => (await records(f.page)).some(value => value.events.includes(nextTriangle.id))).toBe(true);
      await expect(board).toHaveAttribute('data-camera-state', 'manual');
      await f.page.getByRole('button', { name: '恢复默认视角', exact: true }).click();
      await expect(board).toHaveAttribute('data-camera-state', 'self');
      expect(f.errors).toEqual([]);
    } finally { await saveEvidence(f.page, 'camera-observations').catch(() => {}); await f.context.close(); }
  });
}

test('stage NPC dice keep the actual piece in view with reduced motion', async ({ browser }) => {
  const f = await fixture(browser, true, game => {
    game.racers = [game.racers[0]!]; game.racers[0]!.position = 2; game.flags.testDice = [4];
    game.flags.thirds = { id: 'mouth', round: 1, held: {}, extraCards: [], npc: { id: 'mouth', position: 30 } };
  }, true);
  try {
    publish(f.code, game => { game.queue = [{ kind: 'beginTurn', racerId: 'r0' }]; resolveTasks(game); });
    await expect.poll(async () => (await records(f.page)).some(value => value.phase === 'dice' && value.piece === 'event-npc' && value.positions.length === 1 && value.positions[0] === 30)).toBe(true);
    await expect(f.page.getByTestId('board-3d')).toHaveAttribute('data-event-marker', '26', { timeout: 15000 });
    expect((await records(f.page)).filter(value => value.piece === 'event-npc').every(value => !value.positions.includes(0))).toBe(true);
    await saveEvidence(f.page, 'stage-die-reduced-motion'); expect(f.errors).toEqual([]);
  } finally { await saveEvidence(f.page, 'camera-observations').catch(() => {}); await f.context.close(); }
});
