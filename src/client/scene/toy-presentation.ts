import { LoopOnce, LoopRepeat, type AnimationAction, type AnimationClip, type AnimationMixer } from 'three';

export type ToyAnimation = 'idle' | 'move' | 'skill' | 'fall' | 'recover';
/** Optional choreography for confirmed mechanism targets. Ordinary actors keep
 * their existing local clip playback; this clock never advances game state. */
export interface ToyPresentation {
  key: string;
  clock: { now(): number };
  startedAt: number;
  durationMs: number;
  /** Locomotion must not precede the mechanism's actual route movement. */
  movementProgress?: (progress: number) => number;
  movementCycles?: number;
}
const unit = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
export function toyPresentationProgress(presentation: ToyPresentation, animation: ToyAnimation): number {
  const progress = unit((presentation.clock.now() - presentation.startedAt) / Math.max(1, presentation.durationMs));
  return animation === 'move' && presentation.movementProgress ? unit(presentation.movementProgress(progress)) : progress;
}

/** Absolute clip sampling shares the rig/pawn/FX clock, including fast mode,
 * paused asset remounts and backwards seeks. A stale LoopOnce paused flag or
 * LoopRepeat loop counter must never prevent a new confirmed beat from playing. */
export class ToyPresentationPlayback {
  private readonly action: AnimationAction;
  constructor(private readonly mixer: AnimationMixer, private readonly clip: AnimationClip, private readonly animation: ToyAnimation) {
    const loop = animation === 'idle' || animation === 'move';
    mixer.stopAllAction();
    this.action = mixer.clipAction(clip);
    this.action.reset().setLoop(loop ? LoopRepeat : LoopOnce, loop ? Infinity : 1);
    this.action.clampWhenFinished = !loop;
    this.action.setEffectiveWeight(1).setEffectiveTimeScale(1).play();
  }
  sample(presentation: ToyPresentation): number {
    const progress = toyPresentationProgress(presentation, this.animation);
    const cycles = this.animation === 'move' && Number.isFinite(presentation.movementCycles) ? Math.max(1, presentation.movementCycles!) : 1;
    const time = progress * this.clip.duration * cycles;
    // reset also clears old loop/finished state and any ordinary-path fade.
    this.action.reset();
    this.mixer.setTime(time);
    return progress;
  }
  dispose(): void { this.action.stop(); }
}
