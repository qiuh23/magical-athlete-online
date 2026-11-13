"""New r1 mechanism, not a reconstruction of the lost adjustable-v1 asset.
Source appearance is the published outboard rig. Root and working-head meshes
remain unchanged; one boom link is replaced by three genuinely hollow stages.
A fixed pillar cap is lowered 20 mm below a coplanar bracket top to remove z-fighting.
"""
import bpy,json,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
SOURCE=ROOT/'public/models/mechanisms/punch_outboard_joint.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
for o in bpy.data.objects:
 o.animation_data_clear()
 if o.type=='MESH' and o.data.shape_keys:
  o.data.shape_keys.animation_data_clear()
  for k in o.data.shape_keys.key_blocks[1:]:k.value=0
for name in ['PUNCH_BOOM_Z','PUNCH_COUNTER_YAW']:
 o=bpy.data.objects[name];o.rotation_mode='XYZ';o.rotation_euler=(0,0,0)
bpy.data.objects['PUNCH_SLIDER_X'].location.x=.35
# The published fixed column cap and bracket top are coplanar (world Z=.26).
# Lower only the column's top ring/cap to .24, inside the welded bracket volume.
# No action joint, mount, foot, or outside bracket surface is moved.
bpy.context.view_layer.update()
fixed=bpy.data.objects['PUNCH_ROOT__teal_fixed_batch']; lowered=[]
for v in fixed.data.vertices:
 p=fixed.matrix_world@v.co
 if abs(p.z-.26)<1e-5 and p.y < -1.5:
  v.co.z-=.02;lowered.append(v.index)
assert len(lowered)==72, f'Unexpected fixed-cap split source topology: {len(lowered)}'
assert len({tuple(round(c,6) for c in fixed.data.vertices[i].co) for i in lowered})==24
fixed['r1FixedCapRepair']='Source cap Z .26 -> .24 m; bracket top remains .26; welded support only'
boom=bpy.data.objects['PUNCH_BOOM_Z'];counter=bpy.data.objects['PUNCH_COUNTER_YAW'];sleeve=bpy.data.objects['PUNCH_BOOM_END_SLEEVE']
old=bpy.data.objects['PUNCH_BOOM_LINK'];material=old.data.materials[0];bpy.data.objects.remove(old,do_unlink=True)
def empty(name,parent):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;return o
s1=empty('PUNCH_R1_TELESCOPE_1',boom);s2=empty('PUNCH_R1_TELESCOPE_2',s1)
counter.parent=s2;sleeve.parent=s2
# Source local transform is deliberately unchanged when reach=0.
def tube(name,parent,a,b,width,height,wall):
 vertices=[]
 for x in [a,b]:
  for w,h in [(width/2,height/2),(width/2-wall,height/2-wall)]:
   vertices.extend([(x,-w,.11-h),(x,w,.11-h),(x,w,.11+h),(x,-w,.11+h)])
 faces=[]
 for i in range(4):
  j=(i+1)%4
  faces.extend([(i,j,8+j,8+i),(4+j,4+i,12+i,12+j),(j,i,4+i,4+j),(8+i,8+j,12+j,12+i)])
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.parent=parent;mesh.materials.append(material)
 bpy.context.view_layer.objects.active=o;o.select_set(True)
 bevel=o.modifiers.new('Editable edge bevel','BEVEL');bevel.width=.0015;bevel.segments=2
 # Keep editable modifier in Blend, export the evaluated surface.
 o['authoredSolid']=True;o['rigVersion']='punch-rebuild-r1';o.select_set(False)
 return o
tube('PUNCH_R1_OUTER_TUBE',boom,.02,.50,.20,.18,.012)
tube('PUNCH_R1_MIDDLE_TUBE',s1,.24,.64,.15,.13,.010)
tube('PUNCH_R1_INNER_TUBE',s2,.40,.71,.10,.08,.008)
# Internal guide throats and rear stop rings: no solid rods swallowed by solids.
# At each stage's 0 / .15 m endpoints, stop-ring faces meet the fixed throat;
# intermediate travel retains at least 3 mm clearance at the apertures.
tube('PUNCH_R1_OUTER_REAR_STOP',boom,.23,.24,.176,.156,.010)
tube('PUNCH_R1_OUTER_FRONT_STOP',boom,.40,.415,.176,.156,.010)
tube('PUNCH_R1_MIDDLE_STOP_RING',s1,.24,.25,.170,.150,.012)
tube('PUNCH_R1_MIDDLE_REAR_STOP',s1,.39,.40,.130,.110,.012)
tube('PUNCH_R1_MIDDLE_FRONT_STOP',s1,.56,.575,.130,.110,.012)
tube('PUNCH_R1_INNER_STOP_RING',s2,.40,.41,.124,.104,.014)
def pose(boom_yaw,head_yaw,reach,stroke):
 boom.rotation_euler.z=boom_yaw;counter.rotation_euler.z=head_yaw-boom_yaw;s1.location.x=reach/2;s2.location.x=reach/2
 bpy.data.objects['PUNCH_SLIDER_X'].location.x=.35+stroke
 spring=bpy.data.objects['PUNCH_SPRING'];spring.data.shape_keys.key_blocks[1].value=stroke/.35
 bpy.context.view_layer.update()
pose(math.pi/3,math.pi/12,0,0)
bpy.context.scene['rigVersion']='punch-rebuild-r1'
bpy.context.scene['productionApproved']=False
bpy.context.scene['sourceSHA256']=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'punch-rebuild-r1.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'punch-rebuild-r1.glb'),export_format='GLB',export_animations=False,export_apply=True,export_extras=True,export_yup=True)
contract={'rig':'punch-rebuild-r1','productionApproved':False,'source':str(SOURCE.relative_to(ROOT)),'sourceSHA256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'coordinateSystem':'GLB Three Y-up; Blender Z-up; [x,z,-y]','root':'PUNCH_ROOT','rootPolicy':'Never move/scale root as part of any action','fixedSupportRepair':{'part':'PUNCH_ROOT__teal_fixed_batch','change':'72 split vertices / 24 unique original pillar cap positions Z .26 -> .24; bracket top remains .26','reason':'Remove inherited coplanar cap/bracket surface artifact; preserves bonded support'},'joints':{'PUNCH_BOOM_Z':'local Three Y = boomYaw','PUNCH_COUNTER_YAW':'local Three Y = headYaw-boomYaw','PUNCH_R1_TELESCOPE_1':'local X=reach/2','PUNCH_R1_TELESCOPE_2':'local X=reach/2','PUNCH_SLIDER_X':'local X=.35+stroke','PUNCH_SPRING':'morph[0]=stroke/.35'},'proposedDomain':{'boomYaw':[math.pi/6,math.pi/2],'headYaw':[0,math.pi/6],'reachM':[0,.30],'strokeM':[0,.35]},'park':{'boomYaw':math.pi/3,'headYaw':math.pi/12,'reach':0,'stroke':0},'phasePolicy':'Any boom/head/telescope change requires stroke=0. Any boom/head aiming additionally requires reach=0. Retract stroke before changing aim. No shortest-angle choice or root chasing. Game contact remains disabled.','geometry':{'outer':[.02,.50,.20,.18,.012],'middle':[.24,.64,.15,.13,.010],'inner':[.40,.71,.10,.08,.008],'stageDisplacement':'each reach/2','minAxialOverlapM':.09,'minCrossSectionGapM':.013,'guideApertureGapM':.003,'stageStopsM':[0,.15]},'missingOriginalCapabilities':['No recovered adjustable-v1 source or 31-plan data','No height adjustment','No all-angle 360-degree workspace','No runtime contact/controller integration','No actor/map collision certificate']}
(OUT/'contract.json').write_text(json.dumps(contract,indent=2)+'\n')
print('Rebuild written',OUT)
