"""Import decoded actual GLB, not .blend preview geometry, render four views."""
import bpy,math,sys,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2];ids=[a.split('=',1)[1]for a in sys.argv if a.startswith('--id=')];hero='--hero'in sys.argv;out=ROOT/('docs/sculpt-20261024/hero-previews'if hero else'docs/sculpt-20261024/glb-previews');out.mkdir(parents=True,exist_ok=True)
for id in ids:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(ROOT/'tmp/sculpt-review-glb'/(id+'.glb')))
 scene=bpy.context.scene;scene.frame_set(1);scene.render.engine='CYCLES';scene.cycles.samples=32 if hero else 16;scene.cycles.use_denoising=False;scene.render.resolution_x=768 if hero else 384;scene.render.resolution_y=960 if hero else 480;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.world=bpy.data.worlds.new('Review World');scene.world.color=(.45,.45,.45);scene.view_settings.view_transform='AgX'
 root=bpy.data.objects['toy_'+id];bpy.context.view_layer.update();pts=[o.matrix_world@Vector(v)for o in root.children_recursive if o.type=='MESH'for v in o.bound_box];lo=Vector([min(p[k]for p in pts)for k in range(3)]);hi=Vector([max(p[k]for p in pts)for k in range(3)]);center=(lo+hi)/2
 for p,power,size in [((2,-4,5),350,4),((-3,-2,2),200,3),((0,3,3),350,3)]:
  bpy.ops.object.light_add(type='AREA',location=p);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(center-o.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=max((hi.z-lo.z)*1.30,(hi.x-lo.x)*1.30/.8,(hi.y-lo.y)*1.30/.8)
 for view,p in [('front',(0,-3,.65)),('side',(3,0,.65)),('back',(0,3,.65)),('quarter',(2,-3,1.1))]:
  if hero and view not in ['front','quarter']:continue
  cam.location=p;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/f'{id}-{view}.png');bpy.ops.render.render(write_still=True)
 print('GLB_REVIEWED',id,flush=True)
