"""Blender import verification and source-vs-new visual QA renders (not runtime QA)."""
import hashlib
import json
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / 'public/models/environment-rebuilt-v2'
EVIDENCE = REPO.parent / 'environment-rebuilt-v2-evidence'
SOURCE = REPO.parent / 'materialized-sources/extracted/athlete_three_maps_refined_20261112/squiggle_refined.blend'
manifest = json.loads((OUT / 'asset-manifest.json').read_text())
results = []


def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_glb(name):
    bpy.ops.import_scene.gltf(filepath=str(OUT / (name + '.glb')))
    return list(bpy.context.selected_objects)


def render_setup(name, target, camera, width=900, height=650, ortho=7.6):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 48
    scene.cycles.use_denoising = False  # This Blender build has no OpenImageDenoise.
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(EVIDENCE / (name + '.png'))
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'Medium High Contrast' if 'Medium High Contrast' in [i.name for i in scene.view_settings.bl_rna.properties['look'].enum_items] else 'None'
    scene.world = bpy.data.worlds.new('QA_WORLD')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.55, .6, .64, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = .55
    bpy.ops.object.camera_add(location=camera)
    cam = bpy.context.object
    cam.rotation_euler = (Vector(target) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = ortho
    scene.camera = cam
    bpy.ops.object.light_add(type='AREA', location=(target[0] - 4, -6, 10))
    light = bpy.context.object
    light.data.energy = 950
    light.data.shape = 'DISK'
    light.data.size = 7
    light.rotation_euler = (Vector(target) - light.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.05))
    floor = bpy.context.object
    material = bpy.data.materials.new('QA_NEUTRAL_FLOOR')
    material.diffuse_color = (.16, .18, .20, 1)
    material.use_nodes = True
    material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.16, .18, .20, 1)
    floor.data.materials.append(material)
    bpy.ops.render.render(write_still=True)


for e in manifest['assets']:
    clean()
    objects = import_glb(e['name'])
    meshes = [o for o in objects if o.type == 'MESH']
    triangles = 0
    points = []
    for obj in meshes:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
        points.extend([[v.x, v.z, -v.y] for v in (obj.matrix_world @ vertex.co for vertex in obj.data.vertices)])
    actual = np.asarray(points)
    bbox = [actual.min(0).tolist(), actual.max(0).tolist()]
    bound_error = float(np.max(np.abs(np.asarray(bbox) - np.asarray(e['bounds_y_up']))))
    assert triangles == e['triangles'], (e['name'], triangles, e['triangles'])
    assert bound_error < 2e-5
    assert not bpy.data.libraries
    assert not [image for image in bpy.data.images if image.source == 'FILE' and not image.packed_file]
    colors = [len(o.data.color_attributes) for o in meshes]
    if e.get('tree_lod2'):
        assert all(n >= 1 for n in colors)
    results.append({'name': e['name'], 'pass': True, 'triangles': triangles, 'meshes': len(meshes),
                    'bounds_y_up': bbox, 'bounds_error_max': bound_error, 'color_attribute_counts': colors,
                    'linked_libraries': 0, 'external_file_images': 0})
    print('REOPEN_PASS', e['name'], triangles, flush=True)

for label, collection in [('elm', 'TREE_01_Broadleaf_Elm'), ('maple', 'TREE_02_Airy_FieldMaple'), ('sapling', 'TREE_03_Young_Sapling')]:
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE), load_ui=False, use_scripts=False)
    dg = bpy.context.evaluated_depsgraph_get()
    scene = bpy.data.scenes.new('QA_SOURCE_VS_NEW_LOD2')
    for obj in bpy.data.collections[collection].all_objects:
        mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        mesh.transform(obj.matrix_world)
        fresh = bpy.data.objects.new('SOURCE_' + obj.name, mesh)
        fresh.location.x = -1.85
        scene.collection.objects.link(fresh)
    bpy.context.window.scene = scene
    imported = import_glb('tree_' + label + '_rebuilt_lod2')
    for obj in imported:
        if not obj.parent:
            obj.location.x += 1.85
    render_setup('tree_' + label + '_source_left_lod2_right', (0, 0, 1.8), (7, -15, 7), ortho=8.2)

for name in ('start_gate', 'finish_gate'):
    clean()
    import_glb(name)
    render_setup(name + '_front', (0, 0, 1.35), (0, -12, 3), width=1000, height=500,
                 ortho=8.8 if name == 'start_gate' else 6.2)
    # Inspect opposite face as source signage may be baked into either side.
    bpy.context.scene.camera.location = (0, 12, 3)
    bpy.context.scene.camera.rotation_euler = (Vector((0, 0, 1.35)) - bpy.context.scene.camera.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.render.filepath = str(EVIDENCE / (name + '_rear.png'))
    bpy.ops.render.render(write_still=True)

(OUT / 'blender-reopen-validation.json').write_text(json.dumps({
    'scope': 'Blender 4.3.2 fresh GLB import plus isolated asset QA, not runtime gameplay or performance acceptance.',
    'validator_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    'pass': True, 'assets': results,
    'renders': ['tree_' + label + '_source_left_lod2_right.png' for label in ('elm', 'maple', 'sapling')]
        + [name + '_' + side + '.png' for name in ('start_gate', 'finish_gate') for side in ('front', 'rear')]
}, ensure_ascii=False, indent=2) + '\n')
