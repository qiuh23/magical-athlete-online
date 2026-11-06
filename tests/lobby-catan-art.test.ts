import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// @ts-ignore The dependency-free generator is also a browser-independent geometry model.
import { catanGeometry, renderCatan } from '../scripts/generate-lobby-catan.mjs';

const key = (point: number[]) => point.map(value => value.toFixed(4)).join(',');
const edgeKey = (a: number[], b: number[]) => [key(a),key(b)].sort().join('|');

test('lobby illustration uses one complete 19-hex topology for roads, intersections and coastal ports', () => {
  const { tiles,edges,outline,roads,buildings,ports } = catanGeometry();
  assert.equal(tiles.length,19);
  const vertices = new Set(tiles.flatMap((tile: any) => tile.vertices.map(key)));
  assert.equal(vertices.size,54);
  assert.equal(edges.length,72);
  assert.equal(outline.length,30);
  assert.equal(edges.filter((edge: any) => edge.count===1).length,30);
  for (const edge of edges) {
    assert.ok([1,2].includes(edge.count));
    assert.ok(Math.abs(Math.hypot(edge.a[0]-edge.b[0],edge.a[1]-edge.b[1])-44)<.001);
  }
  const actualEdges = new Set(edges.map((edge: any) => edgeKey(edge.a,edge.b)));
  for (const road of roads) assert.ok(actualEdges.has(edgeKey(road.a,road.b)), 'Road must follow a real hex edge');
  for (const building of buildings) {
    assert.ok(vertices.has(key(building.anchor)), 'Building must sit at an intersection');
    assert.ok(roads.some((road: any) => road.color===building.color && [key(road.a),key(road.b)].includes(key(building.anchor))), 'Building must touch its own road');
  }
  for (const port of ports) {
    assert.equal(port.edge.count,1,'Port must connect to a coastal edge');
    assert.deepEqual(port.midpoint, port.edge.a.map((value:number,i:number) => (value+port.edge.b[i])/2));
  }
});

test('all five resources have distinct semantic motifs, real roll labels, and the committed SVG matches its source', async () => {
  const { tiles } = catanGeometry();
  const counts: Record<string,number> = {};
  for (const tile of tiles) counts[tile.resource]=(counts[tile.resource]||0)+1;
  assert.deepEqual(counts,{ ore:3,sheep:4,wood:4,wheat:4,brick:3,desert:1 });
  assert.equal(tiles.filter((tile:any)=>tile.roll!==null).length,18);
  const svg = renderCatan();
  for (const resource of ['wood','brick','sheep','wheat','ore']) assert.ok(svg.includes(`href="#${resource}"`));
  assert.equal((await readFile(new URL('../lobby/art/catan.svg',import.meta.url),'utf8')).replace(/\r\n/g,'\n'),svg);
});
