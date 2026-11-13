import bpy,math,json,itertools
from pathlib import Path
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[3];ART=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ART/'punch-rebuild-r1.blend'))
def pose(a,h,e,s):
 bpy.data.objects['PUNCH_BOOM_Z'].rotation_euler.z=a;bpy.data.objects['PUNCH_COUNTER_YAW'].rotation_euler.z=h-a
 for name in ['PUNCH_R1_TELESCOPE_1','PUNCH_R1_TELESCOPE_2']:bpy.data.objects[name].location.x=e/2
 bpy.data.objects['PUNCH_SLIDER_X'].location.x=.35+s;bpy.data.objects['PUNCH_SPRING'].data.shape_keys.key_blocks[1].value=s/.35;bpy.context.view_layer.update()
def world(o):
 ob=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ob.to_mesh();m.calc_loop_triangles();v=[ob.matrix_world@x.co for x in m.vertices];tri=[tuple(t.vertices)for t in m.loop_triangles];ob.to_mesh_clear();return v,tri
meshes=[o for o in bpy.data.objects if o.type=='MESH'];pairs={}
poses=list(itertools.product([math.pi/6,math.pi/3,math.pi/2],[0,math.pi/12,math.pi/6],[0,.15,.30],[0,.175,.35]))
for step,p in enumerate(poses):
 pose(*p);parts=[]
 for o in meshes:
  v,tri=world(o);bounds=([min(x[i]for x in v)for i in range(3)],[max(x[i]for x in v)for i in range(3)]);parts.append((o,v,tri,BVHTree.FromPolygons(v,tri,all_triangles=True),bounds))
 for a,b in itertools.combinations(parts,2):
  if any(a[4][1][i]<b[4][0][i]-1e-7 or b[4][1][i]<a[4][0][i]-1e-7 for i in range(3)):continue
  cross=a[3].overlap(b[3])
  if cross:
   key=' | '.join([a[0].name,b[0].name]);r=pairs.setdefault(key,{'firstPose':list(p),'samples':0,'pairCount':0,'newPart':any(x[0].name.startswith('PUNCH_R1')for x in[a,b]),'parents':[a[0].parent.name,b[0].parent.name]});r['samples']+=1;r['pairCount']=max(r['pairCount'],len(cross))
report={'kind':'raw triangle contact discovery; not a clearance certificate','poses':len(poses),'pairs':pairs}
(ROOT/'docs/qa/punch-rebuild-r1/raw-contacts.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
