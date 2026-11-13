"""Actual evaluated closed-mesh sections, then continuous interval fit bounds.
Only the nine new authored solids are covered, not the legacy assembly.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[3];ART=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ART/'punch-rebuild-r1.blend'))
def hits(tree,origin,direction):
 out=[];pos=origin.copy()
 for _ in range(12):
  p,n,i,d=tree.ray_cast(pos,direction,10)
  if p is None:break
  out.append(p);pos=p+direction*1e-6
 return out
sections={}
for o in bpy.data.objects:
 if o.type!='MESH' or not o.name.startswith('PUNCH_R1'):continue
 e=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=e.to_mesh();m.calc_loop_triangles();v=[p.co.copy()for p in m.vertices];t=[tuple(f.vertices)for f in m.loop_triangles];e.to_mesh_clear();tree=BVHTree.FromPolygons(v,t,all_triangles=True)
 lo=[min(p[i]for p in v)for i in range(3)];hi=[max(p[i]for p in v)for i in range(3)];mid=[(a+b)/2 for a,b in zip(lo,hi)]
 y=[p.y for p in hits(tree,Vector((mid[0],lo[1]-1,mid[2])),Vector((0,1,0)))];z=[p.z for p in hits(tree,Vector((mid[0],mid[1],lo[2]-1)),Vector((0,0,1)))];assert len(y)==4 and len(z)==4,(o.name,y,z)
 for axis in [y,z]:assert axis[0]<axis[1]<axis[2]<axis[3]
 # Four crossings imply outside -> wall -> empty cavity -> wall -> outside.
 sections[o.name]={'x':[lo[0],hi[0]],'yCrossings':y,'zCrossings':z,'outerWidth':y[3]-y[0],'innerWidth':y[2]-y[1],'outerHeight':z[3]-z[0],'innerHeight':z[2]-z[1],'wallY':[y[1]-y[0],y[3]-y[2]],'wallZ':[z[1]-z[0],z[3]-z[2]],'cavityConfirmed':True}
def gap(a,b):return min((a['innerWidth']-b['outerWidth'])/2,(a['innerHeight']-b['outerHeight'])/2)
def s(name):return sections['PUNCH_R1_'+name]
pairs=[]
for outer,inner,ring,front,rear in [('OUTER_TUBE','MIDDLE_TUBE','MIDDLE_STOP_RING','OUTER_FRONT_STOP','OUTER_REAR_STOP'),('MIDDLE_TUBE','INNER_TUBE','INNER_STOP_RING','MIDDLE_FRONT_STOP','MIDDLE_REAR_STOP')]:
 a,b,r,f,k=[s(n)for n in[outer,inner,ring,front,rear]]
 body=gap(a,b);guide=gap(f,b);rearGuide=gap(k,b);ringGap=gap(a,r);stopShoulder=min((r['outerWidth']-f['innerWidth'])/2,(r['outerHeight']-f['innerHeight'])/2)
 overlap=min(min(a['x'][1],b['x'][1]+d)-max(a['x'][0],b['x'][0]+d)for d in[0,.15])
 # Relative stages translate along X only. These linear extrema cover all d in [0,.15].
 rearContact=r['x'][0]-k['x'][1];frontContact=f['x'][0]-(r['x'][1]+.15)
 assert min(body,guide,rearGuide,ringGap)>0.00299
 assert overlap>.08999 and stopShoulder>0
 assert abs(rearContact)<2e-6 and abs(frontContact)<2e-6
 pairs.append({'outer':outer,'moving':inner,'bodyGapM':body,'guideGapM':min(guide,rearGuide),'movingStopToCavityGapM':ringGap,'axialOverlapMinimumM':overlap,'stopShoulderM':stopShoulder,'rearContactSeparationM':rearContact,'frontContactSeparationM':frontContact,'relativeTravelM':[0,.15]})
report={'rig':'punch-rebuild-r1','method':'Four actual BVH ray intersections along both cross-section axes of each evaluated beveled closed mesh; measured cavity/outer boundaries and linear axial interval extrema. No filled-box proxy or only surface-overlap claim.','newSolids':sections,'fits':pairs,'newMovingMaterialContainmentExcluded':True,'scope':'Only telescopic bodies, guide throats and stop rings. Rigid bonded mounting interfaces and original head/support assembly not certified here. Bodies share orientation; relative translation is only X. Beveling removes rather than adds cross-section material. Endpoint stop planes deliberately touch; motion beyond the endpoints is invalid.','productionApproved':False}
(ROOT/'docs/qa/punch-rebuild-r1/section-clearance.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'solids':len(sections),'fits':pairs},indent=2))
