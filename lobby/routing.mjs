export const gameInfo = Object.freeze({
  athlete: { name: '胡闹运动会', room: /^[A-Z2-9]{6}$/, watch: true },
  wizard: { name: '巫师牌', room: /^[A-Z2-9]{8}$/, watch: true },
  catan: { name: '卡坦岛好友桌', room: /^[A-HJ-NP-Z2-9]{6}$/, watch: false },
});
export const games = Object.keys(gameInfo);
export const servers = ['aliyun', 'cloudflare'];
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

/** The same-origin deployment file is the only source of navigation origins. */
export function validateConfig(value) {
  if(value?.version !== 2 || !['cn','global'].includes(value.siteEdition))throw Error('大厅站点配置无效。');
  const server=value.siteEdition==='cn'?'aliyun':'cloudflare';
  if(Object.keys(value.lobbies??{}).join()!==server)throw Error('大厅配置必须仅包含本站。');
  const lobby=value.lobbies[server];
  const url=new URL(lobby?.url);
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!['/','/lobby/'].includes(url.pathname)||lobby.enabled!==true)throw Error('大厅网址配置无效。');
  if(Object.keys(value.entries??{}).length!==games.length)throw Error('游戏入口配置不完整。');
  for(const game of games){
    if(Object.keys(value.entries[game]??{}).join()!==server)throw Error('游戏入口必须仅包含本站。');
    const entry=value.entries[game][server], origin=new URL(entry?.origin);
    if(origin.protocol!=='https:'||origin.origin!==entry.origin||origin.username||origin.password||entry.enabled!==true)throw Error('游戏入口配置无效。');
  }
  const origins=games.map(game=>value.entries[game][server].origin);if(new Set(origins).size!==games.length)throw Error('每个游戏必须使用独立入口。');
  return value;
}

/** The page owns the server. A preference must never relabel this deployment. */
export function currentLobby(config, href) {
  const page = new URL(href);
  const path = page.pathname.endsWith('/') ? page.pathname : page.pathname + '/';
  for (const server of Object.keys(config.lobbies)) {
    const lobby = new URL(config.lobbies[server].url);
    if (page.origin === lobby.origin && path === lobby.pathname) return server;
  }
  // Local static previews keep both layouts testable without real DNS/TLS.
  if (['localhost', '127.0.0.1', '[::1]'].includes(page.hostname)) return Object.keys(config.lobbies)[0];
  return null;
}

export function lobbyURL(config, server, invitation = null) {
  if (!servers.includes(server) || !config.lobbies[server]?.enabled || (invitation && invitation.server !== server)) return null;
  const url = new URL(config.lobbies[server].url);
  if (invitation) {
    // Reuse the strict room/role checks; never copy query strings or fragments.
    if (!entryURL(config, invitation.game, server, invitation)) return null;
    url.searchParams.set('game', invitation.game);
    // Server ownership is implicit in this independently built site.
    url.searchParams.set('room', `${server === 'aliyun' ? 'A' : 'C'}-${invitation.room}`);
    if (invitation.watch) url.searchParams.set('watch', '1');
    url.searchParams.set('lobbyHop', '1');
  }
  return url.href;
}

/** A room prefix outranks browser preferences. Ambiguous/malformed links fail closed. */
export function readInvitation(search) {
  const params = new URLSearchParams(search);
  if (!['game', 'server', 'room', 'watch'].some(key => params.has(key))) return null;
  if (['game', 'server', 'room', 'watch', 'lobbyHop'].some(key => params.getAll(key).length > 1)) throw Error('邀请链接包含重复参数。请使用原始游戏邀请。');
  const game = params.get('game');
  const room = params.get('room')?.toUpperCase();
  if (!games.includes(game) || !room) throw Error('邀请链接缺少游戏或房间信息。请使用原始游戏邀请。');
  const match = /^([CA])-([A-Z2-9]+)$/.exec(room);
  if (match && !gameInfo[game].room.test(match[2])) throw Error('邀请房间码无效。请使用原始游戏邀请。');
  if (!match) throw Error('邀请房间码无效。请使用包含服务器前缀的原始邀请。');
  const server = match[1] === 'A' ? 'aliyun' : 'cloudflare';
  if (params.has('server') && params.get('server') !== server) throw Error('邀请链接的服务器与房间码不一致。请使用原始游戏邀请。');
  if (params.has('watch') && !['0', '1'].includes(params.get('watch'))) throw Error('邀请链接的观战标记无效。');
  if (params.get('watch') === '1' && !gameInfo[game].watch) throw Error('卡坦岛好友桌暂不支持观战，请向朋友索取加入邀请。');
  if (params.has('lobbyHop') && params.get('lobbyHop') !== '1') throw Error('邀请链接的大厅跳转标记无效。');
  return { game, server, room: match[2], watch: params.get('watch') === '1' };
}

export function entryURL(config, game, server, invitation = null) {
  if (!games.includes(game) || !servers.includes(server)) return null;
  const entry = config.entries[game][server];
  if (!config.lobbies[server]?.enabled || !entry?.enabled || (invitation && (invitation.game !== game || invitation.server !== server))) return null;
  const url = new URL('/', entry.origin);
  if (invitation) {
    const prefix = server === 'aliyun' ? 'A' : 'C';
    if (!gameInfo[game].room.test(invitation.room) || typeof invitation.watch !== 'boolean' || (invitation.watch && !gameInfo[game].watch)) return null;
    if (game === 'athlete') {
      url.pathname = `/room/${prefix}-${invitation.room}`;
      if (invitation.watch) url.searchParams.set('spectate', '1');
    } else {
      url.searchParams.set('room', `${prefix}-${invitation.room}`);
      if (invitation.watch) url.searchParams.set('watch', '1');
    }
  }
  return url.href;
}

export function readPreference(_storage) { return null; }
export function savePreference(_storage, _server) { /* Deployment owned. */ }
