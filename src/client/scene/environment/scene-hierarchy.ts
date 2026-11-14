import {Color,MeshStandardMaterial,type Material} from 'three';
import type {TrackId} from '../../../shared/tracks.js';
/** Sparse identity landmarks, not a prop in every pocket. Same on every quality tier. */
export const VENUE_TREE_SELECTION:Record<TrackId,readonly number[]>={
 mild:[0,5],wild:[0,5],'twisty-twirl':[0,5],'whirly-world':[0,5],
 squiggle:[0,3,8,12],boardwalks:[0,4,8],bridges:[0,6,12,19,26],
};
/** Flat terrain/water retains the venue silhouette; remove repeated miniature
 * flowers, reeds, pebbles and ripple strokes that competed with route symbols. */
export function isQuietLandscapeMesh(name:string){return !/coral_vinyl|ochre_vinyl|reed_leaf|stone|silver_ripples/.test(name);}
/** Clone before recoloring: GLTF cache assets are shared with other scenes. */
export function mutedVenueMaterial(source:Material){
 const owned=source.clone();
 if(owned instanceof MeshStandardMaterial){
  owned.color.lerp(new Color('#7d897d'),.38).multiplyScalar(.84);
  owned.roughness=Math.max(.86,owned.roughness);owned.metalness=Math.min(.12,owned.metalness);
 }
 return owned;
}
