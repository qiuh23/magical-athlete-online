import { useCallback, useEffect, useRef, useState } from 'react';
import { backendEntryUrl, currentBackendId, getBackend, getBackends, loadBackends, parseRoomCode, probeBackends, readBackendPreference, saveBackendPreference, spectatorInvite, temporaryHttpPage, type BackendId, type BackendStatus } from './backends.js';
import './backend-selector.css';
import { gameLobbyURL } from './game-lobby.js';

export const backendLabel = (id?: BackendId) => id === 'aliyun' ? '阿里云内地' : 'Cloudflare';
const statusLabels = { checking: '检测中', available: '可用', entry: '切换入口', unavailable: '暂不可用', undeployed: '未部署' } as const;

/** Probe once on entry and on explicit retry. A manual choice survives later results. */
export function useBackendSelection(code = '') {
  const [statuses, setStatuses] = useState<BackendStatus[]>(() => getBackends().map(backend => ({ backend, state: backend.enabled ? 'checking' : 'undeployed' })));
  const [selected, setSelected] = useState<BackendId | null>(null);
  const [checking, setChecking] = useState(true);
  const manual = useRef(false), generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setChecking(true);
    try {
      const backends = await loadBackends(true);
      if (current !== generation.current) return;
      const target = parseRoomCode(code)?.backendId;
      const entry = target ? backendEntryUrl(getBackend(target),code,undefined,spectatorInvite()) : null;
      if (entry) { location.replace(entry); return; }
      setStatuses(backends.map(backend => {
        const entryUrl = backendEntryUrl(backend);
        return { backend, state: !backend.enabled ? 'undeployed' : entryUrl ? 'entry' : 'checking', ...(entryUrl ? {entryUrl} : {}) };
      }));
      // The current entry wins over a preference saved before a previous switch.
      if (!manual.current) setSelected(currentBackendId() ?? null);
      const next = await probeBackends();
      if (current !== generation.current) return;
      setStatuses(next);
      if (!manual.current) {
        const preference = readBackendPreference();
        setSelected(currentBackendId() ?? next.find(status => status.backend.id === preference && status.state === 'available')?.backend.id
          ?? next.find(status => status.backend.id === 'cloudflare' && status.state === 'available')?.backend.id
          ?? next.find(status => status.state === 'available')?.backend.id ?? null);
      }
    } catch {
      if (current === generation.current) setStatuses(getBackends().map(backend => ({ backend, state: backend.enabled ? 'unavailable' : 'undeployed', error: backend.enabled ? '连接失败' : undefined })));
    } finally { if (current === generation.current) setChecking(false); }
  }, [code]);
  useEffect(() => { void refresh(); return () => { generation.current++; }; }, [refresh]);
  const choose = (id: BackendId) => {
    const status = statuses.find(status => status.backend.id === id);
    if (!status || !['available','entry'].includes(status.state)) return;
    const entry = backendEntryUrl(status.backend);
    if (entry) { location.assign(entry); return; }
    manual.current = true; setSelected(id); saveBackendPreference(id);
  };
  return { statuses, selected, checking, refresh, choose, available: statuses.some(status => status.backend.id === selected && status.state === 'available') };
}

export function BackendSelector({ statuses, selected, checking, onRefresh, disabled = false }: {
  statuses: BackendStatus[]; selected: BackendId | null; checking: boolean; onRefresh: () => void; disabled?: boolean;
}) {
  const current = statuses.find(status => status.backend.id === selected);
  return <section className="backend-line" aria-label="连接设置">
    <p className="current-line" role="status"><span aria-hidden="true">●</span> 当前线路 · {backendLabel(selected ?? currentBackendId())}<small>{checking ? '连接检测中' : current ? statusLabels[current.state] : '连接未确认'}</small></p>
    <details className="line-settings"><summary>线路设置</summary><div className="line-settings-content">
      <p>在统一游戏大厅选择服务器；好友邀请会直接进入所属线路。</p>
      <div><button type="button" className="text-button" disabled={disabled || checking} onClick={onRefresh}>{checking ? '正在检测…' : '重新检测'}</button><a href={gameLobbyURL(selected ?? undefined, true)} aria-disabled={disabled || undefined} onClick={event => { if (disabled) event.preventDefault(); }}>切换服务器</a></div>
    </div></details>
    {temporaryHttpPage() && <p className="backend-help">临时 HTTP 连接未加密。请保留当前入口以恢复本机房间身份。</p>}
    {!checking && !statuses.some(status => status.state === 'available') && <p className="backend-failure" role="status">当前线路连接失败，请在线路设置中重新检测或前往大厅切换。</p>}
  </section>;
}
