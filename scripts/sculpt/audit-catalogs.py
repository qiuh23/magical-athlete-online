import bpy,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];reports=[]
for source,manifest in [('assets/blender/toy-racers.blend','public/models/toy-racers.manifest.json'),('assets/blender/second-wind.blend','public/models/second-wind/manifest.json')]:
 m=json.loads((ROOT/manifest).read_text());expected={r['id']:r for r in m['models']+m.get('variants',[])};bpy.ops.wm.open_mainfile(filepath=str(ROOT/source));roots=[o for o in bpy.data.objects if o.name.startswith('toy_')and o.parent is None];assert {o.name[4:]for o in roots}==set(expected);rows=[]
 for root in roots:
  id=root.name[4:];meshes=[o for o in root.children if o.type=='MESH'];rig=next(o for o in root.children if o.type=='ARMATURE');tris=sum(sum(len(p.vertices)-2 for p in ob.data.polygons)for ob in meshes);assert tris==expected[id]['triangles'],(id,tris,expected[id]['triangles']);assert len(rig.animation_data.nla_tracks)==5;assert tuple(root.location)==(0,0,0)and tuple(root.scale)==(1,1,1);rows.append({'id':id,'triangles':tris,'bones':len(rig.data.bones),'editableParts':len(bpy.data.objects['EDIT-'+id].children)})
 reports.append({'source':source,'sourceSha256':hashlib.sha256((ROOT/source).read_bytes()).hexdigest(),'openedWith':'Blender '+bpy.app.version_string,'rootCount':len(roots),'models':rows,'passed':True});print('CATALOG_OK',source,len(roots),flush=True)
(ROOT/'docs/sculpt-20261024/catalog-source-audit.json').write_text(json.dumps(reports,indent=2))
