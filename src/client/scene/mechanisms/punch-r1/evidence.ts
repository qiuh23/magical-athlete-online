import data from './evidence.json' with {type:'json'};
import type {R1Evidence} from './controller.js';
/** Bounded actual-geometry evidence, not permission to synthesize new paths. */
export const R1_EVIDENCE=data as R1Evidence;
export const R1_SCENE_HASH=data.sceneHash;
