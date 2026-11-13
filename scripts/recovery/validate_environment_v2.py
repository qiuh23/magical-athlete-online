"""Independent byte-level GLB geometry, vertex color and PBR validation for v2."""
import argparse
import hashlib
import itertools
import json
import struct
from pathlib import Path

import numpy as np
from scipy.spatial import cKDTree

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / 'public/models/environment-rebuilt-v2'
DTYPE = {5120: 'i1', 5121: 'u1', 5122: '<i2', 5123: '<u2', 5125: '<u4', 5126: '<f4'}
WIDTH = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
PERM = list(itertools.permutations(range(3)))


def load_glb(path):
    raw = path.read_bytes()
    magic, version, total = struct.unpack_from('<III', raw)
    assert magic == 0x46546c67 and version == 2 and total == len(raw)
    chunks = {}
    at = 12
    while at < len(raw):
        length, kind = struct.unpack_from('<II', raw, at)
        at += 8
        chunks[kind] = raw[at:at + length]
        at += length
    doc = json.loads(chunks[0x4e4f534a])
    binary = chunks[0x004e4942]

    def accessor(index):
        a = doc['accessors'][index]
        v = doc['bufferViews'][a['bufferView']]
        assert 'sparse' not in a and v.get('buffer', 0) == 0
        dt = np.dtype(DTYPE[a['componentType']])
        width = WIDTH[a['type']]
        offset = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        stride = v.get('byteStride', dt.itemsize * width)
        values = np.ndarray((a['count'], width), dtype=dt, buffer=binary, offset=offset, strides=(stride, dt.itemsize)).copy()
        if a.get('normalized'):
            values = values.astype(float) / np.iinfo(dt).max
            if dt.kind == 'i':
                values = np.maximum(-1, values)
        return values

    triangles, colors, labels, primitives = [], [], [], []
    for node in doc.get('nodes', []):
        # Export contract is identity roots and geometry already in required space.
        assert 'matrix' not in node or np.allclose(np.asarray(node['matrix']).reshape(4, 4), np.eye(4))
        assert np.allclose(node.get('translation', [0, 0, 0]), [0, 0, 0])
        assert np.allclose(node.get('scale', [1, 1, 1]), [1, 1, 1])
        assert np.allclose(node.get('rotation', [0, 0, 0, 1]), [0, 0, 0, 1])
        if 'mesh' not in node:
            continue
        for p in doc['meshes'][node['mesh']]['primitives']:
            assert p.get('mode', 4) == 4
            position = accessor(p['attributes']['POSITION'])
            normal = accessor(p['attributes']['NORMAL'])
            assert np.isfinite(position).all() and np.isfinite(normal).all()
            assert np.max(np.abs(np.linalg.norm(normal, axis=1) - 1)) < 1e-4
            color = accessor(p['attributes']['COLOR_0']) if 'COLOR_0' in p['attributes'] else np.ones((len(position), 4))
            if color.shape[1] == 3:
                color = np.column_stack((color, np.ones(len(color))))
            idx = accessor(p['indices']).ravel() if 'indices' in p else np.arange(len(position))
            tri = position[idx.reshape(-1, 3)]
            triangles.extend(tri)
            colors.extend(color[idx.reshape(-1, 3)])
            name = doc['materials'][p['material']]['name']
            labels.extend([name] * len(tri))
            primitives.append({'material': name, 'triangles': len(tri), 'vertices': len(position),
                               'has_vertex_colors': 'COLOR_0' in p['attributes']})
    return doc, np.asarray(triangles), np.asarray(colors), np.asarray(labels), primitives


def match_geometry_and_color(a, ac, b, bc):
    _, nearest = cKDTree(b.mean(1)).query(a.mean(1), k=min(8, len(b)))
    if nearest.ndim == 1:
        nearest = nearest[:, None]
    max_geometry, max_color = 0.0, 0.0
    for start in range(0, len(a), 512):
        aa, ca = a[start:start + 512], ac[start:start + 512]
        bb, cb = b[nearest[start:start + 512]], bc[nearest[start:start + 512]]
        best_g = np.full(len(aa), np.inf)
        best_c = np.full(len(aa), np.inf)
        for perm in PERM:
            error = np.linalg.norm(aa[:, None] - bb[:, :, perm], axis=-1).max(-1)
            color_error = np.abs(ca[:, None] - cb[:, :, perm]).max((-1, -2))
            for index in range(error.shape[1]):
                improve = (error[:, index] < best_g - 1e-10) | ((np.abs(error[:, index] - best_g) < 1e-10) & (color_error[:, index] < best_c))
                best_c[improve] = color_error[:, index][improve]
                best_g[improve] = error[:, index][improve]
        max_geometry = max(max_geometry, float(best_g.max()))
        max_color = max(max_color, float(best_c.max()))
    return max_geometry, max_color


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--evidence-dir', type=Path, default=REPO.parent / 'environment-rebuilt-v2-evidence')
    args = parser.parse_args()
    manifest_path = OUT / 'asset-manifest.json'
    manifest = json.loads(manifest_path.read_text())
    reports = []
    for e in manifest['assets']:
        source_blend = REPO.parent / 'materialized-sources/extracted' / e['source']['blend_member']
        assert hashlib.sha256(source_blend.read_bytes()).hexdigest() == e['source']['blend_sha256']
        raw = (OUT / e['file']).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == e['sha256']
        assert hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest() == e['git_blob_sha1']
        doc, actual, ac, labels, primitives = load_glb(OUT / e['file'])
        expected = np.load(args.evidence_dir / (e['name'] + '.expected.npz'))
        truth, tc, tl = expected['triangles'], expected['colors'], expected['materials']
        geometry_error, color_error = 0.0, 0.0
        for name in sorted(set(labels) | set(tl)):
            a, b = labels == name, tl == name
            assert a.sum() == b.sum() and a.sum() > 0
            g, c = match_geometry_and_color(actual[a], ac[a], truth[b], tc[b])
            rg, rc = match_geometry_and_color(truth[b], tc[b], actual[a], ac[a])
            geometry_error = max(geometry_error, g, rg)
            color_error = max(color_error, c, rc)
        assert geometry_error < 2e-5, (e['name'], geometry_error)
        assert color_error < 1e-6, (e['name'], color_error)
        mats = {m['name']: m for m in doc['materials']}
        pbr_error = 0.0
        for mat in e['source_materials_or_rebuilt_materials']:
            if mat['name'] not in set(labels):
                continue
            actual_pbr = mats[mat['name']].get('pbrMetallicRoughness', {})
            for key, default in [('baseColorFactor', [1, 1, 1, 1]), ('metallicFactor', 1), ('roughnessFactor', 1)]:
                pbr_error = max(pbr_error, float(np.max(np.abs(np.asarray(actual_pbr.get(key, default)) - np.asarray(mat[key])))))
        assert pbr_error < 1e-6
        assert not doc.get('textures') and not doc.get('images')
        assert not any(b.get('uri') for b in doc.get('buffers', []))
        alpha_modes = sorted(set(m.get('alphaMode', 'OPAQUE') for m in doc['materials']))
        assert alpha_modes == ['OPAQUE']
        assert (ac[:, :, 3] == 1).all()
        bbox = [actual.reshape(-1, 3).min(0).tolist(), actual.reshape(-1, 3).max(0).tolist()]
        if e.get('tree_lod2'):
            assert len(mats) == len(primitives) == 2
            assert all(p['has_vertex_colors'] for p in primitives)
            assert len(actual) <= 0.31 * sum(t['source_triangles'] for t in e['tree_lod2'])
            # Exact palette membership, not merely approximately green foliage.
            for role in e['tree_lod2']:
                palette = np.array([p['baseColorFactor'] for p in role['source_palette']])
                values = ac[labels == role['rebuilt_material']].reshape(-1, 4)
                assert float(np.min(np.abs(values[:, None] - palette).max(-1), axis=1).max()) < 1e-6
        record = {'name': e['name'], 'pass': True, 'triangles': len(actual), 'primitives': len(primitives),
                  'materials': len(mats), 'vertices': sum(p['vertices'] for p in primitives),
                  'bounds_y_up': bbox, 'geometry_corner_error_max': geometry_error,
                  'vertex_color_error_max': color_error, 'pbr_error_max': pbr_error,
                  'alpha_modes': alpha_modes, 'vertex_alpha_range': [float(ac[:, :, 3].min()), float(ac[:, :, 3].max())],
                  'external_resources': 0, 'images': 0, 'primitive_details': primitives,
                  'source_blend_sha256_matches': True,
                  'source_bounds_delta_max': float(np.max(np.abs(np.asarray(bbox) - np.asarray(e['source_bounds_y_up']))))}
        e.update({key: record[key] for key in ('primitives', 'materials', 'vertices', 'bounds_y_up', 'alpha_modes')})
        reports.append(record)
        print(e['name'], 'PASS', len(actual), 'triangles', len(primitives), 'primitives', flush=True)
    # Revalidate layout directly against prior independently inspected source matrices.
    layout = json.loads((REPO / 'src/client/scene/environment/source-layout.json').read_text())
    meta = json.loads((REPO / 'src/client/scene/environment/source-layout.metadata.json').read_text())
    source_map = json.loads((REPO.parent / 'materialized-sources' / meta['pocket_source']['file']).read_text())
    C = np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, -1, 0, 0], [0, 0, 0, 1]])
    layout_results = []
    for track, value in layout.items():
        assert value['pockets'] == source_map['tracks'][track]['pockets']
        path = REPO.parent / 'materialized-sources/source-inspection' / (Path(meta['tracks'][track]['source']['blend_member']).stem + '.json')
        inspection = json.loads(path.read_text())
        source = {o['name']: o for o in inspection['tree_instances']}
        if meta['tracks'][track]['selected_layer'] == 'INFIELD_TREE_*':
            source = {name: item for name, item in source.items() if name.startswith('INFIELD_TREE_')}
        assert len(source) == len(value['trees'])
        err = 0.0
        for tree in value['trees']:
            err = max(err, float(np.max(np.abs(np.array(tree['matrix']) - C @ np.array(source[tree['name']]['matrix_world']) @ C.T))))
            assert tree['sourceScale'] == 1
            assert (OUT / (tree['asset'] + '.glb')).exists()
        assert err < 1e-7
        layout_results.append({'track': track, 'trees': len(value['trees']), 'pockets': len(value['pockets']),
                               'source_pockets_exact_match': True, 'source_matrix_error_max': err, 'pass': True})
    manifest['totals'] = {'assets': len(reports), 'bytes': sum(e['bytes'] for e in manifest['assets']),
                          'triangles': sum(e['triangles'] for e in manifest['assets']),
                          'primitives': sum(e['primitives'] for e in manifest['assets'])}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    result = {'scope': 'New v2 assets only. No historical certificates or FPS claims.', 'pass': True,
              'validator_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'assets': reports, 'layout': layout_results, 'totals': manifest['totals']}
    (OUT / 'independent-validation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print('TOTAL', manifest['totals'])


if __name__ == '__main__':
    main()
