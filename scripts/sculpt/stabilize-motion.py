"""Ground existing local bone clips, preserving canonical game root and five-state API.
Dense per-frame correction prevents foot undershoot; it is not a new runtime controller.
"""
import bpy,sys,json
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parents[2];rows=json.loads((ROOT/'docs/sculpt-20261024/coverage.json').read_text())['rows'];selected=[a.split('=',1)[1]for a in sys.argv if a.startswith('--id=')]
for row in rows:
 id=row['id']
 if selected and id not in selected:continue
 p=ROOT/'tmp/sculpt-stage'/(id+'.blend');bpy.ops.wm.open_mainfile(filepath=str(p));root=bpy.data.objects['toy_'+id];arm=next(o for o in root.children if o.type=='ARMATURE');meshes=[o for o in root.children if o.type=='MESH'];tracks=list(arm.animation_data.nla_tracks)
 for track in tracks:track.mute=True
 for track in tracks:
  action=track.strips[0].action;arm.animation_data.action=action;end=round(track.strips[0].frame_end);samples=[]
  for frame in range(1,end+1):
   bpy.context.scene.frame_set(frame);bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();points=[]
   for ob in meshes:
    evaluated=ob.evaluated_get(deps);mesh=evaluated.to_mesh();points.extend(evaluated.matrix_world@v.co for v in mesh.vertices);evaluated.to_mesh_clear()
   lo=Vector([min(v[k]for v in points)for k in range(3)]);hi=Vector([max(v[k]for v in points)for k in range(3)]);dim=hi-lo
   scale=min(1,.979/dim.z,.599/dim.x,.599/dim.y)if row['edition']=='wurstii'else 1
   correction=Matrix.Translation(Vector((0,0,-lo.z*scale+(.0005 if id=='leaf-race-car'else 0))))@Matrix.Diagonal((scale,scale,scale,1))
   samples.append((frame,correction,{b.name:b.matrix_basis.copy()for b in arm.pose.bones}))
  for frame,correction,bases in samples:
   bpy.context.scene.frame_set(frame)
   for b in arm.pose.bones:b.matrix_basis=bases[b.name]
   bpy.context.view_layer.update()
   for b in arm.pose.bones:
    if b.parent is None:b.matrix=correction@b.matrix
   for b in arm.pose.bones:
    b.keyframe_insert('location',frame=frame,group=b.name);b.keyframe_insert('rotation_euler',frame=frame,group=b.name);b.keyframe_insert('scale',frame=frame,group=b.name)
 arm.animation_data.action=None
 for track in tracks:track.mute=False
 bpy.context.scene.frame_set(1)
 for b in arm.pose.bones:b.location=(0,0,0);b.rotation_euler=(0,0,0);b.scale=(1,1,1)
 bpy.ops.object.select_all(action='DESELECT')
 for o in [root,*root.children]:o.hide_set(False);o.select_set(True)
 bpy.context.view_layer.objects.active=root
 params=dict(filepath=str(p.with_suffix('.glb')),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_frame_range=False,export_force_sampling=False,export_extras=True,export_skins=True,export_texcoords=False)
 allowed=bpy.ops.export_scene.gltf.get_rna_type().properties.keys();bpy.ops.export_scene.gltf(**{k:v for k,v in params.items()if k in allowed});bpy.data.orphans_purge(do_recursive=True);bpy.ops.wm.save_as_mainfile(filepath=str(p),compress=True);print('STABILIZED',id,flush=True)
