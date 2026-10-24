import bpy,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];stage=ROOT/'tmp/sculpt-stage'
ids=[a.split('=',1)[1]for a in sys.argv if a.startswith('--id=')]or ['coach','hare','gunk','copycat']
if '--economy-only'not in sys.argv:bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/blender/toy-racers.blend'))
def recursive(o):
 return [o]+[v for c in o.children for v in recursive(c)]
if '--economy-only'not in sys.argv:
 for id in ids:
  for name in ['toy_'+id,'EDIT-'+id]:
   o=bpy.data.objects.get(name)
   if o:
    for v in reversed(recursive(o)):bpy.data.objects.remove(v,do_unlink=True)
  for act in list(bpy.data.actions):
   if act.name.startswith(id+'-'):bpy.data.actions.remove(act)
  with bpy.data.libraries.load(str(stage/(id+'.blend')),link=False)as (data,target):target.objects=data.objects
  for o in target.objects:
   if o and not o.users_collection:bpy.context.scene.collection.objects.link(o)
  bpy.data.objects['toy_'+id]['sculptVersion']='authored-20261024'
 bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/toy-racers.blend'),compress=True)
# Export each staged quality separately, full bundle assembly preserves untouched GLBs.
for id in ids:
 bpy.ops.wm.open_mainfile(filepath=str(stage/(id+'.blend')));root=bpy.data.objects['toy_'+id]
 def triangles(ob):return sum(len(p.vertices)-2 for p in ob.data.polygons)
 meshes=[o for o in root.children if o.type=='MESH']
 bounds=[(min(v.co[k]for ob in meshes for v in ob.data.vertices),max(v.co[k]for ob in meshes for v in ob.data.vertices))for k in range(3)]
 total=sum(triangles(o)for o in meshes)
 while total>2140:
  def score(ob):
   detail=ob.data.attributes.get('sculpt_detail');importance=sum(v.value for v in detail.data)/max(1,len(detail.data))if detail else 0
   return triangles(ob)*max(.1,1-importance)
  candidates=[o for o in meshes if triangles(o)>100]
  if not candidates:raise RuntimeError('Cannot satisfy economy budget '+id)
  ob=max(candidates,key=score);own=triangles(ob);remove=min(total-2120,own*.6)
  bpy.context.view_layer.objects.active=ob;mod=ob.modifiers.new('Economy silhouette reduction','DECIMATE');mod.ratio=(own-remove)/own;bpy.ops.object.modifier_apply(modifier=mod.name)
  updated=sum(triangles(o)for o in meshes)
  if updated>=total:raise RuntimeError('Economy reduction stalled '+id)
  total=updated
 # Decimation can move an extremal foot vertex by millimetres. Re-seat
 # the entire authored geometry without adding a runtime/root offset.
 for ob in meshes:
  for vertex in ob.data.vertices:
   for k,(lo,hi)in enumerate(bounds):vertex.co[k]=min(hi,max(lo,vertex.co[k]))
 minimum=min(v.co.z for ob in meshes for v in ob.data.vertices)
 for ob in meshes:
  for vertex in ob.data.vertices:vertex.co.z-=minimum
 bpy.ops.object.select_all(action='DESELECT')
 for o in recursive(root):o.hide_set(False);o.select_set(True)
 params=dict(filepath=str(stage/(id+'-economy.glb')),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_frame_range=False,export_force_sampling=False,export_extras=True,export_skins=True,export_texcoords=False)
 allowed=bpy.ops.export_scene.gltf.get_rna_type().properties.keys();bpy.ops.export_scene.gltf(**{k:v for k,v in params.items()if k in allowed})
