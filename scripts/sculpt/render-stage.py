import bpy,math,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
ids=[a.split('=',1)[1]for a in sys.argv if a.startswith('--id=')]or ['coach','hare','gunk','copycat']
for id in ids:
 bpy.ops.wm.open_mainfile(filepath=str(ROOT/'tmp/sculpt-stage'/(id+'.blend')))
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False;scene.render.resolution_x=640;scene.render.resolution_y=800;scene.render.resolution_percentage=100;scene.render.film_transparent=False;scene.world.color=(.45,.45,.45);scene.view_settings.view_transform='AgX'
 for p,power,size in [((2,-4,5),350,4),((-3,-2,2),200,3),((0,3,3),350,3)]:
  bpy.ops.object.light_add(type='AREA',location=p);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,.45))-o.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';pts=[o.matrix_world@v.co for o in bpy.data.objects['toy_'+id].children if o.type=='MESH' for v in o.data.vertices];lo=Vector([min(p[k]for p in pts)for k in range(3)]);hi=Vector([max(p[k]for p in pts)for k in range(3)]);center=(lo+hi)/2;cam.data.ortho_scale=max((hi.z-lo.z)*1.32,(hi.x-lo.x)*1.32/.8,(hi.y-lo.y)*1.32/.8)
 out=ROOT/'docs/sculpt-20261024/stage-previews';out.mkdir(parents=True,exist_ok=True)
 for view,p in [('front',(0,-3,.65)),('side',(3,0,.65)),('back',(0,3,.65)),('quarter',(2,-3,1.1))]:
  cam.location=p;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/f'{id}-{view}.png');bpy.ops.render.render(write_still=True)
