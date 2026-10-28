import { useCallback, useEffect, useRef, useState } from 'react';
import { backendEntryUrl, currentBackendId, getBackend, getBackends, loadBackends, parseRoomCode, probeBackends, readBackendPreference, saveBackendPreference, temporaryHttpPage, type BackendId, type BackendStatus } from './backends.js';
import './backend-selector.css';

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
      const entry = target ? backendEntryUrl(getBackend(target),code) : null;
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

export function BackendSelector({ statuses, selected, checking, onSelect, onRefresh, disabled = false }: {
  statuses: BackendStatus[]; selected: BackendId | null; checking: boolean; onSelect: (id: BackendId) => void; onRefresh: () => void; disabled?: boolean;
}) {
  return <section className="backend-settings" aria-label="连接设置">
    <div className="backend-heading"><div><h2>服务器</h2><p>创建房间前选择连接位置</p></div><button type="button" className="text-button" disabled={disabled || checking} onClick={onRefresh}>{checking ? '正在检测…' : '重新检测'}</button></div>
    <div className="backend-options" role="radiogroup" aria-label="服务器">
      {statuses.map(status => <div className="backend-choice" key={status.backend.id}><button type="button" role="radio" aria-checked={selected === status.backend.id} aria-label={backendLabel(status.backend.id)} className={`backend-option state-${status.state}`} disabled={disabled || !['available','entry'].includes(status.state)} onClick={() => onSelect(status.backend.id)}>
        <span className="backend-name"><strong>{backendLabel(status.backend.id)}</strong><span className="backend-status">{statusLabels[status.state]}</span></span>
        <span className="backend-detail">{status.state === 'entry' ? status.entryUrl?.startsWith('http:') ? '打开临时 HTTP 入口，连接未加密' : '点击切换网页与游戏服务器' : status.state === 'available' && status.latencyMs !== undefined ? `连接延迟 ${Math.round(status.latencyMs)} ms` : status.state === 'checking' ? '正在检测 API 与实时连接' : status.state === 'undeployed' ? '尚未部署或开放' : status.error || '连接失败'}</span>
        {selected === status.backend.id && <span className="backend-selected">已选择</span>}
      </button></div>)}
    </div>
    <p className="backend-help">选择服务器会打开对应网页入口；有国内玩家时建议选择阿里云内地。</p>
    {temporaryHttpPage() && <p className="backend-help">临时 HTTP 连接未加密。请保留当前入口以恢复本机房间身份。</p>}
    {!checking && !statuses.some(status => status.state === 'available') && <p className="backend-failure" role="status">当前入口连接失败，暂时无法在线建房。请重新检测或切换入口。</p>}
  </section>;
}
