"""Additional local joints matching specific sculpt anatomy; no root translation or game tilt."""
import bpy,math
from mathutils import Vector

def articulate(game,arm,id,prefix):
 meshes=[o for o in game.children if o.type=='MESH'];pts=[v.co for o in meshes for v in o.data.vertices];height=max(v.z for v in pts);width=max(v.x for v in pts)-min(v.x for v in pts)
 layout={};kind='arms'
 if id in ['speed-demon','third-wheel','show-off','leaf-race-car']:
  kind='wheels';wheel_points={}
  for mesh in meshes:
   attr=mesh.data.attributes.get('sculpt_wheel')
   if attr:
    for v in mesh.data.vertices:
     number=round(attr.data[v.index].value)
     if number>0:wheel_points.setdefault(number,[]).append(v.co.copy())
  for number,points in wheel_points.items():
   center=Vector([(min(p[k]for p in points)+max(p[k]for p in points))/2 for k in range(3)]);axis=Vector((0,.1,0))if id=='third-wheel'else Vector((.1,0,0));layout['wheel_'+str(number)]=(center,center+axis)
 elif id=='kraken':
  kind='tentacles'
  for i in range(8):
   a=i*math.pi/4;layout['tentacle_'+str(i)]=((math.cos(a)*.1,-math.sin(a)*.1,.15),(math.cos(a)*.26,-math.sin(a)*.20,.14))
 elif id=='hog-knight-hog':
  kind='quadruped'
  for side,x in [('L',-.13),('R',.13)]:
   for end,y in [('front',-.1),('back',.16)]:layout[end+'_'+side]=((x,y,.23),(x,y,.03))
 elif id in ['coach','hare','hog-knight','bite-mark','bite-mark-were']:
  for side,d in [('L',-1),('R',1)]:layout['arm_'+side]=((d*width*.22,0,height*.52),(d*width*.40,-.05,height*.40))
 else:return
 bpy.context.view_layer.objects.active=arm;bpy.ops.object.mode_set(mode='EDIT')
 for name,(head,tail)in layout.items():
  b=arm.data.edit_bones.new(id+'_'+name);b.head=head;b.tail=tail;b.parent=None if kind=='wheels' else arm.data.edit_bones[id+'_body']
 bpy.ops.object.mode_set(mode='OBJECT')
 for mesh in meshes:
  groups={name:mesh.vertex_groups.new(name=id+'_'+name)for name in layout}
  for v in mesh.data.vertices:
   x,y,z=v.co;name=None;weight=0
   if kind=='wheels':
    attr=mesh.data.attributes.get('sculpt_wheel');number=round(attr.data[v.index].value)if attr else 0
    if number>0:name='wheel_'+str(number);weight=1
    else:
     # Wheels and a rigid chassis must not inherit the biped leg sway.
     foot_weight=0
     for g in list(v.groups):
      if mesh.vertex_groups[g.group].name in [id+'_left',id+'_right']:
       foot_weight+=g.weight;mesh.vertex_groups[g.group].remove([v.index])
     if foot_weight:mesh.vertex_groups[id+'_body'].add([v.index],foot_weight,'ADD')
   elif kind=='tentacles':
    radius=math.hypot(x,y)
    if radius>.12 and z<height*.72:name='tentacle_'+str(round(math.atan2(-y,x)/(math.pi/4))%8);weight=min(.88,max(0,(radius-.12)/.1))
   elif kind=='quadruped':
    if z<.23:name=('front'if y<.02 else'back')+('_L'if x<0 else'_R');weight=min(1,(.23-z)/.10)
   else:
    if abs(x)>width*.25 and height*.28<z<height*.64:
     name='arm_L'if x<0 else'arm_R';weight=min(.95,(abs(x)-width*.25)/(width*.16))
   if name and weight>0:
    old=[(g.group,g.weight)for g in v.groups]
    for group_index,w in old:mesh.vertex_groups[group_index].add([v.index],w*(1-weight),'REPLACE')
    groups[name].add([v.index],weight,'REPLACE')
 for track in arm.animation_data.nla_tracks:
  action=track.strips[0].action;arm.animation_data.action=action;state=action.name.removeprefix(prefix);end=round(track.strips[0].frame_end)
  for frame in [1,round(end*.25),round(end*.5),round(end*.75),end]:
   t=(frame-1)/(end-1);wave=math.sin(t*math.pi*2);hump=math.sin(t*math.pi)
   for i,name in enumerate(layout):
    bone=arm.pose.bones[id+'_'+name];bone.rotation_mode='XYZ';bone.rotation_euler=(0,0,0)
    if state=='move'and kind=='wheels':bone.rotation_euler.y=t*math.pi*2
    elif state=='move':bone.rotation_euler.x=wave*(.12 if kind=='tentacles'else .22)*(-1 if i%2 else 1)
    elif state=='idle' and kind!='wheels':bone.rotation_euler.z=wave*.018*(-1 if i%2 else 1)
    elif state=='skill' and kind!='wheels':bone.rotation_euler.z=hump*(.15 if kind=='arms'else .08)*(-1 if i%2 else 1)
    elif state in ['fall','recover'] and kind!='wheels':bone.rotation_euler.x=hump*.045
    bone.keyframe_insert('rotation_euler',frame=frame,group=bone.name)
 arm.animation_data.action=None
 for b in arm.pose.bones:b.rotation_euler=(0,0,0);b.location=(0,0,0);b.scale=(1,1,1)
 bpy.context.scene.frame_set(1);game['articulation']=kind
