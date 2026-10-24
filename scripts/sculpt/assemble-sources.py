"""Create the Second Wind source catalog from the exact rebuilt individual sources."""
import bpy,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];original='--original' in sys.argv;m=json.loads((ROOT/('public/models/toy-racers.manifest.json'if original else'public/models/second-wind/manifest.json')).read_text());bpy.ops.wm.read_factory_settings(use_empty=True)
for row in m['models']+m.get('variants',[]):
 id=row['id'];collection=bpy.data.collections.new(id);bpy.context.scene.collection.children.link(collection)
 with bpy.data.libraries.load(str(ROOT/'tmp/sculpt-stage'/(id+'.blend')),link=False)as(data,target):target.objects=[name for name in data.objects if name in ['toy_'+id,'EDIT-'+id,'RIG-'+id] or name.startswith('GEO-'+id+'-') or name.startswith(id+'_')]
 for o in target.objects:
  if o and not o.users_collection:collection.objects.link(o)
 collection.hide_render=id!=('coach'if original else'bite-mark');collection.hide_viewport=collection.hide_render;print('APPENDED',id,flush=True)
bpy.data.orphans_purge(do_recursive=True);bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/('assets/blender/toy-racers.blend'if original else'assets/blender/second-wind.blend')),compress=True)
