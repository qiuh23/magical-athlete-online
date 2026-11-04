import { validateConfig, readInvitation, entryURL, readPreference, savePreference } from './routing.mjs';

const labels = { aliyun: '国内服务器（阿里云）', cloudflare: 'Cloudflare' };
const status = document.querySelector('#status');
const radios = [...document.querySelectorAll('input[name="server"]')];
const links = [...document.querySelectorAll('[data-game]')];
let config, invitation, server;
let storage;
try { storage = globalThis.localStorage; } catch { /* Browsing without storage still works. */ }

function render() {
  for (const radio of radios) {
    radio.checked = radio.value === server;
    radio.disabled = Boolean(invitation);
  }
  document.querySelector('#current-server').textContent = labels[server];
  for (const link of links) {
    const game = link.dataset.game;
    const href = entryURL(config, game, server, invitation);
    if (href) {
      link.href = href;
      link.removeAttribute('aria-disabled');
      link.querySelector('.action').textContent = invitation ? invitation.watch ? '进入观战 →' : '进入邀请房间 →' : '进入游戏 →';
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.querySelector('.action').textContent = invitation && invitation.game !== game ? '邀请属于另一款游戏' : '国内 HTTPS 待上线';
    }
  }
}

for (const radio of radios) radio.addEventListener('change', () => {
  if (invitation || !config) return;
  server = radio.value;
  savePreference(storage, server);
  render();
});
document.querySelector('#clear-invite').addEventListener('click', () => {
  invitation = null;
  history.replaceState(null, '', location.pathname);
  document.querySelector('#invitation').hidden = true;
  server = readPreference(storage);
  render();
});

try {
  invitation = readInvitation(location.search);
  server = invitation?.server ?? readPreference(storage);
  const response = await fetch(new URL('./config.json', import.meta.url), { cache: 'no-store', credentials: 'same-origin', redirect: 'error', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw Error('暂时无法读取游戏入口，请刷新重试。');
  config = validateConfig(await response.json());
  if (invitation) {
    document.querySelector('#invitation').hidden = false;
    document.querySelector('#invite-details').textContent = `${invitation.game === 'athlete' ? '胡闹运动会' : '巫师牌'} · ${labels[server]} · ${server === 'aliyun' ? 'A' : 'C'}-${invitation.room} · ${invitation.watch ? '观战' : '加入房间'}`;
  }
  render();
  status.textContent = '';
  document.querySelector('#choices').removeAttribute('aria-busy');
} catch (error) {
  status.textContent = error instanceof Error ? error.message : '游戏入口暂不可用，请刷新重试。';
  status.setAttribute('role', 'alert');
  for (const radio of radios) radio.disabled = true;
}
