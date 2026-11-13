import { Box3, BoxGeometry, BufferGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Vector3, type Material } from 'three';
import type { TrackId } from '../../../shared/tracks.js';
import { environmentTrees, environmentVenueOffset, furnitureAnchors, gatePlacements, isNaturalMap, venuePlacements, type EnvironmentOptions } from './layout.js';

export type EnvironmentModels = Record<string, Group>;
export type EnvironmentTree = { name: string; box: Box3; matrix: Matrix4 };
export type EnvironmentTreeBatch = { mesh: InstancedMesh; entries: EnvironmentTree[] };
export type EnvironmentGeometry = { root: Group; trees: EnvironmentTree[]; batches: EnvironmentTreeBatch[]; signs: {mesh:Mesh<PlaneGeometry,MeshBasicMaterial>;finish:boolean}[]; dispose: () => void };
const noRaycast = () => {};

/** Weld split normal/material vertices, then select rigid connected components. */
export function geometryIslands(geometry: BufferGeometry) {
  const p = geometry.getAttribute('position'), parent = Array.from({ length: p.count }, (_, i) => i), weld = new Map<string, number>();
  const find = (i: number): number => { while (parent[i] !== i) { parent[i] = parent[parent[i]!]!; i = parent[i]!; } return i; };
  const join = (a: number, b: number) => { parent[find(a)] = find(b); };
  for (let i = 0; i < p.count; i++) {
    const key = [p.getX(i), p.getY(i), p.getZ(i)].map(v => Math.round(v * 1e5)).join(',');
    const match = weld.get(key); if (match === undefined) weld.set(key, i); else join(i, match);
  }
  const index = geometry.index;
  for (let i = 0; i < (index?.count ?? p.count); i += 3) {
    const a = index?.getX(i) ?? i; join(a, index?.getX(i + 1) ?? i + 1); join(a, index?.getX(i + 2) ?? i + 2);
  }
  const groups = new Map<number, number[]>();
  for (let i = 0; i < p.count; i++) { const key = find(i); if (!groups.has(key)) groups.set(key, []); groups.get(key)!.push(i); }
  return [...groups.values()];
}

/** Only ground contours grow. Each furniture/plant component translates as one
 * rigid piece; choosing a pocket independently for every vertex tears objects. */
export function remapEnvironmentGeometry(mesh: Mesh, track: TrackId, part: 'base' | 'landscape' | 'furniture', scale: number) {
  const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld), p = geometry.getAttribute('position'), v = new Vector3();
  if (part === 'base') geometry.scale(scale, 1, scale);
  else {
    const anchors = furnitureAnchors(track);
    for (const island of geometryIslands(geometry)) {
      const box = new Box3(); for (const index of island) box.expandByPoint(v.fromBufferAttribute(p, index));
      const center = box.getCenter(new Vector3()), size = box.getSize(new Vector3());
      const terrain = part === 'landscape' && size.y < .125 && Math.max(size.x, size.z) > .8;
      const anchor = part === 'furniture' && anchors.length
        ? anchors.reduce((a, b) => center.distanceToSquared(a) < center.distanceToSquared(b) ? a : b) : center;
      for (const index of island) {
        v.fromBufferAttribute(p, index);
        p.setXYZ(index, terrain ? v.x * scale : v.x + anchor.x * (scale - 1), v.y, terrain ? v.z * scale : v.z + anchor.z * (scale - 1));
      }
    }
  }
  geometry.translate(0, .7, 0); p.needsUpdate = true; geometry.computeBoundingBox(); geometry.computeBoundingSphere(); return geometry;
}

/** Exact same concrete entities feed rendering and offline scene audits. None
 * are exempt from collision review because they are decorative or camera-hidden. */
export function buildEnvironmentGeometry(track: TrackId, models: EnvironmentModels, options: EnvironmentOptions): EnvironmentGeometry {
  const root = new Group(); root.name = `rebuilt-environment:${track}`;
  const geometries: BufferGeometry[] = [], materials: Material[] = [], batches: EnvironmentTreeBatch[] = [], trees: EnvironmentTree[] = [], signs:EnvironmentGeometry['signs']=[];
  const source = (name: string) => { const model = models[name]; if (!model) throw Error(`Missing environment asset ${name}`); model.updateMatrixWorld(true); return model; };
  const mark = <T extends Mesh>(mesh: T, role: string): T => { mesh.raycast = noRaycast; mesh.castShadow = !options.lowQuality && role === 'facility'; mesh.receiveShadow = true; mesh.userData.environmentRole = role; return mesh; };
  const add = (name: string, matrix: Matrix4) => {
    const group = new Group(); group.name = name; group.matrixAutoUpdate = false; group.matrix.copy(matrix);
    source(name).traverse(node => {
      if (!(node instanceof Mesh)) return;
      const recolor = (material:Material) => {
        if (!options.reversed || !name.endsWith('_gate') || !(material instanceof MeshStandardMaterial) || !/^(mint|coral)(\.|$)/.test(material.name)) return material;
        const owned=material.clone();owned.color.set(material.name.startsWith('mint')?'#ee785e':'#438674');materials.push(owned);return owned;
      };
      const material=Array.isArray(node.material)?node.material.map(recolor):recolor(node.material);
      const copy = mark(new Mesh(node.geometry, material), 'facility'); copy.name = `${name}:${node.name}`; copy.matrixAutoUpdate = false; copy.matrix.copy(node.matrixWorld); group.add(copy);
    });
    root.add(group);
  };
  const box = new BoxGeometry(1, 1, 1), stone = new MeshStandardMaterial({ color: '#526b64', roughness: .9 }); geometries.push(box); materials.push(stone);
  const support = (name: string, p: number[], dimensions: number[]) => { const mesh = mark(new Mesh(box, stone), 'facility'); mesh.name = name; mesh.position.fromArray(p); mesh.scale.fromArray(dimensions); root.add(mesh); };
  try {
    if (isNaturalMap(track)) {
      for (const part of ['base', 'landscape', 'furniture'] as const) {
        const name = `${track}_${part === 'landscape' ? 'landscape_reexport_v1' : part}`;
        source(name).traverse(node => { if (!(node instanceof Mesh)) return; const geometry = remapEnvironmentGeometry(node, track, part, options.scale); geometries.push(geometry); const mesh = mark(new Mesh(geometry, node.material), part === 'base' ? 'ground' : part === 'landscape' ? 'landscape' : 'facility'); mesh.name = `${name}:${node.name}`; root.add(mesh); });
      }
    } else {
      for (const p of venuePlacements(options.lift)) { const offset=environmentVenueOffset(track,p.asset); add(p.asset, new Matrix4().makeTranslation(p.position[0]! * options.scale+offset.x, p.position[1]!+offset.y, p.position[2]! * options.scale+offset.z)); }
      if (options.lift) {
        for (const [asset, x, z] of [['grandstand_rostrum', 2.4, -.05], ['official_rostrum', -11.8, -.1], ['podium_plinth', -7.7, -.1]] as const) {
          // Source support already occupies high-deck WORLD coordinates.
          source(asset).traverse(node => { if (!(node instanceof Mesh)) return; const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld); const offset=environmentVenueOffset(track,asset); geometry.translate(x * (options.scale - 1)+offset.x, offset.y, z * (options.scale - 1) + (asset === 'grandstand_rostrum' ? .27 * options.scale : 0)+offset.z); geometries.push(geometry); const mesh = mark(new Mesh(geometry, node.material), 'facility'); mesh.name = asset; root.add(mesh); });
        }
      }
      for (const [name, x, z, w, d] of [['grandstand', 2.4, .22, 5.65, 1.73], ['official', -11.8, -.1, 1.84, 1.3], ['podium', -7.7, -.1, 2.65, 1.5]] as const) {
        const offset=environmentVenueOffset(track,name); support(`${name}-${options.lift ? 'ground-contact' : 'low-plinth'}`, [x * options.scale+offset.x, (options.lift ? .145 : .192)+offset.y, z * options.scale+offset.z], [w, options.lift ? .19 : .084, d]);
      }
    }
    for (const p of gatePlacements(track, options)) {
      add(p.asset, new Matrix4().makeTranslation(...p.position));
      // The source gates have no lettering. These opaque labels cover the
      // existing cream stripes, and follow the real reversed-track semantics.
      const finish=(p.asset==='finish_gate')!==!!options.reversed, geometry=new PlaneGeometry(p.asset==='start_gate'?7.1:2.4,.34), material=new MeshBasicMaterial({color:'#ffffff',toneMapped:false});
      geometries.push(geometry);materials.push(material);
      const label=mark(new Mesh(geometry,material),'sign');label.position.set(p.position[0],p.position[1]+(p.asset==='start_gate'?2.17:2.20),p.position[2]+.141);label.name=`environment-label:${p.asset}`;root.add(label);signs.push({mesh:label,finish});
      const ground = isNaturalMap(track) ? 0 : options.lift ? .06 : .15, height = p.position[1] - ground;
      for (const side of [-1, 1]) support(`${p.asset}-foot:${side}`, [p.position[0] + side * (p.asset === 'start_gate' ? 3.6 : 1.2), ground + height / 2, p.position[2]], [.32, height, .44]);
    }
    const placements = environmentTrees(track, options);
    const shadowNames = new Set(options.lowQuality ? [] : [...placements].sort((a, b) => b.matrix.elements[14]! - a.matrix.elements[14]!).slice(0, 2).map(p => p.name));
    for (const asset of new Set(placements.map(p => p.asset))) {
      const model = source(asset), bounds = new Box3().setFromObject(model, true);
      const entries = placements.filter(p => p.asset === asset).map(p => ({ name: p.name, box: bounds.clone().applyMatrix4(p.matrix), matrix: p.matrix }));
      trees.push(...entries);
      model.traverse(node => {
        if (!(node instanceof Mesh)) return;
        for (const shadow of [false, true]) {
          const group = entries.filter(p => shadowNames.has(p.name) === shadow); if (!group.length) continue;
          const mesh = mark(new InstancedMesh(node.geometry, node.material, group.length), 'tree'); mesh.name = `${asset}:${node.name}:${shadow ? 'shadow' : 'plain'}`; mesh.castShadow = shadow; mesh.frustumCulled = false;
          const instances = group.map(p => ({ ...p, matrix: new Matrix4().multiplyMatrices(p.matrix, node.matrixWorld) }));
          instances.forEach((p, index) => mesh.setMatrixAt(index, p.matrix)); batches.push({ mesh, entries: instances }); root.add(mesh);
        }
      });
    }
    root.updateMatrixWorld(true);
  } catch (error) { batches.forEach(b => b.mesh.dispose()); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); throw error; }
  let disposed = false;
  return { root, trees, batches, signs, dispose() { if (disposed) return; disposed = true; batches.forEach(b => b.mesh.dispose()); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); } };
}

/** Repack visible instances and lower count, rather than zero-scale matrices
 * that would still submit every hidden tree's vertices to the GPU. */
export function setEnvironmentTreeVisibility(kit: EnvironmentGeometry, hidden: ReadonlySet<string>) {
  for (const { mesh, entries } of kit.batches) {
    let count = 0; for (const entry of entries) if (!hidden.has(entry.name)) mesh.setMatrixAt(count++, entry.matrix);
    mesh.count = count; mesh.instanceMatrix.needsUpdate = true;
  }
}
