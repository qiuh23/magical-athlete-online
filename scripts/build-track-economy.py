"""Economy-only detail LOD. Do not overwrite approved or collision source.
Retain shells, tread, rails and structural support exactly; reduce only 14 tiny
4mm-high grip ticks and 8 copper fasteners/clips. Check bidirectional sampled
surface distance <=2mm, and retain the source when simplification exceeds it.
"""
import bpy,sys,json,hashlib
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from pathlib import Path
args=sys.argv[sys.argv.index('--')+1:]; source,output,report=map(Path,args)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
def evaluated(obj):
 mesh=obj.to_mesh(); vertices=[v.co.copy() for v in mesh.vertices];mesh.calc_loop_triangles();faces=[tuple(t.vertices) for t in mesh.loop_triangles];obj.to_mesh_clear();return vertices,faces
def samples(vertices,faces):
 return vertices+[(vertices[a]+vertices[b]+vertices[c])/3 for a,b,c in faces]
def distance(a,b):
 tree=BVHTree.FromPolygons(*b,all_triangles=True)
 return max((tree.find_nearest(p)[3] or 0) for p in samples(*a))
rows=[]
for obj in [o for o in bpy.data.objects if o.type=='MESH']:
 old=evaluated(obj); changed=any(k in obj.name for k in ['grip_tick','axle_fastener','joint_clip']); error=0;ratio=1
 if changed:
  original=obj.data.copy()
  for ratio in [.12,.18,.25,.35,.5,1]:
   obj.data=original.copy()
   if ratio<1:
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    mod=obj.modifiers.new('Economy_small_detail','DECIMATE');mod.ratio=ratio;mod.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=mod.name);obj.select_set(False)
   new=evaluated(obj);error=max(distance(old,new),distance(new,old))
   if error<=.002:break
 new=evaluated(obj)
 # Data uses local geometry metrics; source object transforms are rigid with scale1.
 rows.append(dict(name=obj.name,changed=changed,sourceTriangles=len(old[1]),economyTriangles=len(new[1]),maxSampledSurfaceDistanceM=error,ratio=ratio))
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',export_animations=False,export_extras=True,export_yup=True)
report.write_text(json.dumps(dict(method='Economy-only collapse of tiny grip marks and copper fasteners/clips. Shell/tread/rails/all other geometry unchanged. Bidirectional source/LOD vertex and triangle-centroid surface distances <=2mm. Finite samples, not continuous Hausdorff bound. Full approved GLB remains collision source.',sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),outputSha256=hashlib.sha256(output.read_bytes()).hexdigest(),parts=rows,sourceTriangles=sum(r['sourceTriangles']for r in rows),economyTriangles=sum(r['economyTriangles']for r in rows)),indent=2))
