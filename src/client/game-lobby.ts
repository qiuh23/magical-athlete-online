import { IS_CN_SITE } from './site-edition.js';
import type { BackendId } from './backends.js';

// Canonical lobby destinations match lobby/config.json. Navigation never
// carries a room, token, current query or a destination supplied by an invite.
export function gameLobbyURL(_backend?: BackendId): string {
  return IS_CN_SITE
    ? 'https://magical-athlete-online.cn/'
    : 'https://magical-athlete.qiuh23.workers.dev/lobby/';
}
