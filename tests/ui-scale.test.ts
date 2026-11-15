import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const postcss = createRequire(require.resolve('vite/package.json'))('postcss');
const root = new URL('../', import.meta.url);
const files = (directory: string): string[] => readdirSync(new URL(directory, root), { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? files(join(directory, entry.name)) : entry.name.endsWith('.css') ? [join(directory, entry.name)] : []);
const sheets = files('src/client').map(file => ({ file, css: postcss.parse(readFileSync(new URL(file, root), 'utf8')) }));
const scale = new Set([11, 12, 13, 14, 16, 18, 20, 24, 32]);
const spacing = new Set([0, 4, 8, 12, 16, 24, 32]);
type Declaration = { prop: string; value: string; parent: { selector: string } };
const values = (file: string, selector: string, property: string): string[] => {
  const result: string[] = [];
  sheets.find(sheet => sheet.file === `src/client/${file}`)!.css.walkDecls(property, (d: Declaration) => {
    if (d.parent.selector === selector) result.push(d.value);
  });
  return result;
};

test('every stylesheet uses the shared text scale, including compact and shorthand text', () => {
  let checked = 0;
  for (const { file, css } of sheets) css.walkDecls((d: Declaration) => {
    const message = `${file}: ${d.parent.selector}: ${d.prop}: ${d.value}`;
    if (d.prop === 'font-size') {
      checked++;
      // The report summary replaces its original label with a readable 12px
      // pseudo label. The original accessibility text must remain in the DOM.
      if (d.value === '0') {
        assert.equal(d.parent.selector, 'html[data-race-chat-open="true"] body > .room-community.in-race .chat-report > summary');
      } else if (d.value.startsWith('clamp(')) {
        assert.match(d.parent.selector, /\.hero h1$/);
        assert.match(d.value, /^clamp\(32px, [\d.]+vw, 96px\)$/);
      } else if (d.value !== 'inherit') {
        assert.match(d.value, /^\d+px$/);
        assert.ok(scale.has(parseInt(d.value)), message);
      }
    }
    if (d.prop === 'font' && d.value !== 'inherit') {
      const match = d.value.match(/(?:^|\s)(\d+)px(?:\/|\s)/);
      assert.ok(match && scale.has(Number(match[1])), message);
      assert.doesNotMatch(d.value, /\b(?:650|750|850|900|950)\b/, message);
    }
    if (d.prop === 'font-weight') assert.ok([400, 500, 600, 700, 800].includes(Number(d.value)), message);
  });
  assert.ok(checked > 800, 'include all compact/responsive declarations, not a few examples');
});

test('display, print and reading families have one token definition; carnival aliases are retired', () => {
  const expected = new Map([
    ['--font-display', '"Arial Black", var(--ui-font)'],
    ['--font-print', 'Georgia, "Times New Roman", serif'],
    ['--font-reading', '"Noto Serif SC", "Songti SC", "STSong", "SimSun", serif'],
  ]);
  const seen = new Set<string>();
  for (const { file, css } of sheets) css.walkDecls((d: Declaration) => {
    if (expected.has(d.prop)) {
      assert.equal(file, 'src/client/ui-theme.css');
      assert.equal(d.parent.selector, ':root');
      assert.equal(d.value, expected.get(d.prop));
      assert.ok(!seen.has(d.prop)); seen.add(d.prop);
    }
    if (d.prop === 'font-family') assert.match(d.value, /^(?:inherit|var\(--(?:ui-font|font-display|font-print|font-reading)\))$/);
    assert.doesNotMatch(d.value, /var\(--(?:yellow|ink|green|pink)\)/);
    assert.doesNotMatch(d.prop, /^--(?:yellow|ink|green|pink)$/);
  });
  assert.equal(seen.size, expected.size);
});

test('radii and spacing follow the scale without changing screen-reader or control clearance geometry', () => {
  for (const { file, css } of sheets) css.walkDecls((d: Declaration) => {
    const message = `${file}: ${d.parent.selector}: ${d.prop}: ${d.value}`;
    if (/^border(?:-(?:top|bottom)-(?:left|right))?-radius$/.test(d.prop)) {
      assert.match(d.value, /^(?:(?:var\(--radius-(?:sm|md|lg)\)|0|50%|999px)(?:\s+|$))+$/, message);
    }
    if (/^(?:padding|margin)(?:-[\w-]+)?$|^(?:row-|column-)?gap$/.test(d.prop)) {
      if (d.parent.selector === '.sr-only') {
        if (d.prop === 'margin') assert.equal(d.value, '-1px');
        return;
      }
      assert.doesNotMatch(d.value, /[\d.]rem\b/, message);
      for (const number of d.value.matchAll(/(-?\d+(?:\.\d+)?)px/g)) assert.ok(spacing.has(Math.abs(Number(number[1]))), message);
    }
  });
  assert.deepEqual(values('ui-theme.css', 'html[data-race-chat-open="true"] body > .room-community.in-race .room-chat header', 'padding-right'), ['calc(var(--ui-touch-size) + 16px)']);
  assert.deepEqual(values('styles.css', '.practice-pool', 'padding-bottom'), ['calc(var(--ui-touch-size) + 16px)']);
});

test('motion uses the three durations and one easing; reduced motion zeroes tokens', () => {
  for (const { file, css } of sheets) css.walkDecls((d: Declaration) => {
    if (/^(?:animation|transition)(?:-duration|-delay)?$/.test(d.prop)) {
      assert.doesNotMatch(d.value, /(?:^|[^\w-])\d*\.?\d+(?:ms|s)\b/, file);
      assert.doesNotMatch(d.value, /\bease(?:-in-out|-in|-out)?\b/);
      if (d.value !== 'none') {
        assert.match(d.value, /var\(--duration-[123]\)/);
        if (d.prop === 'animation' || d.prop === 'transition') assert.match(d.value, /cubic-bezier\(\.2,\.7,\.3,1\)/);
        else assert.match(d.value, /^var\(--duration-[123]\)$/);
      }
    }
  });
  const theme = sheets.find(sheet => sheet.file.endsWith('/ui-theme.css'))!.css;
  const reduced: string[] = [];
  theme.walkAtRules('media', (rule: { params: string; walkDecls: (callback: (d: Declaration) => void) => void }) => {
    if (rule.params === '(prefers-reduced-motion: reduce)') rule.walkDecls(d => { assert.equal(d.value, '0ms'); reduced.push(d.prop); });
  });
  assert.deepEqual(reduced.sort(), ['--duration-1', '--duration-2', '--duration-3']);
  for (const token of reduced) assert.deepEqual(values('ui-theme.css', 'html[data-motion="reduce"]', token), ['0ms']);
});

test('semantic layers keep controls below menus, results below toasts, and local art contained', () => {
  for (const { file, css } of sheets) css.walkDecls('z-index', (d: Declaration) => {
    assert.match(d.value, /^var\(--z-(?:base|sticky|dock|banner|menu|modal|toast)\)$/, file);
  });
  assert.deepEqual(values('choice-dock.css', '.immersive-race .floating-choice.race-choice-dock', 'z-index'), ['var(--z-dock)']);
  assert.deepEqual(values('ui-theme.css', '.immersive-race .race-menu-panel', 'z-index'), ['var(--z-menu)']);
  assert.deepEqual(values('immersive.css', '.race-results-overlay', 'z-index'), ['var(--z-modal)']);
  assert.deepEqual(values('styles.css', '.toast', 'z-index'), ['var(--z-toast)']);
  assert.deepEqual(values('styles.css', '.hero-art', 'isolation'), ['isolate']);
  assert.deepEqual(values('styles.css', '.hero-orbit', 'z-index'), ['var(--z-base)']);
});

test('larger compact labels can wrap and their fixed containers still fit', () => {
  assert.deepEqual(values('character-cards.css', '.card-print-line', 'flex-wrap'), ['wrap']);
  assert.deepEqual(values('character-cards.css', '.card-print-line', 'white-space'), ['normal']);
  assert.deepEqual(values('character-cards.css', '.card-print-line>span', 'min-width'), ['0']);
  assert.ok(values('portal-guide.css', '.portal-sign', 'min-height').every(value => value === '32px'));
  assert.deepEqual(values('portal-guide.css', '.portal-sign', 'height'), ['auto']);
  assert.deepEqual(values('scene/scene.css', '.pawn-seat', 'line-height'), ['1']);
  assert.deepEqual(values('scene/scene.css', '.pawn-seat.is-crowded', 'font-size'), ['11px', '11px']);
});
