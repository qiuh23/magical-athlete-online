import { gameInfo, validateConfig, readInvitation, entryURL, currentLobby, lobbyURL, savePreference } from './routing.mjs';

const labels = { aliyun: '国内服务器（阿里云）', cloudflare: 'Cloudflare' };
const status = document.querySelector('#status');
const radios = [...document.querySelectorAll('input[name="server"]')];
const links = [...document.querySelectorAll('[data-game]')];
let config, invitation, current;
let storage;
try { storage = globalThis.localStorage; } catch { /* Browsing without storage still works. */ }

function render() {
  for (const radio of radios) {
    radio.checked = radio.value === (invitation?.server ?? current);
    radio.disabled = Boolean(invitation) || !config.lobbies[radio.value].enabled;
    const caption = document.querySelector(`[data-server-status="${radio.value}"]`);
    if (caption) caption.textContent = !config.lobbies[radio.value].enabled ? '暂未开放 · HTTPS 待验收' : radio.value === current ? '当前大厅 · 已开放' : '切换网址，前往此大厅';
  }
  document.querySelector('#current-server').textContent = labels[current];
  let message = current === 'cloudflare' ? `当前位于 Cloudflare 大厅。${config.lobbies.aliyun.enabled ? '切换服务器会前往对应大厅网址。' : '国内 HTTPS 暂未开放。'}` : '当前位于国内大厅。';
  if (!config.lobbies[current].enabled) message = '国内 HTTPS 暂未开放。可主动选择 Cloudflare 前往其大厅；旧入口中的对局请从原链接恢复。';
  if (invitation && !lobbyURL(config, invitation.server, invitation)) message = `${labels[invitation.server]}邀请暂不可进入：${invitation.server === 'aliyun' ? '国内 HTTPS 或游戏入口暂未开放' : '该游戏入口暂未开放'}。不会跨服查找房间，请保留原始邀请。`;
  const description = document.querySelector('#server-message') ?? status;
  description.textContent = message;
  if (description !== status) status.textContent = '';
  for (const link of links) {
    const game = link.dataset.game;
    // Every game link belongs to this page's server. A cross-server invitation
    // first moves the whole page to its matching lobby below.
    const href = entryURL(config, game, current, invitation);
    const gameName = gameInfo[game].name;
    if (href) {
      link.href = href;
      link.removeAttribute('aria-disabled');
      const action = invitation ? invitation.watch ? '进入观战 →' : '进入邀请房间 →' : '进入游戏 →';
      link.querySelector('.action').textContent = action;
      link.setAttribute('aria-label', `${gameName}，${action.replace(' →', '')}`);
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.querySelector('.action').textContent = invitation && invitation.game !== game ? '邀请属于另一款游戏' : game === 'catan' ? '未上线 · 敬请期待' : '暂未开放';
      link.setAttribute('aria-label', `${gameName}，暂不可进入`);
    }
  }
}

for (const radio of radios) radio.addEventListener('change', () => {
  if (invitation || !config || radio.value === current) return;
  const target = lobbyURL(config, radio.value);
  if (!target) { render(); return; }
  savePreference(storage, radio.value);
  location.assign(target);
});
document.querySelector('#clear-invite').addEventListener('click', () => {
  invitation = null;
  history.replaceState(null, '', location.pathname);
  document.querySelector('#invitation').hidden = true;
  render();
});

try {
  invitation = readInvitation(location.search);
  const response = await fetch(new URL('./config.json', import.meta.url), { cache: 'no-store', credentials: 'same-origin', redirect: 'error', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw Error('暂时无法读取游戏入口，请刷新重试。');
  config = validateConfig(await response.json());
  current = currentLobby(config, location.href);
  if (!current) throw Error('当前网址不在受信大厅配置中，请使用正式大厅入口。');
  if (invitation && invitation.server !== current) {
    const target = lobbyURL(config, invitation.server, invitation);
    if (target) {
      if (new URLSearchParams(location.search).get('lobbyHop') === '1') throw Error('两个大厅的入口配置不一致，已停止自动跳转。请保留原始邀请并联系维护者。');
      // The destination recognizes its own origin, so storage cannot bounce it
      // back. The public hop marker also stops mismatched deployment configs.
      location.replace(target);
    }
  }
  if (invitation) {
    document.querySelector('#invitation').hidden = false;
    document.querySelector('#invite-details').textContent = `${gameInfo[invitation.game].name} · ${labels[invitation.server]} · ${invitation.server === 'aliyun' ? 'A' : 'C'}-${invitation.room} · ${invitation.watch ? '观战' : '加入房间'}`;
  }
  render();
  document.querySelector('#choices').removeAttribute('aria-busy');
} catch (error) {
  status.textContent = error instanceof Error ? error.message : '游戏入口暂不可用，请刷新重试。';
  status.setAttribute('role', 'alert');
  for (const radio of radios) radio.disabled = true;
}
