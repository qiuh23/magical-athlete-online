// Original lobby art. All land, roads, ports and buildings share this hex grid.
// This never imports or modifies the Catan game's 3D board.
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const size = 44;
const round = value => Math.round(value * 1e6) / 1e6;
const key = point => point.map(round).join(',');
const number = value => Number(value.toFixed(2));
const xy = point => point.map(number).join(' ');
const project = ([x,y], z = 0) => [320 + x, 168 + y * .68 - z];
const palette = { wood:'#719b7b', brick:'#cd9270', sheep:'#b2c98b', wheat:'#e1c36c', ore:'#a5b7b4', desert:'#e4cc99' };
const resources = ['ore','sheep','wood','wheat','wood','brick','wheat','brick','sheep','desert','ore','wood','wheat','sheep','brick','sheep','ore','wood','wheat'];
const rolls = [10,2,9,12,6,4,10,9,11,null,8,5,6,3,8,4,3,5,11];

export function catanGeometry() {
  const tiles = [];
  for (let r = -2; r <= 2; r++) for (let q = -2; q <= 2; q++) {
    if (Math.abs(q + r) > 2) continue;
    const center = [Math.sqrt(3) * size * (q + r/2), 1.5 * size * r];
    const vertices = Array.from({ length:6 }, (_,i) => {
      const angle = (60 * i - 30) * Math.PI / 180;
      return [round(center[0] + size * Math.cos(angle)), round(center[1] + size * Math.sin(angle))];
    });
    tiles.push({ q,r,center,vertices,resource:resources[tiles.length],roll:rolls[tiles.length] });
  }
  const edges = new Map();
  for (const tile of tiles) for (let i = 0; i < 6; i++) {
    const a = tile.vertices[i], b = tile.vertices[(i+1)%6];
    const id = [key(a),key(b)].sort().join('|');
    const edge = edges.get(id);
    if (edge) edge.count++;
    else edges.set(id, { a,b,count:1,id });
  }
  const boundary = [...edges.values()].filter(edge => edge.count === 1);
  const outline = [boundary[0].a];
  let next = boundary[0].b;
  while (key(next) !== key(outline[0])) {
    const previous = outline.at(-1);
    outline.push(next);
    const edge = boundary.find(edge => (key(edge.a) === key(next) && key(edge.b) !== key(previous)) || (key(edge.b) === key(next) && key(edge.a) !== key(previous)));
    if (!edge || outline.length > boundary.length) throw Error('Island boundary must close');
    next = key(edge.a) === key(next) ? edge.b : edge.a;
  }
  const tile = (q,r) => tiles.find(tile => tile.q === q && tile.r === r);
  const road = (q,r,i,color) => ({ a:tile(q,r).vertices[i], b:tile(q,r).vertices[(i+1)%6], color });
  const roads = [road(-1,1,2,'red'),road(-1,1,3,'red'),road(-1,1,4,'red'),road(-1,1,5,'red'),road(1,0,0,'blue'),road(1,0,1,'blue'),road(1,0,2,'blue')];
  const buildings = [{ anchor:tile(-1,1).vertices[3],color:'red' },{ anchor:tile(-1,1).vertices[0],color:'red' },{ anchor:tile(1,0).vertices[1],color:'blue' }];
  const ports = [boundary[3],boundary[12],boundary[22]].map(edge => {
    const midpoint = edge.a.map((value,i) => (value + edge.b[i])/2);
    const length = Math.hypot(...midpoint);
    return { edge, midpoint, outer:midpoint.map(value => value + value/length * 43) };
  });
  return { tiles,edges:[...edges.values()],outline,roads,buildings,ports };
}

function house([x,y], color) {
  const colors = color === 'red' ? ['#c9654d','#9b4439','#f3a078','#783c35'] : ['#4e808e','#315d70','#91bdc4','#2d4e5e'];
  const p = (dx,dy,z) => xy(project([x+dx,y+dy],z));
  return `<g data-building="${color}" data-anchor="${xy([x,y])}">
    <ellipse cx="${number(project([x,y])[0])}" cy="${number(project([x,y])[1]+3)}" rx="17" ry="7" fill="#304c35" opacity=".16"/>
    <path d="M${p(-10,-8,0)} ${p(10,-8,0)} ${p(10,8,0)} ${p(-10,8,0)}Z" fill="${colors[3]}"/>
    <path d="M${p(-10,8,0)} ${p(10,8,0)} ${p(10,8,17)} ${p(0,8,28)} ${p(-10,8,17)}Z" fill="${colors[0]}"/>
    <path d="M${p(10,8,0)} ${p(10,-8,0)} ${p(10,-8,17)} ${p(10,8,17)}Z" fill="${colors[1]}"/>
    <path d="M${p(-13,10,17)} ${p(0,10,31)} ${p(0,-10,31)} ${p(-13,-10,17)}Z" fill="${colors[2]}"/>
    <path d="M${p(0,10,31)} ${p(13,10,17)} ${p(13,-10,17)} ${p(0,-10,31)}Z" fill="${colors[3]}"/>
    <path d="M${p(-2,8,0)} ${p(4,8,0)} ${p(4,8,10)} ${p(-2,8,10)}Z" fill="${colors[3]}"/>
  </g>`;
}

export function renderCatan() {
  const { tiles,outline,roads,buildings,ports } = catanGeometry();
  const border = outline.map(xy).join(' ');
  const land = `<g transform="translate(320 168) scale(1 .68)">
    <polygon points="${border}" fill="#a78c5b" stroke="#a78c5b" stroke-width="22" stroke-linejoin="round" transform="translate(0 13)"/>
    <polygon points="${border}" fill="#f3ddb0" stroke="#f3ddb0" stroke-width="22" stroke-linejoin="round"/>
    ${tiles.map(tile => `<g data-resource="${tile.resource}" data-hex="${tile.q},${tile.r}"><polygon points="${tile.vertices.map(xy).join(' ')}" fill="${palette[tile.resource]}" stroke="#f6e8c6" stroke-width="2.4" stroke-linejoin="round"/><use href="#${tile.resource}" transform="translate(${xy([tile.center[0],tile.center[1]-10])})"/>${tile.roll ? `<g transform="translate(${xy([tile.center[0],tile.center[1]+20])})"><circle r="12" fill="#fff2d4" stroke="#a18658" stroke-width="1"/><text y="5" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="17" fill="${[6,8].includes(tile.roll)?'#a34230':'#4a4937'}">${tile.roll}</text></g>` : ''}</g>`).join('\n')}
    ${ports.map(({midpoint,outer}) => `<g data-port="3:1"><path d="M${xy(midpoint)} ${xy(outer)}" stroke="#597e75" stroke-width="12"/><path d="M${xy(midpoint)} ${xy(outer)}" stroke="#e5c591" stroke-width="8"/><g transform="translate(${xy(outer)})"><circle r="19" fill="#f7e6bf" stroke="#8c9e86" stroke-width="1.8"/><text y="5" font-family="Georgia,serif" font-weight="bold" font-size="16" text-anchor="middle" fill="#3a6056">3:1</text></g></g>`).join('\n')}
    ${roads.map(({a,b,color})=>`<g data-road="${color}" data-start="${xy(a)}" data-end="${xy(b)}"><path d="M${xy(a)} ${xy(b)}" stroke="${color==='red'?'#743e32':'#2c5668'}" stroke-width="9" stroke-linecap="round"/><path d="M${xy(a)} ${xy(b)}" stroke="${color==='red'?'#db805c':'#72a9b7'}" stroke-width="5" stroke-linecap="round"/></g>`).join('\n')}
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" fill="none">
<title>卡坦岛：六角小岛上的建造与交易</title>
<desc>同一六角网格与投影中的十九块地形：森林木材、红砖丘陵、羊群牧场、金色麦田、灰色矿山。数字牌位于各地块内，道路贴合边线，房屋落在交点，三个码头标有三比一。原创大厅插图，不是游戏内地图。</desc>
<defs>
  <linearGradient id="sea" x2="640" y2="360" gradientUnits="userSpaceOnUse"><stop stop-color="#d2e9e3"/><stop offset="1" stop-color="#92beb4"/></linearGradient>
  <g id="wood"><path d="M-10 3V18M9 0v19" stroke="#675f3c" stroke-width="4"/><path d="M-27 7-10-24 7 7Z" fill="#365e46"/><path d="M-7 10 10-19 27 10Z" fill="#477655"/><path d="M-23 0-10-24 3 0Z" fill="#518466"/></g>
  <g id="brick" stroke="#a45941" stroke-width="1.4" stroke-linejoin="round"><path d="M-24 4h25v13h-25Z" fill="#f2be8e"/><path d="M3 4h23v13H3Z" fill="#d88a61"/><path d="M-13-11h26V2h-26Z" fill="#edaa7d"/><path d="m-13-11 8-7h26l-8 7Z" fill="#f5c49a"/><path d="m13-11 8-7v13l-8 7Z" fill="#ae6046"/></g>
  <g id="sheep"><path d="M-13 9v10M0 11v8M13 6v12" stroke="#5b6b4c" stroke-width="3.5" stroke-linecap="round"/><path d="M-22 0c-4-8 3-16 11-13 3-10 17-9 20-2 11-4 18 5 13 12 4 10-6 17-13 13-8 6-17 1-18-3-10 4-19-1-17-7Z" fill="#fff6db"/><ellipse cx="18" cy="1" rx="8" ry="10" fill="#5e7050"/><path d="m15-6-5-4m14 4 5-3" stroke="#5e7050" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="-1" r="1.3" fill="#fff8dd"/></g>
  <g id="wheat" stroke="#8b6c2e" stroke-width="1.8" stroke-linecap="round"><path d="M-15 19V-13M0 18v-35M15 19V-13"/><g fill="#f9e5a0" stroke="#bd913d" stroke-width=".8"><path d="M0-21C-10-13-8-7 0-7 8-7 10-13 0-21Zm-2 16C-16-13-17-3-2 2Zm4 0C16-13 17-3 2 2ZM-2 6C-16-2-17 8-2 13Zm4 0C16-2 17 8 2 13ZM-15-17c-8 6-6 11 0 11 6 0 8-5 0-11Zm-2 13c-12-7-13 2 0 6Zm4 0c12-7 13 2 0 6Zm28-13c-8 6-6 11 0 11 6 0 8-5 0-11ZM13-4C1-11 0-2 13 2Zm4 0c12-7 13 2 0 6Z"/></g></g>
  <g id="ore" stroke="#657f7c" stroke-width="1" stroke-linejoin="round"><path d="m-28 13 14-28 15 28Z" fill="#6e8784"/><path d="m-8 14 16-37 22 37Z" fill="#e0e3d5"/><path d="M8-23 8 14h22Z" fill="#899d99"/><path d="m-14-15 4 9h-9Z" fill="#b6c9bc"/><path d="m-14 14 8-10 11 10Z" fill="#526f6c"/></g>
  <g id="desert"><path d="M-28 13Q-13-5 5 7T30 10M-19-4Q-4-16 17-6" stroke="#be9d62" stroke-width="3" stroke-linecap="round"/></g>
</defs>
<path fill="url(#sea)" d="M0 0h640v360H0z"/>
<circle cx="562" cy="48" r="94" fill="#edf3dc" opacity=".35"/>
<g stroke="#edf8ed" stroke-width="2" stroke-linecap="round" opacity=".72"><path d="M24 120q22-9 44 0m468-8q28-10 55 0M30 251q25-10 50 0m448-18q25-10 50 0M222 323q27-8 54 0m94-2q24-8 48 0"/></g>
<ellipse cx="326" cy="242" rx="211" ry="63" fill="#426c60" opacity=".16"/>
${land}
${buildings.sort((a,b)=>a.anchor[1]-b.anchor[1]).map(building=>house(building.anchor,building.color)).join('\n')}
<g transform="translate(532 285) rotate(10)"><ellipse cy="18" rx="32" ry="10" fill="#426c60" opacity=".16"/><rect x="-25" y="-26" width="50" height="44" rx="9" fill="#c5cfb1"/><rect x="-25" y="-30" width="50" height="42" rx="9" fill="#fff4d8" stroke="#96a68c"/><g fill="#42695b"><circle cx="-12" cy="-18" r="3.6"/><circle cy="-9" r="3.6"/><circle cx="12" r="3.6"/></g></g>
<g transform="translate(91 275) rotate(-13)"><rect x="-24" y="-26" width="43" height="56" rx="5" fill="#e6c27f" stroke="#a58f5c"/><rect x="-15" y="-32" width="43" height="56" rx="5" fill="#f4e9c9" stroke="#8aa184"/><path d="M-10 16V-24h33v40Z" fill="#80a280"/><use href="#wood" transform="translate(6 -4) scale(.5)"/></g>
</svg>\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await writeFile(new URL('../lobby/art/catan.svg', import.meta.url), renderCatan());
  console.log('Wrote original lobby/art/catan.svg from one shared hex grid.');
}
