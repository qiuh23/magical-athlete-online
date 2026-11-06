import { SITE_NICKNAMES } from '../shared/site-policy.js';
export const CLIENT_SITE_EDITION: 'cn' | 'global' = import.meta.env?.VITE_SITE_EDITION === 'cn' ? 'cn' : 'global';
export const IS_CN_SITE = CLIENT_SITE_EDITION === 'cn';
export const SITE_BACKEND_ID = IS_CN_SITE ? 'aliyun' as const : 'cloudflare' as const;
export const FOREIGN_INVITATION_ERROR = '此邀请不属于当前站点，请向房主确认原始邀请链接。';
export function randomNickname() {
  const value = new Uint32Array(1); crypto.getRandomValues(value);
  return SITE_NICKNAMES[value[0]! % SITE_NICKNAMES.length]!;
}
