export interface DeploymentInfo { target: 'preview' | 'production'; commit: string; runId: number; prNumber?: number }

export function parseDeploymentInfo(value: unknown): DeploymentInfo | null {
  const info=value as Partial<DeploymentInfo> | null;
  if(!info || !['preview','production'].includes(String(info.target)) || !/^[a-f0-9]{40}$/.test(String(info.commit)) || !Number.isSafeInteger(info.runId) || info.runId!<1) return null;
  if(info.target==='preview' && (!Number.isSafeInteger(info.prNumber) || info.prNumber!<1)) return null;
  return {target:info.target!,commit:info.commit!,runId:info.runId!,...(info.target==='preview'?{prNumber:info.prNumber}:{} )};
}
