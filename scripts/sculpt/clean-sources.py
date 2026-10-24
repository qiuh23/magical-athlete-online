"""Remove only orphaned unused datablocks, preserving edit layers and all clip users."""
import bpy,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
paths=[ROOT/a.split('=',1)[1]for a in sys.argv if a.startswith('--path=')]or list((ROOT/'tmp/sculpt-stage').glob('*.blend'))
for p in paths:
 bpy.ops.wm.open_mainfile(filepath=str(p));before=p.stat().st_size
 if p.parent.name=='sculpt-stage':
  id=p.stem;roots=[bpy.data.objects['toy_'+id],bpy.data.objects['EDIT-'+id]];keep=set(roots)
  for root in roots:keep.update(root.children_recursive)
  for ob in list(bpy.data.objects):
   if ob not in keep:bpy.data.objects.remove(ob,do_unlink=True)
 bpy.data.orphans_purge(do_recursive=True);c=bpy.data.collections.get('coach'if p.name=='toy-racers.blend'else'bite-mark'if p.name=='second-wind.blend'else'__none');
 if c:c.hide_viewport=False;c.hide_render=False
 bpy.ops.wm.save_as_mainfile(filepath=str(p),compress=True);print('CLEANED',p.name,before,p.stat().st_size,flush=True)
