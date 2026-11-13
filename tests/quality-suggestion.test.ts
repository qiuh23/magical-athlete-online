import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function sourceModule(file: string, require: (name: string) => unknown, globals: Record<string, unknown> = {}) {
  const source = readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports: Record<string, any> = {};
  vm.runInNewContext(code, { exports, require, ...globals });
  return exports;
}
function events() {
  const handlers = new Map<string, Set<() => void>>();
  return {
    addEventListener(name: string, fn: () => void) { if (!handlers.has(name)) handlers.set(name, new Set()); handlers.get(name)!.add(fn); },
    removeEventListener(name: string, fn: () => void) { handlers.get(name)?.delete(fn); },
    emit(name: string) { for (const fn of [...handlers.get(name) ?? []]) fn(); },
  };
}
function monitor(initialEnabled = true) {
  let now = 0, frame: (state: any, delta: number) => void;
  const refs: { current: any }[] = [], cleanups: (() => void)[] = [], effects: (() => void | (() => void))[] = [], notices: string[] = [];
  const win = { ...events(), visualViewport: events() }, doc = { ...events(), visibilityState: 'visible', focused: true, hasFocus() { return this.focused; } };
  let cursor = 0;
  const component = sourceModule('src/client/scene/QualitySuggestionMonitor.tsx', name => name === 'react' ? {
    useRef: (value: any) => refs[cursor++] ?? (refs[cursor - 1] = { current: value }),
    useEffect: (fn: () => void | (() => void)) => effects.push(fn),
  } : name === '@react-three/fiber' ? { useFrame: (fn: typeof frame) => { frame = fn; } } : {}, { window: win, document: doc, performance: { now: () => now } });
  const state = { frameloop: 'always', size: { width: 1200, height: 800 }, gl: { getPixelRatio: () => 1.5, getContext: () => ({ isContextLost: () => false }) } };
  const props = { enabled: initialEnabled, scope: 'room:1:mild', onSuggestion: (event: string) => notices.push(event) };
  function render() { cursor = 0; component.QualitySuggestionMonitor(props); while (effects.length) { const cleanup = effects.shift()!(); if (cleanup) cleanups.push(cleanup); } }
  render();
  const step = (delta = .05, count = 1, mode = 'always') => { state.frameloop = mode; for (let i = 0; i < count; i++) { now += Number.isFinite(delta) && delta > 0 ? delta * 1000 : 16; frame!(state, delta); } };
  // Initialize real viewport, then finish the mount/viewport settle period.
  step(.016); now = 4000;
  return { step, notices, state, doc, win, props, render, jump: (ms: number) => { now += ms; }, count: () => notices.filter(value => value === 'suggest').length, unmount: () => cleanups.forEach(fn => fn()) };
}

test('real monitor callbacks never treat 20/10 Hz demand clocks as slow animation', () => {
  const m = monitor(); m.step(.05, 90, 'demand'); m.step(.1, 300, 'demand');
  assert.equal(m.count(), 0);
});
test('repeated short slow animation bursts trigger once; demand and resume deltas are excluded', () => {
  const m = monitor();
  for (let i = 0; i < 3; i++) { m.step(.05, 17); if (i < 2) { assert.equal(m.count(), 0); m.step(.1, 5, 'demand'); } }
  assert.equal(m.count(), 1); m.step(.05, 200); assert.equal(m.count(), 1);
  const healthy = monitor(); for (let i = 0; i < 12; i++) { healthy.step(.1, 10, 'demand'); healthy.step(.05); healthy.step(1 / 60, 50); }
  assert.equal(healthy.count(), 0);
});
test('initialization, healthy windows, invalid/long gaps and sparse evidence cannot trigger', () => {
  const warming = monitor(); warming.win.emit('resize'); warming.step(.05, 30); assert.equal(warming.count(), 0);
  const healthy = monitor(); healthy.step(.05, 33); healthy.step(1 / 60, 50); healthy.step(.05, 16); assert.equal(healthy.count(), 0);
  for (const gap of [.3, Number.NaN, 0]) { const m = monitor(); m.step(.05, 33); m.step(gap); m.jump(2100); m.step(.05, 17); assert.equal(m.count(), 0); }
  const idle = monitor(); idle.step(.05, 33); idle.jump(11_000); idle.step(.05, 17); assert.equal(idle.count(), 0);
  const stale = monitor(); for (let i = 0; i < 5; i++) { stale.step(.05, 9); stale.step(.05, 150, 'demand'); } assert.equal(stale.count(), 0);
});
test('blur, hidden pages, resize and viewport changes clear previous evidence', () => {
  for (const event of ['blur', 'focus', 'resize']) { const m = monitor(); m.step(.05, 33); m.win.emit(event); m.jump(2100); m.step(.05, 17); assert.equal(m.count(), 0); }
  const hidden = monitor(); hidden.step(.05, 33); hidden.doc.visibilityState = 'hidden'; hidden.step(.05, 100); hidden.doc.visibilityState = 'visible'; hidden.doc.emit('visibilitychange'); hidden.jump(2100); hidden.step(.05, 17); assert.equal(hidden.count(), 0);
  const blurred = monitor(); blurred.doc.focused = false; blurred.step(.05, 200); assert.equal(blurred.count(), 0);
  const viewport = monitor(); viewport.step(.05, 33); viewport.win.visualViewport.emit('resize'); viewport.jump(2100); viewport.step(.05, 17); assert.equal(viewport.count(), 0);
  const resized = monitor(); resized.step(.05, 33); resized.state.size.width = 600; resized.step(.05); resized.jump(2100); resized.step(.05, 17); assert.equal(resized.count(), 0);
});
test('disabled/reduced/economy/lost scenes cannot suggest and unmount signals unavailability', () => {
  const disabled = monitor(false); disabled.step(.05, 200); assert.equal(disabled.count(), 0);
  const lost = monitor(); lost.state.gl.getContext = () => ({ isContextLost: () => true }); lost.step(.05, 200); assert.equal(lost.count(), 0);
  const m = monitor(); m.step(.05, 50); assert.equal(m.count(), 1); m.unmount(); assert.equal(m.notices.at(-1), 'unavailable');
});

// Small deterministic hook runtime executing the actual hook and JSX callbacks.
// React scheduling is flushed after each event; this is not browser-layout QA.
function hintModule(storage = new Map<string, string>(), denied = false) {
  const slots: any[] = [], effectDeps: any[][] = [], effectCleanups: (() => void)[] = [];
  let cursor = 0, dirty = false, pending: (() => void)[] = [], now = 0, timerId = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  const win = { ...events(), innerHeight: 800, visualViewport: { ...events(), height: 800 }, setTimeout: (fn: () => void, ms: number) => { const id = ++timerId; timers.set(id, { at: now + ms, fn }); return id; } };
  const doc = { ...events(), visibilityState: 'visible', hasFocus: () => true };
  const jsx = (type: any, props: any) => ({ type, props });
  const module = sourceModule('src/client/QualitySuggestion.tsx', name => name === 'react' ? {
    useState: (init: any) => { const id = cursor++; if (!(id in slots)) slots[id] = typeof init === 'function' ? init() : init; return [slots[id], (value: any) => { slots[id] = value; dirty = true; }]; },
    useRef: (value: any) => { const id = cursor++; return slots[id] ?? (slots[id] = { current: value }); },
    useCallback: (fn: any, deps: any[]) => { const id = cursor++; if (!slots[id] || deps.some((v, i) => v !== slots[id].deps[i])) slots[id] = { fn, deps }; return slots[id].fn; },
    useEffect: (fn: () => void | (() => void), deps: any[]) => { const id = cursor++; if (!effectDeps[id] || deps.some((value, i) => value !== effectDeps[id][i])) { effectDeps[id] = deps; pending.push(() => { effectCleanups[id]?.(); effectCleanups[id] = fn() || (() => {}); }); } },
  } : name === 'react/jsx-runtime' ? { jsx, jsxs: jsx } : {}, {
    window: win, document: doc, clearTimeout: (id: number) => timers.delete(id),
    localStorage: { getItem: (key: string) => { if (denied) throw Error('denied'); return storage.get(key); }, setItem: (key: string, value: string) => { if (denied) throw Error('denied'); storage.set(key, value); } },
  });
  let result: any, writes: boolean[] = [];
  const props = { enabled: true, blocked: false, setLowQuality: (value: boolean) => writes.push(value) };
  const render = () => { let count = 0; do { dirty = false; cursor = 0; result = module.useQualitySuggestion(props); const run = pending; pending = []; run.forEach(fn => fn()); assert.ok(++count < 12); } while (dirty); return result; };
  render();
  return { props, storage, writes, win, doc, render, get: () => result,
    signal: (value = 'suggest') => { result.onSuggestion(value); render(); },
    button: (text: string) => { const tree = module.QualitySuggestion({ onLower: result.lower, onDismiss: result.dismiss }); const buttons = tree.props.children[1].props.children; buttons.find((node: any) => node.props.children === text || node.props['aria-label'] === text).props.onClick(); render(); },
    advance: (ms: number) => { now += ms; for (const [id, timer] of timers) if (timer.at <= now) { timers.delete(id); timer.fn(); } render(); },
    remount: () => { effectCleanups.forEach(fn => fn?.()); slots.length = effectDeps.length = effectCleanups.length = 0; render(); },
  };
}
test('only the actual lower button writes the original quality setter, once', () => {
  const h = hintModule(); h.signal(); assert.equal(h.get().visible, true); assert.deepEqual(h.writes, []);
  const staleLower = h.get().lower; h.button('降低画质'); staleLower();
  assert.deepEqual(h.writes, [true]); assert.equal(h.get().visible, false);
  h.remount(); h.signal(); assert.equal(h.get().visible, false); assert.deepEqual(h.writes, [true]);
});
test('decline, close, ignore and interruption preserve high quality and never reappear', () => {
  for (const action of ['保持高画质', '关闭画质建议', 'timeout', 'blocked', 'unavailable', 'blur', 'resize', 'visibilitychange']) {
    const h = hintModule(); h.signal();
    if (action === 'timeout') h.advance(12_000);
    else if (action === 'blocked') { h.props.blocked = true; h.render(); h.props.blocked = false; h.render(); }
    else if (action === 'unavailable') h.signal(action);
    else if (action === 'visibilitychange') { h.doc.emit(action); h.render(); }
    else if (action === 'blur' || action === 'resize') { h.win.emit(action); h.render(); }
    else h.button(action);
    h.signal(); assert.equal(h.get().visible, false, action); assert.deepEqual(h.writes, [], action);
    h.remount(); h.signal(); assert.equal(h.get().visible, false, `${action}: next race`);
    const reload = hintModule(h.storage); reload.signal(); assert.equal(reload.get().visible, false, `${action}: reload`);
  }
});
test('critical UI defers a new hint; economy/reduced/fallback never applies a quality write', () => {
  const h = hintModule(); h.props.blocked = true; h.render(); h.signal(); assert.equal(h.get().visible, false); assert.equal(h.storage.size, 0);
  h.props.blocked = false; h.render(); assert.equal(h.get().visible, true);
  h.props.enabled = false; h.render(); h.get().lower(); assert.equal(h.get().visible, false); assert.deepEqual(h.writes, []);
  const disabled = hintModule(); disabled.props.enabled = false; disabled.render(); disabled.signal(); assert.equal(disabled.get().visible, false); assert.equal(disabled.storage.size, 0);
  const pending = hintModule(); pending.props.blocked = true; pending.render(); pending.signal(); pending.signal('unavailable'); pending.props.blocked = false; pending.render(); assert.equal(pending.get().visible, false);
});
test('storage denial still prevents repeats across rounds; shallow/hidden screens are not covered by a hint', () => {
  const denied = hintModule(new Map(), true); denied.signal(); denied.button('关闭画质建议'); denied.remount(); denied.signal(); assert.equal(denied.get().visible, false);
  const shallow = hintModule(); shallow.win.innerHeight = 390; shallow.win.visualViewport.height = 390; shallow.signal(); assert.equal(shallow.get().visible, false);
  const keyboard = hintModule(); keyboard.win.visualViewport.height = 390; keyboard.signal(); assert.equal(keyboard.get().visible, false);
  const visible = hintModule(); visible.signal(); visible.win.visualViewport.emit('resize'); visible.render(); assert.equal(visible.get().visible, false); assert.deepEqual(visible.writes, []);
  const hidden = hintModule(); hidden.doc.visibilityState = 'hidden'; hidden.signal(); assert.equal(hidden.get().visible, false);
});
test('wiring keeps explicit settings, original adaptive-demand fix, reduced motion and fallback guards', () => {
  const app = readFileSync('src/client/App.tsx', 'utf8'), board = readFileSync('src/client/scene/Board3D.tsx', 'utf8'), css = readFileSync('src/client/quality-suggestion.css', 'utf8');
  assert.ok(app.includes('onQualitySuggestion={qualitySuggestion.onSuggestion}'));
  assert.ok(app.includes("setting('low-quality', false)")); assert.ok(app.includes("localStorage.setItem('magical-athlete:low-quality', String(lowQuality))"));
  assert.ok(board.includes('<AdaptiveQuality lowQuality={lowQuality} root={root} />'));
  assert.ok(board.includes('enabled={!lowQuality && !reducedMotion && !paused && !sceneFailed && !lost'));
  assert.ok(!css.includes('position:fixed')); assert.ok(!css.includes('position:absolute'));
});
