"""Reopen real editables, audit closed exported geometry and selected face attachment."""
import bpy,bmesh,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2];coverage=json.loads((ROOT/'docs/sculpt-20261024/coverage.json').read_text());results=[]
catalog='--original-catalog'in sys.argv
original_ids=[r['id']for r in coverage['rows']if r['edition']=='original']
ids=[a.split('=',1)[1]for a in sys.argv if a.startswith('--id=')]or (original_ids if catalog else [r['id']for r in coverage['rows']])
if catalog:
 assert set(ids)==set(original_ids),'refresh the complete shared original catalog'
 p=ROOT/'assets/blender/toy-racers.blend';bpy.ops.wm.open_mainfile(filepath=str(p))
 assert {o.name[4:]for o in bpy.data.objects if o.parent is None and o.name.startswith('toy_')}==set(original_ids)
 for collection in bpy.data.collections:collection.hide_viewport=False
 for ob in bpy.data.objects:ob.hide_set(False)
for id in ids:
 if not catalog:p=ROOT/'tmp/sculpt-stage'/(id+'.blend');bpy.ops.wm.open_mainfile(filepath=str(p))
 root=bpy.data.objects['toy_'+id];edit=bpy.data.objects['EDIT-'+id];game=[o for o in root.children if o.type=='MESH'];rig=next(o for o in root.children if o.type=='ARMATURE')
 if not catalog:assert set(o.name for o in bpy.data.objects if o.parent is None)=={'toy_'+id,'EDIT-'+id},id+' no unrelated old source objects'
 assert len(edit.children)>=3,id+' edit parts';assert len(rig.animation_data.nla_tracks)==5,id+' clips';boundary=loose=0
 for ob in game:
  bm=bmesh.new();bm.from_mesh(ob.data);boundary+=sum(e.is_boundary for e in bm.edges);loose+=sum(e.is_wire for e in bm.edges);bm.free()
 # Independent attachment probes on every named facial feature. These complement
 # actual front/side/back review, not a claim that a distance test proves beauty.
 deps=bpy.context.evaluated_depsgraph_get();hosts=[]
 for ob in edit.children:
  if any(t in ob.name for t in ['head','body','face','cranium','cheek','muzzle','envelope','torso','peel','mass','bird','shell','cloud','turret','mask','void','bottle','cookie','tail','flame','windscreen'] ) and not any(t in ob.name for t in ['mouth','smile','beard','hat','cap','prop']):
   hosts.append((ob,BVHTree.FromObject(ob,deps)))
 attachment=[]
 for ob in edit.children:
  is_eye='eye-white' in ob.name or 'side-eye-white'in ob.name
  is_mouth=any(t in ob.name for t in ['smile','mouth','frown','grin','small-gasp']) and not any(t in ob.name for t in ['moustache','cutter'])
  if not(is_eye or is_mouth) or not hosts:continue
  distances=[]
  for v in ob.data.vertices:
   nearest=[tree.find_nearest(v.co)[3]for host,tree in hosts if host!=ob];nearest=[d for d in nearest if d is not None]
   if nearest:distances.append(min(nearest))
  if distances:attachment.append({'part':ob.name,'kind':'eye'if is_eye else'mouth','nearestGap':min(distances),'furthestGap':max(distances),'sampleCount':len(distances)})
 row={'id':id,'editableParts':len(edit.children),'gameMeshes':len(game),'bones':len(rig.data.bones),'boundaryEdges':boundary,'looseEdges':loose,'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'reopened':True,'faceAttachmentProbes':attachment}
 # Record actual complete mouth tube vertices projected onto its new host.
 selected={'banana':('banana-smile','curved-banana-peel'),'leaf-revolutionary':('seated-smile','unified-face')}
 if id in selected:
  mouth_tag,host_tag=selected[id];mouth=next(o for o in edit.children if mouth_tag in o.name);host=next(o for o in edit.children if host_tag in o.name)
  deps=bpy.context.evaluated_depsgraph_get();tree=BVHTree.FromObject(host,deps);gaps=[]
  for vertex in mouth.data.vertices:
   point=vertex.co;hit=tree.ray_cast(Vector((point.x,-2,point.z)),Vector((0,1,0)))
   assert hit[0] is not None,id+' mouth over host';gaps.append(hit[0].y-point.y)
  row['faceAttachment']={'mouthVertices':len(gaps),'minSurfaceGap':min(gaps),'maxSurfaceGap':max(gaps),'host':host.name,'mouth':mouth.name,'verticesGLTF':[[v.co.x,v.co.z,-v.co.y] for v in mouth.data.vertices]}
  assert max(gaps)>0 and max(gaps)<.012 and min(gaps)>-.012,id+' floating/buried mouth'
 if id=='switcharoo':
  h=next(o for o in edit.children if 'kangaroo-cheeks-snout' in o.name);nostrils=[o for o in edit.children if 'symmetric-nostril' in o.name];smile=next(o for o in edit.children if 'symmetric-kangaroo-smile' in o.name);centre=lambda o:(min(v.co.x for v in o.data.vertices)+max(v.co.x for v in o.data.vertices))/2;row['facialAlignment']={'headX':centre(h),'snoutX':centre(h),'smileX':centre(smile),'nostrilMidpointX':sum(centre(o)for o in nostrils)/len(nostrils),'nostrils':len(nostrils),'pairedEyes':len([o for o in edit.children if 'eye-white' in o.name])}
 results.append(row);print('AUDITED',id,'boundary',boundary,'loose',loose,flush=True)
 if boundary or loose:print('NEEDS_REPAIR',id,flush=True)
 if catalog:assert boundary==0 and loose==0,id+' exported source must remain closed'
audit_path=ROOT/'docs/sculpt-20261024/source-audit.json'
if catalog:
 audit=json.loads(audit_path.read_text());fresh={r['id']:r for r in results}
 assert len(audit['sources'])==len(coverage['rows'])
 for previous in audit['sources']:
  if previous['id']not in fresh:continue
  row=fresh[previous['id']];row.pop('sourceSha256')
  previous.update(row,source='assets/blender/toy-racers.blend',sourceSha256=hashlib.sha256(p.read_bytes()).hexdigest(),glb='public/models/toy-racers.glb',glbSha256=hashlib.sha256((ROOT/'public/models/toy-racers.glb').read_bytes()).hexdigest())
  # These records now attest the reopened catalog, not an old staging file.
  previous.pop('stageSourceSha256',None)
 audit['passed']=all(r['boundaryEdges']==0 and r['looseEdges']==0 for r in audit['sources'])
else:audit={'version':'authored-20261024','sources':results,'passed':all(r['boundaryEdges']==0 and r['looseEdges']==0 for r in results)}
audit_path.write_text(json.dumps(audit,indent=2))
