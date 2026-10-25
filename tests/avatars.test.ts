import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Avatar, AVATAR_IDS } from '../src/client/avatars.js';
import { CHARACTERS } from '../src/shared/characters.js';
import { SECOND_WIND_CHARACTERS } from '../src/shared/second-wind.js';
import { FAN_CHARACTERS } from '../src/shared/fan-expansions.js';
import { WURSTII_CHARACTERS } from '../src/shared/wurstii.js';

function definitionIds(svg: string): string[] {
  return [...svg.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]!);
}

function assertSelfContained(svg: string, label: string) {
  const ids = definitionIds(svg);
  assert.equal(new Set(ids).size, ids.length, `${label}: duplicate SVG IDs`);
  assert.doesNotMatch(svg, /<(?:img|image|script|foreignObject)\b/i, `${label}: vector artwork only`);
  const references = [
    ...[...svg.matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g)].map(match => match[1]!),
    ...[...svg.matchAll(/\s(?:xlink:)?href="([^"]+)"/g)].map(match => match[1]!),
  ];
  for (const reference of references) {
    assert.ok(reference.startsWith('#'), `${label}: external SVG reference ${reference}`);
    assert.ok(ids.includes(reference.slice(1)), `${label}: unresolved SVG reference ${reference}`);
  }
  assert.ok(Buffer.byteLength(svg) < 9_000, `${label}: compact portrait byte budget`);
}

// React's useId is intentionally different when the same portrait occurs twice.
// Canonicalize only IDs and their fragment references, leaving the drawing intact.
function normalizeIds(svg: string): string {
  const ids = new Map(definitionIds(svg).map((id, index) => [id, `definition-${index}`]));
  return svg
    .replace(/\sid="([^"]+)"/g, (_, id: string) => ` id="${ids.get(id)}"`)
    .replace(/url\(#([^)]*)\)/g, (_, id: string) => `url(#${ids.get(id) ?? id})`)
    .replace(/(\s(?:xlink:)?href=")#([^"]+)"/g, (_, attribute: string, id: string) => `${attribute}#${ids.get(id) ?? id}"`);
}

function drawingMarkup(svg: string): string {
  const opening = /<g\b[^>]*\bdata-portrait-drawing="[^"]*"[^>]*>/.exec(svg);
  assert.ok(opening, 'the character artwork has a separate drawing group');
  const start = opening.index + opening[0].length;
  const groups = /<g\b[^>]*>|<\/g>/g;
  groups.lastIndex = start;
  let depth = 1;
  for (let group = groups.exec(svg); group; group = groups.exec(svg)) {
    depth += group[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return svg.slice(start, group.index);
  }
  assert.fail('the character drawing group must be closed');
}

test('all playable racers have distinct vector drawings without raster or model dependencies', () => {
  assert.equal(AVATAR_IDS.length, CHARACTERS.length);
  assert.deepEqual([...AVATAR_IDS].sort(), CHARACTERS.map(character => character.id).sort());
  const drawings = new Set<string>();
  for (const character of CHARACTERS) {
    const svg = renderToStaticMarkup(createElement(Avatar, {id: character.id}));
    assert.match(svg, /^<svg /);
    assert.match(svg, /viewBox="0 0 120 120"/);
    assertSelfContained(svg, character.id);
    const drawing = normalizeIds(drawingMarkup(svg));
    const shapes = drawing.match(/<(?:path|circle|ellipse|rect|polygon|polyline|line)\b[^>]*>/g) ?? [];
    assert.ok(shapes.length >= 6, `${character.id}: authored character details`);
    // Ignore color and IDs so recoloring one silhouette cannot count as a new racer.
    drawings.add(shapes.map(shape => shape.replace(/\s(?:fill|stroke|stroke-width|opacity|fill-opacity|stroke-opacity)="[^"]*"/g, '')).join(''));
  }
  assert.equal(drawings.size, CHARACTERS.length, 'every character has its own silhouette and accessories');
});

test('multiple instances of every racer have independent SVG definitions', () => {
  const markup = renderToStaticMarkup(createElement('div', null,
    CHARACTERS.flatMap(character => [0, 1].map(copy => createElement(Avatar, {id: character.id, key: `${character.id}-${copy}`}))),
  ));
  const portraits = markup.match(/<svg\b[\s\S]*?<\/svg>/g) ?? [];
  assert.equal(portraits.length, CHARACTERS.length * 2);
  const ids = definitionIds(markup);
  assert.ok(ids.length > 0, 'shading definitions are present');
  assert.equal(new Set(ids).size, ids.length, 'portraits cannot reuse another instance\'s gradient or clip IDs');
  for (let index = 0; index < portraits.length; index += 2) {
    assertSelfContained(portraits[index]!, `portrait ${index}`);
    assertSelfContained(portraits[index + 1]!, `portrait ${index + 1}`);
    assert.equal(normalizeIds(portraits[index]!), normalizeIds(portraits[index + 1]!), 'repeated racers render the same artwork');
  }
});

test('published SVG portraits are standalone and match the live drawings and model registry', async () => {
  for (const [pack, characters] of [
    ['second-wind', SECOND_WIND_CHARACTERS],
    ['extra-mile', FAN_CHARACTERS.filter(character => character.edition === 'extra-mile')],
    ['leaf', FAN_CHARACTERS.filter(character => character.edition === 'leaf')],
    ['wurstii', WURSTII_CHARACTERS],
  ] as const) {
    const manifest = JSON.parse(await readFile(new URL(`../public/models/${pack}/manifest.json`, import.meta.url), 'utf8'));
    for (const character of characters) {
      const svg = await readFile(new URL(`../public/avatars/${pack}/${character.id}.svg`, import.meta.url), 'utf8');
      assert.match(svg, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
      assertSelfContained(svg, `${pack}/${character.id}`);
      const live = renderToStaticMarkup(createElement(Avatar, {id: character.id}));
      const published = svg.trim().replace(/^<svg\b[^>]*>/, opening => opening.replace(/\s(?:xmlns|width|height)="[^"]*"/g, ''));
      assert.equal(normalizeIds(published), normalizeIds(live), `${character.id}: exported artwork matches live rendering`);
      const model = manifest.models.find((value: {id: string}) => value.id === character.id);
      assert.equal(model?.avatar, `/avatars/${pack}/${character.id}.svg`);
      assert.equal(model?.avatarStyle, 'flat-cartoon-svg');
    }
  }
});
