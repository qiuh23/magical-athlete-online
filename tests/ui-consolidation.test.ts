import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

// PostCSS is already supplied by Vite. Check parsed declarations rather than
// formatting, line numbers, or hashes of the stylesheet implementation.
const require = createRequire(import.meta.url);
const postcss = createRequire(require.resolve('vite/package.json'))('postcss');
const root = new URL('../', import.meta.url);
const cssFiles = (directory: string): string[] => readdirSync(new URL(directory, root), { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? cssFiles(join(directory, entry.name)) : entry.name.endsWith('.css') ? [join(directory, entry.name)] : []);
const sheets = cssFiles('src/client').map(file => ({ file, css: postcss.parse(readFileSync(new URL(file, root), 'utf8')) }));
const theme = sheets.find(sheet => sheet.file === 'src/client/ui-theme.css')!.css;

test('each consolidated component has one stylesheet owner, including responsive and state selectors', () => {
  const owners: Array<[RegExp, string]> = [
    [/\.site-header(?![\w-])|\.modal-[\w-]+|\.button(?:-(?:secondary|danger))?(?![\w-])/, 'src/client/ui-theme.css'],
    [/\.character-card(?![\w-])/, 'src/client/character-cards.css'],
    [/\.chat-toggle(?![\w-])/, 'src/client/community.css'],
  ];
  const counts = new Map(owners.map(([, owner]) => [owner, 0]));
  for (const { file, css } of sheets) css.walkRules((rule: { selector: string }) => {
    for (const [selector, owner] of owners) if (selector.test(rule.selector)) {
      assert.equal(file, owner, `${rule.selector} must be maintained in ${owner}`);
      counts.set(owner, counts.get(owner)! + 1);
    }
  });
  for (const [owner, count] of counts) assert.ok(count > 0, `${owner} must keep its live components`);
});

test('retired DOM board and choice-panel selectors are absent while live choice observers remain', () => {
  const retired = /\.(?:track-board|track-cell|track-token|track-section|track-heading|cell-label|cell-arrow|cell-tokens|track-legend|legend-ring|special-label|special-trip|special-arrow|track-warning|choice-panel|choice-heading|choice-option|choice-character|choice-character-detail|choice-offer|choice-collapse|collapsed-choice-summary|compact-choice-options|choice-number-option|choice-number-button|choice-number-metrics|choice-number-retreat|choice-number-detail|choice-shared-cost|choice-operator|spectator-wait)(?![\w-])/;
  for (const { file, css } of sheets) css.walkRules((rule: { selector: string }) => assert.doesNotMatch(rule.selector, retired, file));
  for (const file of ['tests/browser/playback-retention.spec.ts', 'tests/browser/three-scene.spec.ts']) {
    const source = readFileSync(new URL(file, root), 'utf8');
    assert.doesNotMatch(source, /querySelector(?:All)?\('\.choice-panel'\)/);
    assert.match(source, /querySelector(?:All)?\('\[data-testid="skill-choice"\]'\)/);
  }
});

test('elevations use canonical tokens, and modal surfaces always use dialog elevation', () => {
  let checked = 0, modalSurfaces = 0;
  for (const { file, css } of sheets) css.walkDecls('box-shadow', (declaration: { value: string; parent: { selector: string } }) => {
    checked++;
    assert.match(declaration.value, /^(none|var\(--shadow-(1|2|3|hard)\))$/, `${file}: ${declaration.parent.selector}`);
    if (/^\.modal-panel(?:$|:has\(\.character-detail\)$)/.test(declaration.parent.selector)) {
      modalSurfaces++;
      assert.equal(declaration.value, 'var(--shadow-3)');
    }
    if (declaration.value === 'var(--shadow-hard)') assert.match(declaration.parent.selector, /\.button(?![\w-])|\.race-roll-button(?![\w-])|\.character-card(?![\w-])|#create-tab/);
  });
  assert.ok(checked > 50);
  assert.ok(modalSurfaces > 0);
});

test('menu density wins over the broad button baseline after component consolidation', () => {
  // Both selectors have the same specificity. A declaration inventory alone
  // misses the 12→14px regression caused by moving the baseline after density.
  let index = 0, baseline = -1, density = -1, effectiveSize = '';
  theme.walkRules((rule: { selector: string; nodes: Array<{ type: string; prop: string; value: string }> }) => {
    index++;
    if (rule.selector === '.race-menu-content :is(.race-menu-note, summary, .button, .end-room-button, label)') {
      baseline = index;
      effectiveSize = rule.nodes.find(node => node.type === 'decl' && node.prop === 'font-size')!.value;
    }
    if (rule.selector === '.race-menu-panel :is(.race-menu-note,.race-menu-footer)') {
      density = index;
      const font = rule.nodes.find(node => node.type === 'decl' && node.prop === 'font')!.value;
      effectiveSize = font.match(/\b(\d+px)\//)![1]!;
    }
  });
  assert.ok(baseline > 0 && density > baseline, 'specific menu density must follow its general baseline');
  assert.equal(effectiveSize, '12px');
});
