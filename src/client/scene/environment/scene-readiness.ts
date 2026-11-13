export type SceneAssetState = 'loading' | 'ready' | 'failed';
export function sceneAssetState(key: string, status: {key: string; state: SceneAssetState}): SceneAssetState {
  return status.key === key ? status.state : 'loading';
}
/** Readiness is specific to the current track, quality and retry scope. An empty
 * Suspense fallback is not the approved padded surface used by contact evidence. */
export function rebuiltContactSceneReady(input: {
  mechanisms: boolean;
  environmentRequested: boolean;
  environment: SceneAssetState;
  pads: SceneAssetState;
  dependenciesFailed: boolean;
}): boolean {
  return input.mechanisms && input.environmentRequested && input.environment === 'ready'
    && input.pads === 'ready' && !input.dependenciesFailed;
}
