import { useCallback, useEffect, useRef, useState } from 'react';
import { getBackends, loadBackends, probeBackends, readBackendPreference, saveBackendPreference, temporaryHttpPage, type BackendId, type BackendStatus } from './backends.js';
import './backend-selector.css';

export const backendLabel = (id?: BackendId) => id === 'aliyun' ? '阿里云内地' : 'Cloudflare';
const statusLabels = { checking: '检测中', available: '可用', unavailable: '暂不可用', undeployed: '未部署' } as const;

/** Probe once on entry and on explicit retry. A manual choice survives later results. */
export function useBackendSelection() {
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
      setStatuses(backends.map(backend => ({ backend, state: backend.enabled ? 'checking' : 'undeployed' })));
      const next = await probeBackends();
      if (current !== generation.current) return;
      setStatuses(next);
      if (!manual.current) {
        const preference = readBackendPreference();
        setSelected(next.find(status => status.backend.id === preference && status.state === 'available')?.backend.id
          ?? next.find(status => status.backend.id === 'cloudflare' && status.state === 'available')?.backend.id
          ?? next.find(status => status.state === 'available')?.backend.id ?? null);
      }
    } catch {
      if (current === generation.current) setStatuses(getBackends().map(backend => ({ backend, state: backend.enabled ? 'unavailable' : 'undeployed', error: backend.enabled ? '连接失败' : undefined })));
    } finally { if (current === generation.current) setChecking(false); }
  }, []);
  useEffect(() => { void refresh(); return () => { generation.current++; }; }, [refresh]);
  const choose = (id: BackendId) => {
    if (!statuses.some(status => status.backend.id === id && status.state === 'available')) return;
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
      {statuses.map(status => <div className="backend-choice" key={status.backend.id}><button type="button" role="radio" aria-checked={selected === status.backend.id} aria-label={backendLabel(status.backend.id)} className={`backend-option state-${status.state}`} disabled={disabled || status.state !== 'available'} onClick={() => onSelect(status.backend.id)}>
        <span className="backend-name"><strong>{backendLabel(status.backend.id)}</strong><span className="backend-status">{statusLabels[status.state]}</span></span>
        <span className="backend-detail">{status.state === 'available' && status.latencyMs !== undefined ? `连接延迟 ${Math.round(status.latencyMs)} ms` : status.state === 'checking' ? '正在检测 API 与实时连接' : status.state === 'undeployed' ? '尚未部署或开放' : status.error || '连接失败'}</span>
        {selected === status.backend.id && <span className="backend-selected">已选择</span>}
      </button>{status.entryUrl && <a className="backend-entry-link" href={status.entryUrl}>打开{backendLabel(status.backend.id)}临时 HTTP 入口</a>}</div>)}
    </div>
    <p className="backend-help">加入者也需要能够连接所选服务器；有国内玩家时建议选择阿里云内地。</p>
    {temporaryHttpPage() && <p className="backend-help">临时 HTTP 连接未加密。请保留当前入口以恢复本机房间身份。</p>}
    {!checking && !statuses.some(status => status.state === 'available') && <p className="backend-failure" role="status">当前没有可用服务器，暂时无法在线建房。请稍后重新检测。</p>}
  </section>;
}
