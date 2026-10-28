import type { GameAction, Phase } from './types.js';

export const canPausePhase = (phase: Phase): boolean => ['draft', 'selection', 'race', 'results', 'finished'].includes(phase);
export const actionAllowedWhilePaused = (action: GameAction): boolean => ['pause', 'resume', 'transfer', 'close', 'continue-vote', 'results-seen'].includes(action.type);
