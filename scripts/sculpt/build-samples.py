"""Authored replacement sample sculptures. Actual source references recorded per design.
Blender 4.3+, no game rules or maps touched. Stages individual originals for bundle assembly.
"""
import bpy,math,json,sys,bmesh
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parents[2]
base=ROOT/'scripts/generate-second-wind-models.py'
original_file=__file__;__file__=str(base)
exec(compile(base.read_text().split('models=[]; roots=[]; edit_roots=[]')[0].replace('(8,6)','(16,10)').replace('cv.resolution_u=3','cv.resolution_u=6').replace('cv.bevel_resolution=1','cv.bevel_resolution=2'),str(base),'exec'))
__file__=original_file
OUT=ROOT/'tmp/sculpt-stage';OUT.mkdir(parents=True,exist_ok=True)
# Common construction tools only; each silhouette below is individually authored.
def loft(color,rings,tag,sides=20):
 if any(word in tag for word in ['head','cranium','face']) and rings[-1][3]>.025 and rings[-1][4]>.025:
  x,y,z,rx,rz=rings[-1];rings=[*rings,(x,y+.022,z,rx*.6,rz*.6),(x,y+.038,z,.002,.002)]
 # Cubic interpolation gives a continuous authored silhouette rather than stacked ring corners.
 dense=[]
 for j in range(len(rings)-1):
  a=rings[max(0,j-1)];b=rings[j];c=rings[j+1];d=rings[min(len(rings)-1,j+2)]
  for k in range(3):
   t=k/3;v=[.5*(2*b[q]+(-a[q]+c[q])*t+(2*a[q]-5*b[q]+4*c[q]-d[q])*t*t+(-a[q]+3*b[q]-3*c[q]+d[q])*t*t*t)for q in range(5)];v[3]=max(.002,v[3]);v[4]=max(.002,v[4]);dense.append(v)
 dense.append(rings[-1]);rings=dense
 vs=[]
 for x,y,z,rx,rz in rings:
  for i in range(sides):
   a=i*2*math.pi/sides;vs.append((x+rx*math.cos(a),y,z+rz*math.sin(a)))
 fs=[tuple(reversed(range(sides)))]+[(j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i) for j in range(len(rings)-1)for i in range(sides)]+[tuple(range((len(rings)-1)*sides,len(rings)*sides))]
 mesh=bpy.data.meshes.new(tag);mesh.from_pydata(vs,[],fs);mesh.update();o=bpy.data.objects.new(tag,mesh);scene.collection.objects.link(o);return add(o,color,tag)
def union(objects,tag,voxel=.009,ratio=.4):
 select(objects);o=objects[0];bpy.context.view_layer.objects.active=o;bpy.ops.object.join();o.name='GEO-'+current['id']+'-'+tag
 m=o.modifiers.new('Continuous sculpt union','REMESH');m.mode='VOXEL';m.voxel_size=voxel;bpy.ops.object.modifier_apply(modifier=m.name)
 m=o.modifiers.new('Sculpt polish','SMOOTH');m.factor=.7;m.iterations=3;bpy.ops.object.modifier_apply(modifier=m.name)
 m=o.modifiers.new('Retopology budget','DECIMATE');m.ratio=ratio;bpy.ops.object.modifier_apply(modifier=m.name)
 for p in o.data.polygons:p.use_smooth=True
 return o
def front_at(host,x,y):
 from mathutils.bvhtree import BVHTree
 bpy.context.view_layer.update();tree=BVHTree.FromObject(host,bpy.context.evaluated_depsgraph_get());hit=tree.ray_cast(Vector((x,-2,y)),Vector((0,1,0)))
 if hit[0] is None:raise RuntimeError('No facial host at '+str((x,y)))
 return -hit[0].y
def eye(x,y,z,s=.03,pupilx=0,tilt=0):
 o=O('paper',(x,y,z),(s,s*1.15,s*.36),'eye-white');O('ink',(x+pupilx,y,z+s*.30),(s*.36,s*.60,s*.11),'eye-pupil');return o
def sole(x,z=.02,color='ink',w=.063,length=.10):
 loft(color,[(x,0,z,w*.75,length*.8),(x,.012,z,w,length),(x,.04,z+.008,w*.96,length*.97),(x,.075,z-.018,w*.67,length*.6)],'sculpted-shoe',16)
def coach():
 # Actual card: green lizard, white varsity jacket, red sleeves/cap, purple megaphone.
 for x in [-.095,.095]:sole(x,color='red')
 loft('green',[(0,.07,0,.11,.075),(0,.18,0,.14,.10),(0,.32,0,.14,.10),(0,.45,0,.12,.085)],'lizard-abdomen')
 loft('paper',[(0,.18,-.015,.165,.115),(0,.25,-.015,.172,.115),(0,.43,-.02,.148,.105),(0,.53,-.02,.17,.09),(0,.56,-.02,.10,.065)],'tailored-varsity-jacket')
 # open jacket front exposes ribbed green chest
 loft('green',[(0,.19,.103,.058,.016),(0,.4,.092,.058,.018),(0,.54,.045,.055,.04)],'open-jacket-chest',16)
 for y in [.23,.28,.33,.38]:L('olive',[(-.045,y,.121),(0,y-.005,.128),(.045,y,.121)],.005,'belly-fold')
 for d in [-1,1]:
  L('red',[(d*.14,.5,0),(d*.20,.43,.02),(d*.23,.45,.12)],.051,'raglan-sleeve')
  O('paper',(d*.235,.45,.125),(.048,.045,.027),'knit-cuff');O('green',(d*.234,.455,.148),(.043,.035,.035),'closed-hand')
  L('red',[(d*.08,.55,.055),(d*.045,.48,.108)],.018,'folded-collar')
 for y in [.25,.34,.43]:O('red',(-.085,y,.105),(.012,.012,.007),'jacket-button')
 L('green',[(0,.23,-.08),(0,.15,-.18),(-.11,.10,-.22),(-.17,.13,-.17)],.043,'curled-tail',taper=[1.6,1.2,.7,.1])
 h=loft('green',[(0,.5,0,.08,.07),(0,.58,0,.12,.10),(-.015,.68,0,.145,.12),(-.015,.77,-.015,.12,.10),(-.015,.81,-.015,.075,.06)],'lizard-head')
 sn=O('green',(.025,.675,.13),(.155,.069,.14),'long-lizard-snout');union([h,sn],'integrated-head-snout',.009,.38)
 for x in [-.055,.035]:eye(x,.758,.087,.032,pupilx=.005)
 for x in [-.035,.065]:O('ink',(x,.707,.232),(.009,.005,.008),'nostril')
 L('ink',[(-.09,.639,.164),(0,.621,.225),(.11,.643,.192)],.005,'lizard-grin')
 for x in [-.045,0,.045]:B('paper',(x,.633,.211),(.034,.024,.009),'grin-tooth')
 loft('red',[(-.015,.787,-.02,.135,.11),(-.015,.82,-.025,.13,.108),(-.02,.866,-.03,.10,.087),(-.025,.883,-.035,.035,.035)],'soft-baseball-cap')
 O('red',(.035,.80,.12),(.14,.017,.09),'curved-visor')
 # One low-volume megaphone held by right hand, not a detached giant accessory.
 K('violet',(.235,.51,.18),.025,.078,.14,'megaphone',rot=(math.pi/2,0,0))
 O('ink',(.235,.51,.252),(.055,.055,.004),'megaphone-interior');L('violet',[(.235,.48,.16),(.235,.445,.17),(.235,.45,.20)],.012,'megaphone-handle')
 return 'Publisher card p22 viewed: green lizard, white/red varsity jacket, red cap, purple megaphone. Back tailoring/tail pose inferred.'
def hare():
 # Actual card: sky-blue rabbit, very long swept ears, red nose, protruding incisors.
 for x in [-.11,.11]:sole(x,z=.06,color='aqua',w=.075,length=.13)
 h=loft('aqua',[(0,.045,0,.10,.09),(0,.15,-.01,.16,.12),(0,.3,-.015,.18,.135),(0,.45,0,.15,.11),(0,.56,.005,.105,.09),(0,.69,0,.14,.105),(0,.77,-.005,.11,.085),(0,.79,-.005,.04,.035)],'continuous-rabbit-body',24)
 sn=O('aqua',(0,.64,.09),(.14,.075,.10),'rabbit-muzzle');union([h,sn],'rabbit-cheeks-body',.01,.32)
 for d in [-1,1]:
  ear=loft('aqua',[(d*.065,.745,-.01,.055,.038),(d*.10,.84,-.045,.057,.035),(d*.16,.95,-.075,.05,.03),(d*.22,1.03,-.10,.035,.023),(d*.255,1.045,-.10,.006,.005)],'swept-ear',16)
  L('blue',[(d*.075,.79,.015),(d*.12,.89,-.015),(d*.205,1.005,-.065)],.012,'ear-fold',taper=[.4,1,.1])
  L('aqua',[(d*.115,.46,.02),(d*.19,.40,.05),(d*.15,.38,.14)],.036,'bent-paw-arm');O('aqua',(d*.15,.38,.14),(.045,.04,.036),'paw')
  for yy in [.365,.387]:L('blue',[(d*.158,yy,.17),(d*.181,yy,.16)],.0035,'paw-fold')
 eye(-.047,.72,.09,.033);eye(.047,.72,.09,.033)
 O('red',(0,.66,.188),(.036,.027,.025),'red-nose');L('ink',[(-.065,.61,.15),(0,.595,.18),(.065,.61,.15)],.0045,'rabbit-mouth')
 for x in [-.017,.017]:B('paper',(x,.577,.177),(.027,.05,.018),'incisor')
 O('aqua',(0,.23,-.13),(.085,.09,.085),'rounded-tail')
 return 'Publisher card p23 viewed: sky-blue rabbit, swept long ears, red nose and incisors. Legs, back and tucked paws inferred.'
def gunk():
 # Melted goo with asymmetrical drooping face, not a circular badge of spheres.
 rings=[]
 for j,(y,rx,rz,cx) in enumerate([(0,.255,.20,0),(.026,.29,.23,0),(.055,.24,.20,0),(.11,.15,.13,0),(.20,.13,.11,.015),(.35,.115,.10,.045),(.49,.12,.10,.07),(.58,.095,.082,.09),(.62,.035,.04,.10)]):rings.append((cx,y,0,rx,rz))
 body=loft('olive',rings,'melted-asymmetric-core',32)
 # Sculpt broad liquid lobes as one continuous mass.
 lobes=[body]
 for i in range(7):
  a=i*2*math.pi/7;lobes.append(O('olive',(math.cos(a)*.22,.04,math.sin(a)*.18),(.09,.04,.075),'liquid-edge'))
 nose=L('olive',[(.06,.49,.07),(.02,.39,.15),(-.015,.26,.155),(-.045,.24,.13)],.044,'long-drooping-nose',taper=[1.3,1.1,.9,.25]);lobes.append(nose)
 union(lobes,'continuous-slime-puddle',.009,.25)
 eye(.03,.535,.107,.023,pupilx=.007);eye(.092,.54,.105,.024,pupilx=.007)
 L('olive',[(.003,.556,.107),(.029,.55,.116),(.05,.558,.107)],.009,'sleepy-left-lid')
 L('olive',[(.069,.56,.105),(.091,.556,.115),(.114,.56,.105)],.009,'sleepy-right-lid')
 L('ink',[(.07,.40,.093),(.092,.37,.095),(.11,.395,.075)],.004,'slack-smile');O('red',(.096,.365,.094),(.013,.021,.007),'small-tongue')
 for x,z in [(-.16,.09),(.19,.015),(-.10,-.08)]:O('green',(x,.063,z),(.025,.012,.022),'slime-bubble')
 return 'Publisher card p23 viewed: olive dripping goo, drooping elongated nose, drowsy eyes and pooled base. Free-standing rear is a project interpretation.'
def copycat():
 # Two blue cat individuals, staggered rather than identical capsules.
 for k,d in enumerate([-1,1]):
  x=d*.14;dy=.06 if k==0 else 0
  for dx in [-.05,.05]:sole(x+dx,color='blue',w=.038,length=.064)
  loft('blue',[(x,.055,0,.08,.065),(x,.16,0,.11,.085),(x,.32+dy,0,.10,.075),(x,.43+dy,0,.085,.067),(x,.47+dy,0,.075,.06)],'cat-torso-'+str(k),16)
  h=loft('blue',[(x,.43+dy,0,.07,.055),(x,.47+dy,.005,.115,.075),(x,.54+dy,0,.12,.085),(x,.64+dy,0,.10,.07),(x,.67+dy,0,.065,.045)],'cat-head-'+str(k),20)
  for dd in [-1,1]:
   ear=loft('blue',[(x+dd*.075,.62+dy,-.005,.047,.035),(x+dd*.094,.70+dy,-.01,.033,.022),(x+dd*.108,.74+dy,-.015,.004,.004)],'cat-ear',12)
   L('ink',[(x+dd*.083,.65+dy,.025),(x+dd*.10,.706+dy,.006)],.006,'ear-inset')
   eye(x+dd*.045,.575+dy,.075,.024,pupilx=.004)
  O('paper',(x,.515+dy,.072),(.061,.032,.025),'muzzle');O('ink',(x,.537+dy,.097),(.014,.011,.009),'nose')
  L('ink',[(x-.035,.508+dy,.093),(x,.497+dy,.10),(x+.035,.508+dy,.093)],.0035,'cat-smirk')
  for dd in [-1,1]:
   for yy in [.512,.53]:L('ink',[(x+dd*.055,yy+dy,.08),(x+dd*.10,yy+dy+.005,.057)],.0025,'cheek-stripe')
  # White collar and yellow/purple striped tie distinguish clothed torsos.
  for dd in [-1,1]:L('paper',[(x+dd*.055,.44+dy,.055),(x+dd*.025,.408+dy,.078)],.016,'shirt-collar')
  loft('yellow',[(x,.27+dy,.086,.016,.006),(x,.30+dy,.085,.025,.008),(x,.41+dy,.073,.012,.007)],'tie',8)
  for yy in [.31,.35,.39]:L('violet',[(x-.016,yy+dy,.094),(x+.015,yy+dy-.012,.094)],.006,'tie-stripe')
  L('blue',[(x+d*.07,.34,0),(x+d*.12,.28,.015),(x+d*.12,.24,.065)],.023,'outer-arm')
  L('blue',[(x,.17,-.06),(x+d*.10,.20,-.13),(x+d*.115,.34,-.10)],.022,'curled-cat-tail',taper=[1.2,1,.15])
 return 'Publisher card p22 viewed: two blue cats with white collars and yellow/purple ties. Staggered heights and complete backs/tails are project sculpt interpretation.'
BUILDERS={'coach':coach,'hare':hare,'gunk':gunk,'copycat':copycat}
exec(compile((ROOT/'scripts/sculpt/design-samples-extra.py').read_text(),str(ROOT/'scripts/sculpt/design-samples-extra.py'),'exec'))
exec(compile((ROOT/'scripts/sculpt/design-originals.py').read_text(),str(ROOT/'scripts/sculpt/design-originals.py'),'exec'))
exec(compile((ROOT/'scripts/sculpt/design-second-wind.py').read_text(),str(ROOT/'scripts/sculpt/design-second-wind.py'),'exec'))
exec(compile((ROOT/'scripts/sculpt/design-extra-mile.py').read_text(),str(ROOT/'scripts/sculpt/design-extra-mile.py'),'exec'))
exec(compile((ROOT/'scripts/sculpt/design-leaf.py').read_text(),str(ROOT/'scripts/sculpt/design-leaf.py'),'exec'))
exec(compile((ROOT/'scripts/sculpt/design-wurstii.py').read_text(),str(ROOT/'scripts/sculpt/design-wurstii.py'),'exec'))
ids=[a.split('=',1)[1]for a in sys.argv if a.startswith('--id=')] or list(BUILDERS)
for id in ids:
 for old in list(bpy.data.objects):bpy.data.objects.remove(old,do_unlink=True)
 for act in list(bpy.data.actions):bpy.data.actions.remove(act)
 root=bpy.data.objects.new('EDIT-'+id,None);scene.collection.objects.link(root);current={'id':id,'root':root}
 reference=BUILDERS[id]()
 # Match each previous relative stature; don't equalize all characters.
 baseline=json.loads((ROOT/'docs/sculpt-20261024/coverage.json').read_text());row=next(r for r in baseline['rows']if r['id']==id);height=row['baseline']['bounds']['size'][1]
 bpy.context.view_layer.update();points=[o.matrix_world@Vector(v)for o in root.children for v in o.bound_box];lo=Vector([min(v[k]for v in points)for k in range(3)]);hi=Vector([max(v[k]for v in points)for k in range(3)]);dim=hi-lo;factor=min(height/dim.z,.59/dim.x,.59/dim.y);matrix=Matrix.Diagonal((factor,factor,factor,1))@Matrix.Translation(Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z)))
 for o in root.children:o.data.transform(matrix)
 # Preserve fine facial/accessory features when producing the economy tier.
 wheel_counter=0
 for ob in root.children:
  if ob.type=='MESH':
   at=ob.data.attributes.get('sculpt_detail') or ob.data.attributes.new('sculpt_detail','FLOAT','POINT')
   important=any(t in ob.name for t in ['eye','pupil','tooth','teeth','smile','mouth','whisker','nostril','nose','flower','spectacle'])
   for v in at.data:v.value=1.0 if important else 0.0
   rigid=ob.data.attributes.get('sculpt_rigid') or ob.data.attributes.new('sculpt_rigid','FLOAT','POINT')
   is_prop=any(t in ob.name for t in ['staff','rapier','sword','wand','megaphone','calculator','held-','fake-wheel','conjured-die','stirring-rod','mirror','shovel','sceptre','recliner','tree-trunk','hanging-branch','portal-rim'])
   for v in rigid.data:v.value=1.0 if is_prop else 0.0
   tag=ob.name.removeprefix('GEO-'+id+'-');wheel=0
   if id=='speed-demon' and ('motorcycle-tire' in tag or 'motorcycle-spoke' in tag):wheel=1 if sum(v.co.y for v in ob.data.vertices)/len(ob.data.vertices)<0 else 2
   elif id=='third-wheel' and ('wheel-tire' in tag or 'wheel-spoke' in tag or 'wheel-hub' in tag):wheel=1
   elif id=='show-off' and 'skate-wheel' in tag:wheel_counter+=1;wheel=wheel_counter
   elif id=='leaf-race-car' and 'car-wheel-' in tag:
    cx=sum(v.co.x for v in ob.data.vertices)/len(ob.data.vertices);cy=sum(v.co.y for v in ob.data.vertices)/len(ob.data.vertices);wheel=1+(1 if cx>0 else 0)+(2 if cy>0 else 0)
   attr=ob.data.attributes.get('sculpt_wheel')or ob.data.attributes.new('sculpt_wheel','FLOAT','POINT')
   for v in attr.data:v.value=float(wheel)
 game=merge_game(root,id);game['edition']=row['edition']
 total=sum(sum(len(p.vertices)-2 for p in ob.data.polygons)for ob in game.children if ob.type=='MESH')
 limit=9300 if row['edition']=='original'else 7800
 if total>limit:
  for ob in game.children:
   if ob.type=='MESH':
    bpy.context.view_layer.objects.active=ob;mod=ob.modifiers.new('Per-character mobile export cap','DECIMATE');mod.ratio=limit/total;bpy.ops.object.modifier_apply(modifier=mod.name)
 if row['edition']=='wurstii':
  meshes=[o for o in game.children if o.type=='MESH'];palette=bpy.data.materials.new('sculpt_vertex_palette');palette.use_nodes=True
  bsdf=palette.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(1,1,1,1);bsdf.inputs['Roughness'].default_value=.74
  color_node=palette.node_tree.nodes.new('ShaderNodeVertexColor');color_node.layer_name='SculptColor';palette.node_tree.links.new(color_node.outputs['Color'],bsdf.inputs['Base Color'])
  for ob in meshes:
   c=ob.data.materials[0].node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value[:];attr=ob.data.color_attributes.new(name='SculptColor',type='FLOAT_COLOR',domain='CORNER')
   for value in attr.data:value.color=c
   ob.data.materials.clear();ob.data.materials.append(palette)
  select(meshes);bpy.context.view_layer.objects.active=meshes[0];bpy.ops.object.join();bpy.context.object.parent=game;bpy.context.object.name=id+'_vertex_sculpt'
 for mat in MATS.values():
  bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.74;bs.inputs['Coat Weight'].default_value=.025
 motion={'__file__':str(ROOT/'scripts/refine-racer-motion.py'),'__name__':'racer_motion'};exec(compile(Path(motion['__file__']).read_text(),motion['__file__'],'exec'),motion);motion['LONG'].add('wurstii-magikarp')
 for value in ['speed-demon','show-off','leaf-race-car']:motion['WHEEL'].add(value)
 for value in ['leaf-dark-horse','leaf-lonely-wolf','wurstii-frogger']:motion['QUAD'].add(value)
 for value in ['leaf-catfish','leaf-loan-shark','leaf-spiteful-spirit','leaf-triangle-man','extra-mile-snake-eyes','extra-mile-whisper','extra-mile-oddball','extra-mile-shuffler','wurstii-bullet-bill','wurstii-piranha-plant','wurstii-fluffin-puffins']:motion['LONG'].add(value)
 for value in ['nemesis','soulmate']:motion['FLOAT'].discard(value)
 motion['FLOAT'].discard('mush');motion['LONG'].add('mush')
 if row['edition']=='original':
  for key in ['FLOAT','LONG','WHEEL','QUAD']:motion[key].discard(id)
  for key,values in {'FLOAT':['blimp','mastermind'],'LONG':['banana','gunk','flip-flop','hypnotist','inchworm','lovable-loser','stickler','suckerfish'],'WHEEL':['third-wheel'],'QUAD':['centaur','leaptoad','scoocher']}.items():
   if id in values:motion[key].add(id)
 arm=motion['rig'](game,id,id+'-' if row['edition']=='original' else '');joint={'__file__':str(ROOT/'scripts/sculpt/articulate.py')};exec(compile(Path(joint['__file__']).read_text(),joint['__file__'],'exec'),joint);joint['articulate'](game,arm,id,id+'-' if row['edition']=='original' else '')
 # Rigid held accessories must follow the same hand/body transform, not
 # bend at the generic head-height weighting boundary.
 for ob in game.children:
  if ob.type=='MESH' and ob.data.attributes.get('sculpt_rigid'):
   attr=ob.data.attributes['sculpt_rigid'];indices=[v.index for v in ob.data.vertices if attr.data[v.index].value>.5]
   for vg in ob.vertex_groups:vg.remove(indices)
   bone=id+('_arm_R' if id=='coach' else '_body')
   if indices:ob.vertex_groups[bone].add(indices,1,'REPLACE')
 if id=='leaf-revolutionary':
  for ob in game.children:
   if ob.type=='MESH' and 'brown' in ob.name:
    for vg in ob.vertex_groups:vg.remove(list(range(len(ob.data.vertices))))
    ob.vertex_groups[id+'_body'].add(list(range(len(ob.data.vertices))),1,'REPLACE')
 select([game,*game.children]);params=dict(filepath=str(OUT/(id+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_frame_range=False,export_force_sampling=False,export_extras=True,export_skins=True,export_texcoords=False)
 allowed=bpy.ops.export_scene.gltf.get_rna_type().properties.keys();bpy.ops.export_scene.gltf(**{k:v for k,v in params.items()if k in allowed})
 for o in [root,*root.children]:o.hide_render=True;o.hide_set(True)
 for datablocks in [bpy.data.meshes,bpy.data.curves,bpy.data.armatures]:
  for item in list(datablocks):
   if item.users==0:datablocks.remove(item)
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(id+'.blend')),compress=True)
 (OUT/(id+'.json')).write_text(json.dumps({'id':id,'generator':'Blender '+bpy.app.version_string,'sourceReference':reference,'status':'sculpted-pending-visual-qa'},indent=2))
 print('STAGED',id,flush=True)
