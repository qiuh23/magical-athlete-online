import { FAN_V3_RULES_VERSION } from './rules-versions.js';

export type BackendId = 'cloudflare' | 'aliyun';
export const PROTOCOL_VERSION = '1';
export const BACKEND_RULES_VERSION = FAN_V3_RULES_VERSION;
export const connectivityInfo = (backendId: BackendId) => ({ ok: true as const, backendId, protocolVersion: PROTOCOL_VERSION, rulesVersion: BACKEND_RULES_VERSION });

/** Deployment quotas never evict existing rooms. Lower a quota before enabling
 * the second backend, and wait until its occupied count fits the new quota. */
export function multiplayerQuota(dual: boolean, value?: string): number {
  const maximum = dual ? 15 : 30;
  if (value === undefined || value === '') return maximum;
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 0 || limit > maximum) throw Error(`真人房配额必须为0～${maximum}。`);
  return limit;
}

export function trustedOrigins(value?: string): string[] {
  return (value ?? '').split(',').map(origin => origin.trim()).filter(Boolean).map(origin => {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) throw Error('来源白名单必须是完整 HTTP(S) origin。');
    return origin;
  });
}
