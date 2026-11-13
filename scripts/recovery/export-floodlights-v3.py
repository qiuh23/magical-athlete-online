"""Build NEW reference-informed floodlight components, never recovered fl_* bytes.

Reproduce (Blender 4.3.2):
  blender -b --disable-autoexec -t 2 --python scripts/recovery/export-floodlights-v3.py

No runtime files, source assets, Git state, uploads or remote state are changed.
All dimensions below are runtime Y-up meters. Blender stores (x,-z,y).
"""
import argparse
import hashlib
import json
import math
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

REPO = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--output-dir', type=Path, default=REPO / 'public/models/floodlights-rebuilt-v3')
parser.add_argument('--source-dir', type=Path, default=REPO.parent / 'lights-rebuilt-v3')
parser.add_argument('--reference', type=Path)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
OUT, SOURCE = args.output_dir.resolve(), args.source_dir.resolve()
REF = args.reference or SOURCE / 'reference/胡闹运动会_场边射灯_夜间赛道预览.png'
assert REF.is_file(), 'Provide the verified reference PNG; do not silently invent a substitute.'
for p in (OUT, SOURCE):
    p.mkdir(parents=True, exist_ok=True)

C = Matrix(((1, 0, 0, 0), (0, 0, 1, 0), (0, -1, 0, 0), (0, 0, 0, 1)))
CI = C.inverted()
NAMES = ['base', 'pole', 'yoke', 'housing', 'lenses']
PARTS = {n: [] for n in NAMES}


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def material(name, color, metal=0.0, rough=.48, emission=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.diffuse_color = (*color, 1)
    m.use_backface_culling = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    p.inputs['Alpha'].default_value = 1
    if emission:
        p.inputs['Emission Color'].default_value = (*emission, 1)
        p.inputs['Emission Strength'].default_value = 1
    return m


def finish(obj, part, name, mat):
    obj.name = 'NEW_FL3_' + name
    obj.data.materials.append(mat)
    PARTS[part].append(obj)
    return obj


def box(part, name, center, size, mat, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=CI @ Vector(center))
    o = bpy.context.object
    o.dimensions = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        m = o.modifiers.new('Small_manufactured_edge', 'BEVEL')
        m.width = bevel
        m.segments = 1
        m.affect = 'EDGES'
        bpy.ops.object.modifier_apply(modifier=m.name)
    return finish(o, part, name, mat)


def cylinder(part, name, center, radius, length, mat, vertices=8):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=length,
                                      end_fill_type='NGON', location=CI @ Vector(center))
    return finish(bpy.context.object, part, name, mat)


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.use_scripts_auto_execute = False
scene = bpy.context.scene
scene.name = 'NEW_REFERENCE_INFORMED_FLOODLIGHT_COMPONENTS_V3'
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
# Darkened source ink, maintaining source facilities' untextured palette treatment.
INK = (.021219009533524513, .1119324266910553, .09084171056747437)
metal = material('NEW_FL3_source_ink_darkened_0_40', tuple(v * .40 for v in INK), .22, .48)
housing = material('NEW_FL3_housing_charcoal_teal', (.008, .018, .020), .18, .48)
fastener = material('NEW_FL3_muted_fastener', (.075, .095, .09), .45, .40)
white = material('NEW_FL3_white_diffuser', (.91, .94, .93), 0, .34, (.16, .17, .17))

# Grounded foot: no geometry extends below y=0; collar overlaps the shaft.
box('base', 'foot_plate', (0, .05, 0), (.70, .10, .65), metal, .025)
box('base', 'foot_socket', (0, .14, 0), (.23, .12, .23), metal, .012)
for x in (-.25, .25):
    for z in (-.225, .225):
        cylinder('base', 'anchor_head', (x, .1075, z), .025, .015, fastener)

# Eight-sided constant-section shaft. Only this component may scale in Y.
cylinder('pole', 'unit_shaft', (0, .5, 0), .0575, 1, metal)

# Origin-centered ball remains attached to the shaft under all shared head tilts.
bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=.105, location=(0, 0, 0))
socket = finish(bpy.context.object, 'yoke', 'hinge_ball_at_origin', metal)
for p in socket.data.polygons:
    p.use_smooth = True
box('yoke', 'rear_crossbar', (0, .04, .10), (.78, .10, .12), metal, .008)
# Rear crossbar overlaps sphere, each backing slab, and both short gussets.
for x in (-.33, .33):
    box('yoke', 'housing_back_mount', (x, .10, .065), (.105, .17, .05), metal, .006)

# Each head: physical backing, deep perimeter frame and two horizontal louvers.
# Complete housing bounds x=+/-0.62, y=-0.04..0.32, z=-0.16..0.06.
for side, x in [('left', -.33), ('right', .33)]:
    box('housing', side + '_backing', (x, .14, .0375), (.58, .36, .045), housing, .006)
    for xx in (x - .2725, x + .2725):
        box('housing', side + '_side_rim', (xx, .14, -.055), (.035, .36, .21), housing, .004)
    for yy in (-.0225, .3025):
        box('housing', side + '_horizontal_rim', (x, yy, -.055), (.51, .035, .21), housing, .004)
    for yy in (.092, .188):
        box('housing', side + '_louver', (x, yy, -.148), (.51, .014, .024), housing)
    # Actual opaque diffuser solids; front normals point -Z, no fake beams.
    box('lenses', side + '_diffuser', (x, .14, -.136), (.51, .29, .018), white)

# Join each part into one identity mesh. All geometry remains part-local.
joined = {}
for part in NAMES:
    bpy.ops.object.select_all(action='DESELECT')
    for o in PARTS[part]:
        o.select_set(True)
    bpy.context.view_layer.objects.active = PARTS[part][0]
    bpy.ops.object.join()
    o = bpy.context.object
    scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    o.name = 'NEW_FL3_' + part
    o.data.name = 'NEW_FL3_' + part + '_mesh'
    o['identity'] = 'new_reference_informed_v3_not_recovered_original'
    o['runtime_coordinates'] = 'Y-up meters; local lens front -Z'
    o['runtime_contract'] = ('Only shaft scales in Y; local y=0..1' if part == 'pole' else
                             'Fixed scale (1,1,1); head parts share actual origin hinge' if part in ['yoke', 'housing', 'lenses'] else
                             'Floor at local y=0; shaft begins at y=0.16')
    joined[part] = o

scene['provenance'] = 'NEW reference-informed modeling from saved PNG, not recovered historical fl_* bytes'
scene['reference_sha256'] = sha(REF)
scene['scripts_autorun'] = 'Disabled; no embedded text scripts, drivers, linked libraries or textures'
# The source contains only the five authored meshes and no display-time scaling.
blend = SOURCE / 'floodlights-reference-rebuilt-v3.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(blend), check_existing=False)

assets = []
for part in NAMES:
    bpy.ops.object.select_all(action='DESELECT')
    o = joined[part]
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    mesh = o.data
    mesh.calc_loop_triangles()
    points = [C @ v.co for v in mesh.vertices]
    bounds = [[min(p[i] for p in points) for i in range(3)], [max(p[i] for p in points) for i in range(3)]]
    path = OUT / (part + '.glb')
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=True,
        export_yup=True, export_normals=True, export_texcoords=False, export_tangents=False,
        export_animations=False, export_cameras=False, export_lights=False,
        export_materials='EXPORT', export_extras=False)
    b = path.read_bytes()
    n, _ = struct.unpack_from('<II', b, 12)
    gltf = json.loads(b[20:20+n])
    assert not gltf.get('images') and not gltf.get('textures')
    assert 'KHR_lights_punctual' not in gltf.get('extensionsUsed', [])
    mats = gltf['materials']
    assert 1 <= len(mats) <= 2
    assert all(m.get('alphaMode', 'OPAQUE') == 'OPAQUE' and
               m['pbrMetallicRoughness']['baseColorFactor'][3] == 1 for m in mats)
    tri = len(mesh.loop_triangles)
    record = {'name': part, 'file': path.name, 'identity': 'NEW_reference_informed_floodlight_v3',
              'historical_original': False, 'bytes': len(b), 'sha256': sha(path),
              'triangles': tri, 'bounds_y_up': bounds, 'materials': mats,
              'mesh_count': len(gltf['meshes']),
              'primitives': sum(len(m['primitives']) for m in gltf['meshes']),
              'nodes': gltf['nodes']}
    assets.append(record)
    print('FLOODLIGHT_V3_EXPORTED', part, tri, len(b), flush=True)

contract = {
    'units': 'meters', 'runtime_axes': 'Y-up; forward/local front is -Z',
    'new_identity': 'New modeling informed by saved reference. Original five fl_* templates remain missing.',
    'base': {'origin': [0, 0, 0], 'nominal_size': [.70, .20, .65], 'fixed_scale': [1, 1, 1]},
    'pole': {'local_y': [0, 1], 'cross_section_max_width': .115,
             'placement': 'position=(0,0.16,0); scale=(1,H-0.16,1), H is desired world hinge height'},
    'head': {'files': ['yoke.glb', 'housing.glb', 'lenses.glb'],
             'placement': 'All at (0,H,0), scale=(1,1,1), same quaternion about shared origin',
             'pivot': [0, 0, 0], 'socket_radius': .105, 'front_normal': [0, 0, -1],
             'tilt': 'Negative local X rotation points the panel normals downward; yaw is local/world Y',
             'physical_attachment': 'Origin-centered spherical socket overlaps shaft; rear crossbar intersects socket, mounts and both backing plates',
             'housing_centers_x': [-.33, .33], 'housing_center_y': .14,
             'housing_size_each': [.58, .36, .22],
             'lens_front_z': -.145,
             'luminaire': 'Opaque white diffuser backed by physical slab/frame, two real louvers per panel. No beam geometry or glTF lights.'},
    'runtime_budget_scope': 'Assets only. Two fixed fixtures in both tiers; two full/one low spot receivers are parent runtime responsibilities. No FPS claim.'
}
(OUT / 'coordinate-contract.json').write_text(json.dumps(contract, indent=2) + '\n')
report = {
    'version': 'NEW_floodlights_rebuilt_v3', 'status': 'new_reference_informed_geometry_not_recovered_original_bytes',
    'historical_certificate_inherited': False, 'blender_version': bpy.app.version_string,
    'reference': {'file': REF.name,
                  'sha256': sha(REF), 'role': 'Visually viewed design reference only; no recovered geometry'},
    'style_source': {'file': 'environment-rebuilt-v2/scoreboard.glb',
                     'sha256': sha(REPO / 'public/models/environment-rebuilt-v2/scoreboard.glb'),
                     'role': 'Source facility PBR palette and meter scale; no geometry copied',
                     'source_ink_linear_rgb': INK, 'new_metal_color': 'source ink multiplied by 0.40',
                     'source_scoreboard_height': 2.105},
    'source_blend': {'file': blend.name, 'sha256': sha(blend), 'objects': 5,
                     'script_autorun': False, 'embedded_text_scripts': 0, 'drivers': 0},
    'exporter': {'file': 'scripts/recovery/export-floodlights-v3.py', 'sha256': sha(Path(__file__))},
    'assets': assets, 'totals': {'triangles': sum(a['triangles'] for a in assets), 'bytes': sum(a['bytes'] for a in assets),
                               'primitives': sum(a['primitives'] for a in assets)},
    'contract_file': 'coordinate-contract.json',
    'notes': ['Original five fl_* templates remain missing.', 'New files never inherit old geometry, collision, visual, performance or runtime certificates.',
              'No external resources, textures, animations, cameras, lights, transparency or fake beam geometry in any GLB.',
              'Reference does not specify dimensions: the explicit contract is a new integration choice.',
              'Authored component .blend is unassembled: all five components keep their runtime origin for inspection.']
}
assert report['totals']['triangles'] < 2500
assert report['totals']['bytes'] < 150_000
(OUT / 'asset-manifest.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
(SOURCE / 'coordinate-contract.json').write_text(json.dumps(contract, indent=2) + '\n')
print('FLOODLIGHT_V3_TOTALS', report['totals'], flush=True)
