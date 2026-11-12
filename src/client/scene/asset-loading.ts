import { DefaultLoadingManager } from 'three';
import { assetUrl } from '../assets/asset-url.js';

// Initialize with the lazy scene, not the entry bundle: keep Three out of the
// initial lobby load. Applies to every useGLTF/Three request in the scene.
DefaultLoadingManager.setURLModifier(assetUrl);
