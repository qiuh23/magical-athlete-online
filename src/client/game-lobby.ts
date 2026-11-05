import { currentBackendId, type BackendId } from './backends.js';

// Canonical lobby destinations match lobby/config.json. Navigation never
// carries a room, token, current query or a destination supplied by an invite.
export function gameLobbyURL(backend: BackendId = currentBackendId() ?? 'cloudflare', chooseServer = false): string {
  const url = backend === 'aliyun'
    ? 'https://magical-athlete-online.cn/'
    : 'https://magical-athlete.qiuh23.workers.dev/lobby/';
  return url + (chooseServer ? '#choices' : '');
}
