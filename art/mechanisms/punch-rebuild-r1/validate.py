"""Bounded new-geometry evidence. No actor/map or continuous motion certificate."""
import bpy,bmesh,json,math,itertools,hashlib
from pathlib import Path
from mathutils.kdtree import KDTree
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[3];ART=Path(__file__).resolve().parent;QA=ROOT/'docs/qa/punch-rebuild-r1'
def pose(p):
 a,h,e,s=p
 for n,v in [('PUNCH_BOOM_Z',a),('PUNCH_COUNTER_YAW',h-a)]:o=bpy.data.objects[n];o.rotation_mode='XYZ';o.rotation_euler=(0,0,v)
 for n in ['PUNCH_R1_TELESCOPE_1','PUNCH_R1_TELESCOPE_2']:bpy.data.objects[n].location.x=e/2
 bpy.data.objects['PUNCH_SLIDER_X'].location.x=.35+s;bpy.data.objects['PUNCH_SPRING'].data.shape_keys.key_blocks[1].value=s/.35;bpy.context.view_layer.update()
def frozen(o):
 x=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=x.to_mesh();m.calc_loop_triangles();v=[x.matrix_world@p.co for p in m.vertices];t=[tuple(p.vertices)for p in m.loop_triangles];x.to_mesh_clear();return v,t
poses=[(math.pi/3,math.pi/12,0,0)]+list(itertools.product([math.pi/6,math.pi/2],[0,math.pi/6],[0,.30],[0,.35]))
bpy.ops.wm.open_mainfile(filepath=str(ART/'punch-rebuild-r1.blend'))
closed={}
for o in bpy.data.objects:
 if o.type=='MESH' and o.name.startswith('PUNCH_R1'):
  e=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=e.to_mesh();bm=bmesh.new();bm.from_mesh(m)
  boundary=sum(not edge.is_manifold for edge in bm.edges);volume=bm.calc_volume();closed[o.name]={'nonManifoldEdges':boundary,'volume':volume};assert boundary==0 and volume>0;bm.free();e.to_mesh_clear()
# Rear stop is just tangent at zero; front stop is tangent at full 0.15 m stage travel.
# An out-of-domain overrun must penetrate a real stop, not merely a software clamp.
pose((math.pi/3,math.pi/12,.32,0));a=frozen(bpy.data.objects['PUNCH_R1_OUTER_FRONT_STOP']);b=frozen(bpy.data.objects['PUNCH_R1_MIDDLE_STOP_RING']);negative=BVHTree.FromPolygons(*a,all_triangles=True).overlap(BVHTree.FromPolygons(*b,all_triangles=True));assert negative
reference=[]
for p in poses:
 pose(p);reference.append({o.name:frozen(o)for o in bpy.data.objects if o.type=='MESH'})
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(ART/'punch-rebuild-r1.glb'))
errors=[];maxerr=0;triangles=0
for p,original in zip(poses,reference):
 pose(p)
 for name,(a,ta) in original.items():
  b,tb=frozen(bpy.data.objects[name]);assert len(ta)==len(tb),(name,len(ta),len(tb));triangles+=len(tb) if p==poses[0] else 0
  for source,target in [(a,b),(b,a)]:
   tree=KDTree(len(source))
   for i,v in enumerate(source):tree.insert(v,i)
   tree.balance();error=max(tree.find(v)[2]for v in target);maxerr=max(maxerr,error)
   if error>1e-5:errors.append({'part':name,'pose':p,'errorM':error})
assert not errors,errors
raw=json.loads((QA/'raw-contacts.json').read_text())
bonds=[['PUNCH_BOOM_END_SLEEVE','PUNCH_R1_INNER_TUBE'],['PUNCH_BOOM_HUB','PUNCH_R1_OUTER_TUBE'],['PUNCH_R1_INNER_STOP_RING','PUNCH_R1_INNER_TUBE'],['PUNCH_R1_MIDDLE_STOP_RING','PUNCH_R1_MIDDLE_TUBE'],['PUNCH_R1_OUTER_REAR_STOP','PUNCH_R1_OUTER_TUBE'],['PUNCH_R1_OUTER_FRONT_STOP','PUNCH_R1_OUTER_TUBE'],['PUNCH_R1_MIDDLE_REAR_STOP','PUNCH_R1_MIDDLE_TUBE'],['PUNCH_R1_MIDDLE_FRONT_STOP','PUNCH_R1_MIDDLE_TUBE']]
stops=[['PUNCH_R1_INNER_STOP_RING','PUNCH_R1_MIDDLE_REAR_STOP'],['PUNCH_R1_INNER_STOP_RING','PUNCH_R1_MIDDLE_FRONT_STOP'],['PUNCH_R1_MIDDLE_STOP_RING','PUNCH_R1_OUTER_REAR_STOP'],['PUNCH_R1_MIDDLE_STOP_RING','PUNCH_R1_OUTER_FRONT_STOP']]
allowed={frozenset(p) for p in bonds+stops};unexpected=[k for k,v in raw['pairs'].items() if v['newPart'] and frozenset(k.split(' | '))not in allowed];assert not unexpected,unexpected
out={'rig':'punch-rebuild-r1','productionApproved':False,'glbSHA256':hashlib.sha256((ART/'punch-rebuild-r1.glb').read_bytes()).hexdigest(),'finitePoseSamples':raw['poses'],'newPartUnexpectedSurfacePairs':unexpected,'fixedBondPairs':bonds,'nominalStopFaceContactPairs':stops,'inheritedAppearanceContacts':'Retained old same-body attachments and two morph-spring endpoint contacts are listed raw, not called zero intersections. No old collision certificate is relabeled.','newAuthoredSolids':closed,'nestedFit':{'perStageTravelM':[0,.15],'bodyMinimumCrossSectionGapM':.013,'guideMinimumGapM':.003,'minimumAxialOverlapM':.09,'scope':'Exact rectangular nominal cross-sections; rounded edges remove material. Fixed bond regions intentionally join parts. Stops share end planes only at domain endpoints.'},'negativeOverrun':{'totalReachM':.32,'nominalAxialPenetrationM':.01,'triangleContactPairs':len(negative),'rejectedByDriver':True},'coldRoundtrip':{'poses':len(poses),'maximumBidirectionalVertexErrorM':maxerr,'triangleCount':triangles,'errors':errors},'limits':['Surface sampling is not a continuous proof or full merged-solid containment audit','No actor, bystander, map, ready/interrupt, browser or mobile performance certification','No production device/event path is switched to this model']}
(QA/'validation.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k in ['finitePoseSamples','newPartUnexpectedSurfacePairs','negativeOverrun','coldRoundtrip']},indent=2))
