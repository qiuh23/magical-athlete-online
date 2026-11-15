import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const postcss = createRequire(require.resolve('vite/package.json'))('postcss');
const root = new URL('../', import.meta.url);
const css = (file: string) => postcss.parse(readFileSync(new URL(`src/client/${file}`, root), 'utf8'));
const sheets = readdirSync(new URL('src/client', root), { recursive: true }).filter(file => String(file).endsWith('.css')).map(file => ({ file, css: css(String(file)) }));
const rules = (file: string, selector: string) => {
  const found: Array<Record<string, string>> = [];
  css(file).walkRules((rule: { selector: string; walkDecls: (callback: (d: {prop: string; value: string}) => void) => void }) => {
    if (rule.selector !== selector) return;
    const values: Record<string, string> = {};
    rule.walkDecls(d => { values[d.prop] = d.value; });
    found.push(values);
  });
  return found;
};
const first = (file: string, selector: string) => rules(file, selector)[0]!;

test('hero keeps its fluid title, paper/yellow gradient and isolated track artwork', () => {
  assert.match(first('home-entry.css', '.home > .hero').background!, /radial-gradient.*var\(--brand-yellow\).*var\(--paper\)/);
  assert.equal(first('home-entry.css', '.home .hero h1')['font-size'], 'clamp(32px, 6.8vw, 96px)');
  assert.equal(first('styles.css', '.hero-art').isolation, 'isolate');
  const header = first('ui-theme.css', '.site-header');
  assert.equal(header.background, 'var(--paper)');
  assert.equal(header['border-bottom'], '1px solid var(--ui-border)');
});

test('cards retain isolation below the sticky confirmation at rest, hover and keyboard focus', () => {
  const card = Object.assign({}, ...rules('character-cards.css', '.character-card'));
  assert.equal(card.isolation, 'isolate');
  assert.equal(card['border-radius'], 'var(--radius-lg)');
  assert.equal(card.background, 'var(--paper)');
  assert.equal(card.border, '1px solid var(--ui-border)');
  assert.equal(card['box-shadow'], 'var(--shadow-1)');
  const selected = Object.assign({}, ...rules('character-cards.css', '.character-card.selected'));
  assert.equal(selected.outline, '2px solid var(--brand-blue)');
  assert.equal(selected['box-shadow'], 'var(--shadow-hard)');
  const hover = first('character-cards.css', '.character-card:hover');
  assert.equal(hover.transform, 'translateY(-2px)');
  assert.equal(hover['box-shadow'], 'var(--shadow-2)');
  assert.equal(first('character-cards.css', '.character-card.selected:hover')['box-shadow'], 'var(--shadow-hard)');
  const focus = first('character-cards.css', '.character-card button:focus-visible');
  assert.equal(focus.outline, '2px solid var(--ui-focus)');
  assert.equal(focus['outline-offset'], '2px');
  assert.equal(first('styles.css', '.sticky-action').position, 'sticky');
  assert.equal(first('styles.css', '.sticky-action')['z-index'], 'var(--z-sticky)');
  assert.match(first('character-cards.css', '.duo-selection .character-card button')['scroll-margin-bottom']!, /190px.*var\(--selection-action-bottom\)/);
});

test('HUD surfaces agree without coloring the complete active player strip', () => {
  for (const [file, selector] of [
    ['immersive.css', '.race-status-pill'],
    ['race-ui.css', '.immersive-race .floating-racers'],
    ['choice-dock.css', '.immersive-race .floating-choice.race-choice-dock'],
  ]) {
    const rule = first(file!, selector!);
    assert.equal(rule.background, 'var(--ui-surface)');
    assert.equal(rule['backdrop-filter'], 'blur(8px)');
    assert.equal(rule['box-shadow'], 'var(--shadow-2)');
  }
  const active = first('race-ui.css', '.immersive-race .floating-racer.is-active:before');
  assert.equal(active.width, '3px');
  assert.equal(active.background, 'var(--player-color)');
  assert.equal(first('immersive.css', '.floating-racer').background, 'transparent');
  const dock = first('choice-dock.css', '.immersive-race .floating-choice.race-choice-dock');
  assert.equal(dock.overflow, 'visible', '44px heading controls need room for the outer focus ring');
  assert.equal(first('choice-dock.css', '.immersive-race .floating-choice.race-choice-dock .choice-dock-body').overflow, 'auto');
  assert.equal(first('choice-dock.css', '.immersive-race .floating-choice.race-choice-dock.is-collapsed').height, '44px');
});

test('medals use exact metal tokens and large bold numerals across viewports', () => {
  const tokens = first('ui-theme.css', ':root');
  assert.equal(tokens['--rank-gold'], 'var(--ui-gold)');
  assert.equal(tokens['--ui-gold'], '#b57422');
  assert.equal(tokens['--rank-silver'], '#7d8a84');
  assert.equal(tokens['--rank-bronze'], '#a06a3b');
  for (const selector of ['.rank-medal', '.ranking-number']) {
    const entries = rules('styles.css', selector);
    assert.equal(entries[0]!['font-family'], 'var(--font-display)');
    assert.equal(entries[0]!['font-weight'], '700');
    assert.equal(entries[0]!.color, 'var(--ui-text-muted)');
    for (const entry of entries) if (entry['font-size']) assert.ok(parseFloat(entry['font-size']) >= 20);
  }
});

test('all game width queries share the 650, 1000 and 1280 boundaries', () => {
  let checked = 0;
  for (const {file, css: sheet} of sheets) sheet.walkAtRules('media', (rule: {params: string}) => {
    for (const match of rule.params.matchAll(/(?:width\s*[:<>]=?\s*)(\d+(?:\.\d+)?)px/g)) {
      checked++;
      assert.ok([650, 1000, 1280].includes(Number(match[1])), `${file}: ${rule.params}`);
    }
  });
  assert.ok(checked > 100);
  // These landscape rules must still include 568x320 and 844x390, without
  // replacing the old 480px floor with a 650px floor that strands small phones.
  for (const file of ['home-entry.css', 'choice-dock.css', 'race-ui.css', 'visual-first.css']) {
    const source = readFileSync(new URL(`src/client/${file}`, root), 'utf8');
    assert.match(source, /orientation:\s*landscape\) and \(max-height:\s*570px\)/);
    assert.doesNotMatch(source, /orientation:\s*landscape\) and \(min-width:/);
  }
});

test('focus rings use one color, width and offset, excluding intentionally unfocused headings', () => {
  for (const {file, css: sheet} of sheets) sheet.walkRules((rule: {selector: string; walkDecls: (callback: (d: {prop: string; value: string}) => void) => void}) => {
    if (!rule.selector.includes(':focus')) return;
    rule.walkDecls(d => {
      if (d.prop === 'outline' && d.value !== 'none' && d.value !== '0') assert.equal(d.value, '2px solid var(--ui-focus)', `${file}: ${rule.selector}`);
      if (d.prop === 'outline-offset') assert.equal(d.value, '2px');
      if (d.prop === 'outline-color') assert.equal(d.value, 'var(--ui-focus)');
    });
  });
});
