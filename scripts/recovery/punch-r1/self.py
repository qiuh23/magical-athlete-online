"""Finite actual runtime trajectories. Original bonded interfaces stay explicit."""
import bpy,json,itertools,hashlib
from pathlib import Path
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[3];QA=ROOT/'docs/qa/punch-r1-contact';ART=ROOT/'art/mechanisms/punch-rebuild-r1'
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(ART/'punch-rebuild-r1.glb'))
rows=json.loads((QA/'self-poses.json').read_text());raw=json.loads((ROOT/'docs/qa/punch-rebuild-r1/raw-contacts.json').read_text());validation=json.loads((ROOT/'docs/qa/punch-rebuild-r1/validation.json').read_text())
fixed={frozenset(k.split(' | '))for k,v in raw['pairs'].items()if v['parents'][0]==v['parents'][1]};fixed.update(frozenset(p)for p in validation['fixedBondPairs'])
stops={frozenset(p)for p in validation['nominalStopFaceContactPairs']}
spring={frozenset(['PUNCH_COUNTER_YAW__teal_fixed_batch','PUNCH_SPRING']),frozenset(['PUNCH_SLIDER_X__gold_fixed_batch','PUNCH_SPRING'])}
meshes=[o for o in bpy.data.objects if o.type=='MESH'];unexpected=[];allowed={};maxpairs=0
for i,r in enumerate(rows):
 p=r['pose'];
 for name,value in [('PUNCH_BOOM_Z',p['boomYaw']),('PUNCH_COUNTER_YAW',p['headYaw']-p['boomYaw'])]:
  o=bpy.data.objects[name];o.rotation_mode='XYZ';o.rotation_euler=(0,0,value)
 for name in ['PUNCH_R1_TELESCOPE_1','PUNCH_R1_TELESCOPE_2']:bpy.data.objects[name].location.x=p['reach']/2
 bpy.data.objects['PUNCH_SLIDER_X'].location.x=.35+p['stroke'];bpy.data.objects['PUNCH_SPRING'].data.shape_keys.key_blocks[1].value=p['stroke']/.35;bpy.context.view_layer.update();parts=[]
 for o in meshes:
  ob=o.evaluated_get(bpy.context.evaluated_depsgraph_get());m=ob.to_mesh();m.calc_loop_triangles();v=[ob.matrix_world@x.co for x in m.vertices];tri=[tuple(t.vertices)for t in m.loop_triangles];ob.to_mesh_clear();bounds=([min(x[a]for x in v)for a in range(3)],[max(x[a]for x in v)for a in range(3)]);parts.append((o.name,BVHTree.FromPolygons(v,tri,all_triangles=True),bounds))
 for a,b in itertools.combinations(parts,2):
  if any(a[2][1][k]<b[2][0][k]-1e-7 or b[2][1][k]<a[2][0][k]-1e-7 for k in range(3)):continue
  cross=a[1].overlap(b[1]);
  if not cross:continue
  pair=frozenset([a[0],b[0]]);kind='fixed-rigid-bond' if pair in fixed else 'spring-attachment' if pair in spring else 'nominal-stop-plane' if pair in stops and p['reach'] in [0,.30] else None
  if kind:allowed[' | '.join(sorted(pair))]=kind
  else:unexpected.append({'sample':i,'case':r,'pair':[a[0],b[0]],'count':len(cross)})
 if i%100==0: print('self',i,'unexpected',len(unexpected),flush=True)
out={'rigSHA256':hashlib.sha256((ART/'punch-rebuild-r1.glb').read_bytes()).hexdigest(),'samples':len(rows),'scope':'Eight actual normalized runtime paths, 101 poses each; surface crossing audit. New nested hollow solids additionally use exact section/overlap proof from mechanical checkpoint. No claim of exhaustive continuous/full merged-solid containment.','allowedInterfaces':allowed,'unexpected':unexpected}
(QA/'self-runtime.json').write_text(json.dumps(out,indent=2)+'\n');assert not unexpected,unexpected[:3];print('PASS',len(rows))
