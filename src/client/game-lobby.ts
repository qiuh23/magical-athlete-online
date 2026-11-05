import { currentBackendId, type BackendId } from './backends.js';

// Canonical lobby destinations match lobby/config.json. Navigation never
// carries a room, token, current query or a destination supplied by an invite.
export function gameLobbyURL(backend: BackendId = currentBackendId() ?? 'cloudflare'): string {
  return backend === 'aliyun'
    ? 'https://magical-athlete-online.cn/'
    : 'https://magical-athlete.qiuh23.workers.dev/lobby/';
}
