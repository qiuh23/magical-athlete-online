import { useEffect, useState } from 'react';
import { parseDeploymentInfo, type DeploymentInfo } from './deployment-info.js';
import './deployment-notice.css';

export function DeploymentNotice() {
  const [info,setInfo]=useState<DeploymentInfo|null>(null);
  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),4500);
    void fetch('/deployment.json',{cache:'no-store',signal:controller.signal}).then(async response=>{
      if(!response.ok)return;
      const next=parseDeploymentInfo(await response.json());
      if(!controller.signal.aborted && next?.target==='preview'){
        document.documentElement.dataset.previewEnvironment='true';setInfo(next);
      }
    }).catch(()=>{/* Older/manual deployments have no metadata. */}).finally(()=>clearTimeout(timer));
    return ()=>{controller.abort();clearTimeout(timer);delete document.documentElement.dataset.previewEnvironment;};
  },[]);
  return info?.target==='preview' ? <aside className="deployment-notice" aria-label="测试环境">测试环境 · PR #{info.prNumber} · 提交 {info.commit.slice(0,7)} · 房间与正式环境独立</aside> : null;
}
