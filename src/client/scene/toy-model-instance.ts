import { Bone, Group, Mesh, SkinnedMesh, type Object3D } from 'three';
import {rigidShapeEnvelopes} from './mechanisms/rigid-shape-envelopes.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

/** The GLTF cache stays in its authored bind pose; only animated instances own
 * skeletons. A stopped mixer alone would still run vertex skinning on the GPU. */
export function cloneToyModel(source: Object3D, motionEnabled: boolean): Object3D {
  if (motionEnabled) return cloneSkeleton(source);
  const instance = source instanceof SkinnedMesh
    ? new Mesh().copy(source, false)
    : source instanceof Bone ? new Group().copy(source, false) : source.clone(false);
  // Prepare shared rigid clearance envelopes when the GLB becomes ready,
  // before an event asks for a frozen world-space snapshot.
  if (instance instanceof Mesh) rigidShapeEnvelopes(instance.geometry);
  // Keep the complete hierarchy and its local transforms, including any mesh
  // parented below a joint, but omit Skeleton/Bone machinery in the static copy.
  for (const child of source.children) instance.add(cloneToyModel(child, false));
  return instance;
}
