import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const app = readFileSync(new URL('../src/client/App.tsx', import.meta.url), 'utf8');
const homeCss = readFileSync(new URL('../src/client/home-entry.css', import.meta.url), 'utf8');
const parsed = ts.createSourceFile('App.tsx', app, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
type Element = { type: string; props: Record<string, any>; children: any[] };
// Execute the real local component functions without importing WebGL, CSS or
// starting the network. Hook state is deterministic; network boundaries are spies.
function component(name: string, globals: Record<string, any>) {
  const declaration = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name)!;
  const source = ts.transpileModule(declaration.getText(parsed), { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function(...Object.keys(globals), `${source}; return ${name};`)(...Object.values(globals));
}
function nodes(value: any): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object' || !value.props) return [];
  return [value, ...nodes(value.children)];
}
function harness(options: { cn?: boolean; code?: string; name?: string; saved?: any; enter?: (code: string | null, args: any) => Promise<any> } = {}) {
  let cursor = 0;
  const values: any[] = [], effects: Array<() => any> = [], deps: any[][] = [];
  const calls: any[] = [], resumed: any[] = [], entered: any[] = [], focused: string[] = [], navigated: string[] = [];
  const state = (initial: any) => { const index = cursor++; if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial; return [values[index], (next: any) => { values[index] = typeof next === 'function' ? next(values[index]) : next; }]; };
  const globals: Record<string, any> = {
    React: { createElement(type: string, props: any, ...children: any[]) { return { type, props: props ?? {}, children }; } }, Fragment: 'fragment',
    useState: state, useRef(initial: any) { return state({ current: initial })[0]; },
    useEffect(effect: () => any, next: any[]) { const index = cursor++; if (!deps[index] || next.some((v, i) => v !== deps[index][i])) { deps[index] = next; effects.push(effect); } },
    readPendingCreation: () => null,
    useBackendSelection: () => ({ selected: 'cloudflare', checking: false, available: true, statuses: [{ backend: { id: 'cloudflare', enabled: true }, state: 'available' }] }),
    IS_CN_SITE: options.cn ?? false, SITE_BACKEND_ID: 'cloudflare', FOREIGN_INVITATION_ERROR: 'foreign invitation',
    randomNickname: () => ({ id: 'n1', name: '固定昵称' }),
    localStorage: { getItem: () => options.name ?? 'Tester', setItem() {}, removeItem() {} },
    legacyRoomConfig: (pool: string) => ({ pool }), presetCompetition: () => ({ preset: 'original' }), spectatorInvite: () => false,
    document: { getElementById: (id: string) => ({ focus() { focused.push(id); } }), querySelector: () => ({ focus() { focused.push('name'); } }) },
    location: { assign: (url: string) => navigated.push(url) },
    parseRoomCode: (code: string) => /^[CA]-[A-Z0-9]{6}$/.test(code) ? { backendId: code.startsWith('C') ? 'cloudflare' : 'aliyun' } : null,
    uniqueSavedIdentity: () => null, readIdentity: () => options.saved ?? null, backendEntryUrl: () => null, getBackend: () => ({}), backendLabel: () => '本站',
    legacyPoolForConfig: (config: any) => config.pool, randomId: () => 'request-id', roomConfigError: () => null, matchRaceCount: () => 4,
    enterRoom: async (code: string | null, args: any) => { calls.push({ code, args }); return options.enter ? options.enter(code, args) : { identity: {}, room: {} }; },
    characters: [],
  };
  for (const name of ['RoomDirectory', 'Icon', 'Avatar', 'BackendSelector', 'Button', 'RoomConfigFields', 'OwnedRoomReturn']) globals[name] = name;
  const Home = component('Home', globals);
  const props = { code: options.code ?? '', onBackend() {}, onBusy() {}, onEnter(value: any) { entered.push(value); }, onResume(value: any) { resumed.push(value); }, onHome() { props.code = ''; }, onDetail() {} };
  let tree: Element;
  function render() { cursor = 0; tree = Home(props); effects.splice(0).forEach(effect => effect()); return tree; }
  function find(predicate: (node: Element) => boolean) { return nodes(tree).find(predicate)!; }
  function byId(id: string) { return find(node => node.props.id === id); }
  function click(id: string) { byId(id).props.onClick(); render(); }
  render();
  return { render, find, byId, click, calls, resumed, entered, focused, navigated, props, get tree() { return tree; } };
}

test('home shows the ordered action list and directory before the retained return section', () => {
  const h = harness();
  const actions = h.find(n => n.props.className === 'entry-action-list');
  assert.deepEqual(nodes(actions).filter(n => n.type === 'button').map(n => n.props['aria-label']), ['创建房间', '加入房间', '单人练习', '人机对战']);
  assert.equal(actions.props.role, 'group');
  assert.ok(nodes(actions).filter(n => n.type === 'button').every(n => n.props.tabIndex === undefined && !n.props['aria-expanded']));
  const direct = h.tree.children.flat().filter((n: any) => n?.type);
  assert.equal(direct[0].props.className, 'hero');
  assert.ok(direct.findIndex((n: any) => n.type === 'RoomDirectory') > direct.findIndex((n: any) => n.props.className?.startsWith('entry-panel')));
  assert.ok(direct.findIndex((n: any) => n.type === 'OwnedRoomReturn') > direct.findIndex((n: any) => n.type === 'RoomDirectory'));
});

test('join unfolds between Join and Practice, toggles closed, and retains the entered code', () => {
  const h = harness(); h.click('join-tab');
  assert.equal(h.find(n => n.props.className === 'entry-panel')?.type, 'section', 'inline join keeps the home hero/layout instead of entering the configuration screen');
  const list = nodes(h.find(n => n.props.className === 'entry-action-list'));
  assert.ok(list.findIndex(n => n.props.id === 'join-tab') < list.findIndex(n => n.props.id === 'entry-content'));
  assert.ok(list.findIndex(n => n.props.id === 'entry-content') < list.findIndex(n => n.props.id === 'practice-tab'));
  assert.equal(h.byId('join-tab').props['aria-expanded'], true);
  h.find(n => n.props.name === 'roomCode').props.onChange({ target: { value: 'c-ab1234' } }); h.render();
  h.click('join-tab'); assert.equal(h.byId('entry-content'), undefined); assert.equal(h.focused.at(-1), 'join-tab');
  h.click('join-tab'); assert.equal(h.find(n => n.props.name === 'roomCode').props.value, 'C-AB1234');
  assert.deepEqual(h.navigated, []); assert.deepEqual(h.calls, []);
});

test('practice title and create settings survive switching and closing the entry form', () => {
  const h = harness(); h.click('create-tab');
  const config = h.find(n => n.type === 'RoomConfigFields'); config.props.onChange({ pool: 'original', visibility: 'private' }); h.render();
  h.click('practice-tab');
  assert.match(JSON.stringify(h.byId('entry-content')), /自己练习/);
  h.click('create-tab'); assert.equal(h.find(n => n.type === 'RoomConfigFields').props.config.visibility, 'private');
  h.find(n => n.props.className === 'text-button setup-back').props.onClick(); h.render();
  assert.equal(h.byId('entry-content'), undefined); assert.equal(h.focused.at(-1), 'create-tab');
});

test('directory Join from Create performs a join, never accidental room creation', async () => {
  const h = harness();
  h.find(n => n.type === 'RoomDirectory').props.onJoin('C-AB1234', 'player'); await Promise.resolve(); h.render();
  assert.equal(h.calls.length, 1); assert.equal(h.calls[0].code, 'C-AB1234'); assert.equal(h.calls[0].args.role, 'player');
  assert.equal(h.calls[0].args.mode, 'multiplayer'); assert.equal(h.byId('join-tab').props['aria-expanded'], true);
});

test('directory spectating from Practice uses multiplayer join and preserves existing identity resume', async () => {
  const h = harness(); h.click('practice-tab');
  h.find(n => n.type === 'RoomDirectory').props.onJoin('C-AB1234', 'spectator'); await Promise.resolve();
  assert.equal(h.calls[0].code, 'C-AB1234'); assert.equal(h.calls[0].args.role, 'spectator'); assert.equal(h.calls[0].args.mode, 'multiplayer');
  const saved = { roomCode: 'AB1234', playerId: 'existing' }; const returning = harness({ saved });
  returning.find(n => n.type === 'RoomDirectory').props.onJoin('C-AB1234', 'player');
  assert.deepEqual(returning.resumed, [saved]); assert.equal(returning.calls.length, 0);
});

test('missing nickname and foreign-site directory requests do not join or create rooms', () => {
  for (const [options, code] of [[{ name: '' }, 'C-AB1234'], [{}, 'A-AB1234']] as const) {
    const h = harness(options); h.find(n => n.type === 'RoomDirectory').props.onJoin(code, 'player'); h.render();
    assert.equal(h.calls.length, 0); assert.equal(h.navigated.length, 0);
    assert.ok(h.find(n => n.props.className === 'form-error'));
  }
  const cn = harness({ cn: true, name: '' }); cn.find(n => n.type === 'RoomDirectory').props.onJoin('C-AB1234', 'player');
  assert.equal(cn.calls[0].args.name, '固定昵称'); assert.equal(cn.calls[0].args.nicknameId, 'n1');
});

test('direct invitations open inline and Back returns home without joining', () => {
  const h = harness({ code: 'C-AB1234' });
  assert.equal(h.byId('join-tab').props['aria-expanded'], true);
  assert.equal(h.find(n => n.props.name === 'roomCode').props.value, 'C-AB1234');
  h.find(n => n.props.className === 'text-button setup-back').props.onClick(); h.render();
  assert.equal(h.props.code, ''); assert.equal(h.byId('entry-content'), undefined); assert.equal(h.calls.length, 0);
});

test('in-flight joining disables modes, directory and submit and rejects repeated invocation', async () => {
  let finish!: (value: any) => void;
  const h = harness({ enter: () => new Promise(resolve => { finish = resolve; }) });
  h.find(n => n.type === 'RoomDirectory').props.onJoin('C-AB1234', 'player'); h.render();
  assert.equal(h.byId('create-tab').props.disabled, true);
  assert.equal(h.find(n => n.type === 'RoomDirectory').props.busy, true);
  assert.equal(h.find(n => n.type === 'Button' && n.props.type === 'submit').props.disabled, true);
  h.byId('entry-form').props.onSubmit({ preventDefault() {} }); assert.equal(h.calls.length, 1);
  finish({ identity: {}, room: {} }); await new Promise(resolve => setImmediate(resolve)); h.render();
  assert.equal(h.byId('create-tab').props.disabled, false); assert.equal(h.entered.length, 1);
});

test('the rules dialog keeps backdrop, close button, Escape and focus restoration', () => {
  const handlers = new Map<string, (event: any) => void>(); const effects: Array<() => any> = [];
  let closed = 0, restored = 0;
  const document = { activeElement: { focus() { restored++; } }, body: { style: { overflow: 'auto' } }, addEventListener(name: string, handler: any) { handlers.set(name, handler); }, removeEventListener(name: string) { handlers.delete(name); } };
  const Modal = component('Modal', { React: { createElement(type: string, props: any, ...children: any[]) { return { type, props: props ?? {}, children }; } }, Icon: 'Icon', useRef: (current: any) => ({ current }), useEffect: (effect: () => any) => effects.push(effect), document });
  const tree = Modal({ title: '玩法规则', onClose() { closed++; }, children: 'unchanged rules' });
  const cleanup = effects[0]();
  tree.props.onClick(); nodes(tree).find(n => n.props.className === 'close-button')!.props.onClick(); handlers.get('keydown')!({ key: 'Escape' });
  assert.equal(closed, 3);
  let stopped = false; nodes(tree).find(n => n.props.role === 'dialog')!.props.onClick({ stopPropagation() { stopped = true; } }); assert.equal(stopped, true);
  cleanup(); assert.equal(document.body.style.overflow, 'auto'); assert.equal(restored, 1); assert.equal(handlers.size, 0);
});

test('copy and layout contracts keep create as the only primary action and preserve rules text', () => {
  assert.match(homeCss, /\.home \.entry-action-list \.entry-tabs \{ display: flex; flex-direction: column; \}/);
  assert.match(homeCss, /\.home:has\(\.entry-action-list\):not\(:has\(\.entry-panel\.configuring\)\) > \.owned-room-return \{ grid-row: auto; \}/);
  assert.match(homeCss, /\.home #create-tab \{ background: var\(--ui-text\); color: var\(--paper\);/);
  assert.doesNotMatch(homeCss, /aria-selected/);
  assert.match(homeCss, /\.home \.entry-tabs > button\[aria-expanded="true"\] \{ border-color: var\(--ui-text\); \}/);
  assert.match(app, /aria-label="玩法规则" title="玩法规则"/);
  assert.match(app, /'暂无公开房间'/);
  const bar = app.slice(app.indexOf('<div className="room-bar">'), app.indexOf('<RoomPauseNotice'));
  assert.ok(bar.indexOf('title="复制房间码"') < bar.indexOf('>邀请朋友'));
  assert.ok(bar.indexOf('>邀请朋友') < bar.indexOf("'退出房间'"));
  const lobby = app.slice(app.indexOf('function Lobby('), app.indexOf('function CharacterCard('));
  assert.match(lobby, /onClick=\{start\}><Icon kind="flag" \/>开始游戏/);
  assert.match(lobby, /copy\(invite, '邀请链接'\).*?邀请朋友/);
  const rules = readFileSync(new URL('../src/client/RulesContent.tsx', import.meta.url), 'utf8');
  assert.match(rules, /<h3>自己练习与人机对战<\/h3>/);
});

test('home layout overrides survive the later visual-first and ui-theme cascade', () => {
  const theme = readFileSync(new URL('../src/client/ui-theme.css', import.meta.url), 'utf8');
  const visual = readFileSync(new URL('../src/client/visual-first.css', import.meta.url), 'utf8');
  const rooms = readFileSync(new URL('../src/client/room-experience.css', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../src/client/main.tsx', import.meta.url), 'utf8');
  assert.ok(main.indexOf("'./ui-theme.css'") > main.indexOf("'./home-entry.css'"));
  // Keep the legacy grid declarations under test: flex must win the display
  // cascade so their higher-specificity column declarations cannot split a row.
  assert.match(theme, /\.home:not\(:has\(\.entry-panel.configuring\)\) \.entry-tabs \{ grid-template-columns: repeat\(2,/);
  assert.match(rooms, /\.home \.entry-panel.configuring \.entry-tabs\{grid-template-columns:repeat\(4,/);
  assert.match(homeCss, /\.home \.entry-action-list \.entry-tabs \{ display: flex; flex-direction: column; \}/);
  for (const sheet of [theme, visual, rooms]) {
    for (const rule of sheet.matchAll(/([^{}]+)\{([^{}]+)\}/g)) {
      if (/\.entry-tabs(?![\w-])\s*$/.test(rule[1].trim())) assert.doesNotMatch(rule[2], /\bdisplay\s*:/, 'later entry grid rules must not reset flex display');
    }
  }
  assert.match(theme, /\.home:not\(:has\(\.entry-panel.configuring\)\) > \.owned-room-return \{ grid-row: 5; \}/);
  assert.match(homeCss, /\.home:has\(\.entry-action-list\):not\(:has\(\.entry-panel.configuring\)\) > \.owned-room-return \{ grid-row: auto; \}/);
});
