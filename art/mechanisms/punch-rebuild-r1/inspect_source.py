import bpy,json,sys
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[3]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'public/models/mechanisms/punch_outboard_joint.glb'))
for o in bpy.data.objects:
 o.animation_data_clear()
 if o.data and hasattr(o.data,'shape_keys') and o.data.shape_keys:o.data.shape_keys.animation_data_clear()
for name in ['PUNCH_BOOM_Z','PUNCH_COUNTER_YAW']:
 o=bpy.data.objects[name];o.rotation_mode='XYZ';o.rotation_euler=(0,0,0)
bpy.data.objects['PUNCH_SLIDER_X'].location.x=.35
bpy.context.view_layer.update()
rows=[]
for o in bpy.data.objects:
 if o.type=='MESH':
  pts=[o.matrix_world@Vector(p) for p in o.bound_box]
  rows.append({'name':o.name,'parent':o.parent.name if o.parent else None,'location':list(o.location),'rotation':list(o.rotation_euler),'scale':list(o.scale),'worldMin':[min(p[i] for p in pts)for i in range(3)],'worldMax':[max(p[i] for p in pts)for i in range(3)]})
out=root/'docs/qa/punch-rebuild-r1/source-inspection.json';out.write_text(json.dumps(rows,indent=2));print(out)
