"""New environment v2 exporter. This is not the lost historical export pipeline.

Run: blender -b -t 2 --python scripts/recovery/export_environment_v2.py --
     --source-root ../materialized-sources
All inputs are read-only. No uploads, commits, remote changes or light creation.
"""
import argparse
import copy
import hashlib
import json
import shutil
import sys
from pathlib import Path

import bpy
import bmesh
import numpy as np
from mathutils import Matrix

REPO = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--source-root', type=Path, default=REPO.parent / 'materialized-sources')
parser.add_argument('--evidence-dir', type=Path, default=REPO.parent / 'environment-rebuilt-v2-evidence')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
SOURCE = args.source_root.resolve()
EVIDENCE = args.evidence_dir.resolve()
OUT = REPO / 'public/models/environment-rebuilt-v2'
LAYOUT = REPO / 'src/client/scene/environment'
for path in (OUT, EVIDENCE, LAYOUT):
    path.mkdir(parents=True, exist_ok=True)
NATURAL = SOURCE / 'extracted/athlete_three_maps_refined_20261112'
U = SOURCE / 'extracted/athlete_u_maps_sources_joint_updated_20261112/u_maps_sources'
C = Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1)))
TREE_COLLECTIONS = {'TREE_01_Broadleaf_Elm': 'elm', 'TREE_02_Airy_FieldMaple': 'maple', 'TREE_03_Young_Sapling': 'sapling'}
REPORTS = []
LAYOUTS = {}
LAYOUT_META = {}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_identity(path):
    package = 'athlete_three_maps_refined_20261112.zip' if path.parent == NATURAL else 'athlete_u_maps_sources_joint_updated_20261112.zip'
    return {'package': package,
            'package_sha256': sha(SOURCE / 'known-packages' / package),
            'blend_member': str(path.relative_to(SOURCE / 'extracted')),
            'blend_sha256': sha(path)}


def rows(m):
    return [list(row) for row in m]


def pbr(material):
    node = next((n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None) if material.use_nodes else None
    return {'name': material.name,
            'baseColorFactor': list(node.inputs['Base Color'].default_value) if node else list(material.diffuse_color),
            'metallicFactor': float(node.inputs['Metallic'].default_value) if node else material.metallic,
            'roughnessFactor': float(node.inputs['Roughness'].default_value) if node else material.roughness}


def bounds(points):
    points = np.asarray(points).reshape(-1, 3)
    return [points.min(0).tolist(), points.max(0).tolist()]


def simplified_tree(obj, role):
    """Collapse original bark/leaves separately; bake surviving source face colors.

    CORNER colors deliberately keep hard palette boundaries. Converting after
    decimation avoids color interpolation. Leaves remain original opaque geometry.
    Bark roughness is a documented new 0.90 approximation of source 0.88/0.90/0.91.
    """
    original = [pbr(m) for m in obj.data.materials]
    obj.data.calc_loop_triangles()
    before = len(obj.data.loop_triangles)
    before_bounds = bounds([[v.co.x, v.co.z, -v.co.y] for v in obj.data.vertices])
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    decimate = obj.modifiers.new('NEW_v2_mobile_LOD2_ratio_0_30', 'DECIMATE')
    decimate.ratio = 0.30
    decimate.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    mesh = obj.data
    # Collapse can leave zero-area faces; glTF drops them. Remove them explicitly
    # before the source-of-export snapshot so measured triangle counts are real.
    bm = bmesh.new()
    bm.from_mesh(mesh)
    degenerate = [face for face in bm.faces if face.calc_area() <= 1e-12]
    bmesh.ops.delete(bm, geom=degenerate, context='FACES')
    bm.to_mesh(mesh)
    bm.free()
    topology_repaired = mesh.validate(verbose=True, clean_customdata=False)
    mesh.update()
    mesh.calc_loop_triangles()
    colors = mesh.color_attributes.new(name='SOURCE_FACE_COLOR', type='FLOAT_COLOR', domain='CORNER')
    mesh.color_attributes.active_color = colors
    palette_counts = {}
    for poly in mesh.polygons:
        mat = original[poly.material_index]
        color = mat['baseColorFactor']
        assert color[3] == 1, 'Unexpected nonopaque source tree'
        palette_counts[mat['name']] = palette_counts.get(mat['name'], 0) + len(poly.vertices) - 2
        for loop in poly.loop_indices:
            colors.data[loop].color = color
        poly.material_index = 0
    material = bpy.data.materials.new('NEW_v2_' + role + '_source_vertex_color')
    material.use_nodes = True
    material.diffuse_color = (1, 1, 1, 1)
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (1, 1, 1, 1)
    bsdf.inputs['Metallic'].default_value = 0
    bsdf.inputs['Roughness'].default_value = 0.90 if role == 'bark' else 0.77
    vc = material.node_tree.nodes.new('ShaderNodeVertexColor')
    vc.layer_name = 'SOURCE_FACE_COLOR'
    material.node_tree.links.new(vc.outputs['Color'], bsdf.inputs['Base Color'])
    mesh.materials.clear()
    mesh.materials.append(material)
    return {'role': role, 'source_triangles': before, 'rebuilt_triangles': len(mesh.loop_triangles),
            'ratio_requested': 0.30, 'ratio_actual': len(mesh.loop_triangles) / before,
            'source_bounds_y_up': before_bounds, 'source_palette': original,
            'surviving_palette_triangles': palette_counts,
            'rebuilt_material': material.name, 'removed_degenerate_faces': len(degenerate),
            'post_decimate_topology_repaired': topology_repaired,
            'roughness': 0.90 if role == 'bark' else 0.77,
            'roughness_note': 'New bark approximation: original 0.88/0.90/0.91 -> 0.90; leaf roughness unchanged.'}


def export(name, source, objects, root=None, tree=False, selector=''):
    source_scene = bpy.context.scene
    dg = bpy.context.evaluated_depsgraph_get()
    copies = []
    source_objects = []
    source_points = []
    frame = root.matrix_world.inverted() if root else Matrix.Identity(4)
    for obj in sorted(objects, key=lambda o: o.name):
        if obj.type not in {'MESH', 'CURVE', 'FONT', 'SURFACE'}:
            continue
        mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        mesh.calc_loop_triangles()
        transform = frame @ obj.matrix_world
        source_objects.append({'name': obj.name, 'triangles': len(mesh.loop_triangles),
                               'source_world_matrix_z_up': rows(obj.matrix_world),
                               'baked_matrix_z_up': rows(transform)})
        source_points.extend([[v.x, v.z, -v.y] for v in (transform @ v.co for v in mesh.vertices)])
        mesh.transform(transform)
        mesh.update()
        copies.append(bpy.data.objects.new(obj.name + '_NEW_V2', mesh))
    assert copies, name
    work = bpy.data.scenes.new('NEW_ENVIRONMENT_V2_EXPORT')
    for obj in copies:
        work.collection.objects.link(obj)
    bpy.context.window.scene = work
    tree_report = []
    if tree:
        for obj in copies:
            tree_report.append(simplified_tree(obj, 'bark' if 'BARK_AND_BRANCHES' in obj.name else 'leaves'))
    triangles, labels, vertex_colors = [], [], []
    materials = {}
    for obj in copies:
        mesh = obj.data
        mesh.calc_loop_triangles()
        color = mesh.color_attributes.get('SOURCE_FACE_COLOR')
        for mat in mesh.materials:
            if mat:
                materials[mat.name] = pbr(mat)
        for tri in mesh.loop_triangles:
            triangles.append([[mesh.vertices[i].co.x, mesh.vertices[i].co.z, -mesh.vertices[i].co.y] for i in tri.vertices])
            labels.append(mesh.materials[tri.material_index].name)
            vertex_colors.append([list(color.data[i].color) for i in tri.loops] if color else [[1, 1, 1, 1]] * 3)
    # Stored outside the runtime package, for an independent GLB decoder comparison.
    np.savez_compressed(EVIDENCE / (name + '.expected.npz'), triangles=np.asarray(triangles),
                        materials=np.asarray(labels), colors=np.asarray(vertex_colors))
    path = OUT / (name + '.glb')
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_active_scene=True,
        export_animations=False, export_cameras=False, export_lights=False, export_yup=True,
        export_materials='EXPORT', export_normals=True, export_texcoords=False,
        export_tangents=False, export_extras=False)
    data = path.read_bytes()
    REPORTS.append({'name': name, 'file': path.name, 'status': 'new_source_derived_environment_v2',
                    'historical_certificate_inherited': False, 'source': source_identity(source),
                    'selector': selector, 'space': 'source_root_local' if root else 'source_world_baked_identity',
                    'removed_source_root_matrix_y_up': rows(C @ root.matrix_world @ C.inverted()) if root else None,
                    'source_objects': source_objects, 'source_bounds_y_up': bounds(source_points),
                    'expected_export_bounds_y_up': bounds(triangles), 'triangles': len(triangles),
                    'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                    'git_blob_sha1': hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest(),
                    'exporter_sha256': sha(Path(__file__)), 'source_materials_or_rebuilt_materials': list(materials.values()),
                    'tree_lod2': tree_report or None})
    bpy.context.window.scene = source_scene
    bpy.data.scenes.remove(work)
    print('NEW_V2_EXPORTED', name, len(data), len(triangles), flush=True)


def capture_layout(track, source, map_source):
    instances = [o for o in bpy.context.scene.objects if o.instance_type == 'COLLECTION'
                 and o.instance_collection and o.instance_collection.name in TREE_COLLECTIONS]
    excluded = []
    if track in {'mild', 'twisty-twirl', 'whirly-world'}:
        # Recovered U scenes contain both old outer GROVE trees and the accepted
        # six-tree INFIELD layer. Do not duplicate the old outer layer at runtime.
        excluded = [o.name for o in instances if not o.name.startswith('INFIELD_TREE_')]
        instances = [o for o in instances if o.name.startswith('INFIELD_TREE_')]
        assert len(instances) == 6
    LAYOUTS[track] = {'trees': [{'name': o.name,
        'asset': 'tree_' + TREE_COLLECTIONS[o.instance_collection.name] + '_rebuilt_lod2',
        'matrix': rows(C @ o.matrix_world @ C.inverted()), 'sourceScale': 1}
        for o in sorted(instances, key=lambda o: o.name)],
        'pockets': copy.deepcopy(map_source['tracks'][track]['pockets'])}
    LAYOUT_META[track] = {'source': source_identity(source), 'tree_count': len(instances),
                         'placement': 'direct_source_scene_collection_instances', 'sourceScale': 1,
                         'selected_layer': 'INFIELD_TREE_*' if excluded else 'all_tree_instances',
                         'excluded_source_instances': sorted(excluded)}


map_path = NATURAL / 'map_source.json'
map_source = json.loads(map_path.read_text())
for track in ('squiggle', 'boardwalks', 'bridges'):
    path = NATURAL / (track + '_refined.blend')
    bpy.ops.wm.open_mainfile(filepath=str(path), load_ui=False, use_scripts=False)
    capture_layout(track, path, map_source)
    for layer, prefix in [('base', 'BASE_'), ('furniture', 'REFINED_BATCH_FURNITURE_')]:
        export(track + '_' + layer, path, [o for o in bpy.data.objects if o.name.startswith(prefix)], selector=prefix)
    if track == 'squiggle':
        for collection, label in TREE_COLLECTIONS.items():
            export('tree_' + label + '_rebuilt_lod2', path, list(bpy.data.collections[collection].all_objects), tree=True, selector=collection)

for track, filename in [('mild', 'mild_plain.blend'), ('twisty-twirl', 'twisty-twirl.blend'), ('whirly-world', 'whirly-world.blend')]:
    path = U / filename
    bpy.ops.wm.open_mainfile(filepath=str(path), load_ui=False, use_scripts=False)
    capture_layout(track, path, map_source)
    if track != 'mild':
        continue
    for label in ('bleachers', 'spectators', 'podium', 'officials_kiosk', 'scoreboard', 'start_gate', 'finish_gate'):
        root_name = 'athlete_' + ('spectators_strip' if label == 'spectators' else label) + '_layout'
        root = bpy.data.objects[root_name]
        export(label, path, list(root.children_recursive), root=root, selector=root_name)
    for label, prefix in [('grandstand_rostrum', 'FIT_grandstand_'), ('official_rostrum', 'FIT_official_rostrum'), ('podium_plinth', 'FIT_podium_landscape_plinth')]:
        export(label, path, [o for o in bpy.data.objects if o.name.startswith(prefix)], selector=prefix)

LAYOUTS['wild'] = copy.deepcopy(LAYOUTS['mild'])
LAYOUTS['wild']['pockets'] = []
LAYOUT_META['wild'] = copy.deepcopy(LAYOUT_META['mild'])
LAYOUT_META['wild'].update({'placement': 'derived-source', 'derived_from_track': 'mild',
                          'reason': 'Standalone wild/infield grove source has not been recovered; reuse actual mild U-scene placements as a declared new derivation.'})

prior = json.loads((SOURCE / 'reexports/reexport-manifest.json').read_text())
for entry in prior['exports']:
    if '_landscape_' not in entry['name']:
        continue
    original = SOURCE / 'reexports' / (entry['name'] + '.glb')
    destination = OUT / original.name
    shutil.copyfile(original, destination)
    assert sha(original) == sha(destination) == entry['sha256']
    source = NATURAL / Path(entry['source']).name
    truth = np.load(SOURCE / 'reexports' / (entry['name'] + '.source-triangles.npz'))
    np.savez_compressed(EVIDENCE / (entry['name'] + '.expected.npz'), triangles=truth['triangles'],
                        materials=truth['materials'], colors=np.ones((len(truth['triangles']), 3, 4)))
    REPORTS.append({'name': entry['name'], 'file': destination.name, 'status': 'unchanged_bytes_of_new_source_reexport_v1',
                    'historical_certificate_inherited': False, 'historical_byte_match': entry['historical_byte_match'],
                    'source': source_identity(source), 'selector': 'REFINED_BATCH_LANDSCAPE_',
                    'space': 'source_world_baked_identity', 'triangles': entry['triangles'],
                    'bytes': entry['bytes'], 'sha256': entry['sha256'], 'git_blob_sha1': entry['git_blob_sha1'],
                    'exporter_sha256': prior['exporter_sha256'], 'copy_script_sha256': sha(Path(__file__)),
                    'source_bounds_y_up': [entry['source_bbox_gltf_y_up'][:3], entry['source_bbox_gltf_y_up'][3:]],
                    'source_materials_or_rebuilt_materials': entry['source_materials']})

(LAYOUT / 'source-layout.json').write_text(json.dumps(LAYOUTS, ensure_ascii=False, indent=2) + '\n')
(LAYOUT / 'source-layout.metadata.json').write_text(json.dumps({
    'version': 'new-environment-rebuild-v2', 'historical_certificate_inherited': False,
    'matrix_contract': '4x4 row-major nested arrays in glTF/Three Y-up: C*M*C^-1, C=(x,z,-y). Matrix includes original yaw, scale and placement.',
    'asset_contract': 'GLB filename stem under /models/environment-rebuilt-v2/',
    'sourceScale': 1, 'coordinate_note': 'No mechanismsScale. Original map_source is pre-mechanism-scale commit.',
    'pocket_source': {'file': str(map_path.relative_to(SOURCE)), 'sha256': sha(map_path), 'source_commit': map_source['source_commit']},
    'exporter_sha256': sha(Path(__file__)), 'tracks': LAYOUT_META,
    'occlusion_fixes': 'Not applied here. Original tree instance names preserved for explicit runtime repairs.'
}, ensure_ascii=False, indent=2) + '\n')
(OUT / 'asset-manifest.json').write_text(json.dumps({
    'version': 'new-environment-rebuild-v2', 'blender_version': bpy.app.version_string,
    'historical_certificate_inherited': False, 'exporter_sha256': sha(Path(__file__)),
    'notes': ['All assets are new exports or unchanged bytes of identified new v1 landscape reexports.',
              'No old tested-tree, performance, collision or runtime certificates inherited.',
              'No missing fl_* fixture geometry reconstructed or substituted.',
              'Only LOD2 tree GLBs included. Two materials per tree, no textures, original opaque source palette in corner vertex colors.',
              'Source-world supports retain original heights. Facility prototypes remove root placement. No extra +1.43 offset.'],
    'assets': REPORTS
}, ensure_ascii=False, indent=2) + '\n')
print('COMPLETE', len(REPORTS), 'assets', {k: len(v['trees']) for k, v in LAYOUTS.items()}, flush=True)
