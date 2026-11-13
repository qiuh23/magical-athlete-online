"""Offline view of exported runtime geometry/camera. Not a browser screenshot.
No HUD/canvas textures, native Three shadows or performance measurement.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
projection_checks=[]
root=Path(__file__).resolve().parents[1]/'docs/qa/map-mechanisms'
for track in ['wild','boardwalks']:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(root/f'{track}-runtime-geometry.glb'))
 objects=list(bpy.context.scene.objects);turn=bpy.data.objects.new('Runtime_compact_rotation',None);bpy.context.collection.objects.link(turn)
 for o in objects:
  if o.parent is None:o.parent=turn
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=False
 scene.world=bpy.data.worlds.new('Offline_review_world');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.62,.72,.79,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
 scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
 ld=bpy.data.lights.new('Offline_sun','SUN');lo=bpy.data.objects.new('Offline_sun',ld);scene.collection.objects.link(lo);lo.rotation_euler=(.45,-.65,-.55);ld.energy=2;ld.angle=math.radians(12)
 for spec in json.loads((root/f'{track}-runtime-cameras.json').read_text()):
  turn.rotation_euler.z=-math.pi/2 if spec['compact'] else 0
  f=spec['frame'];offset=spec['view']['offset'];eye=5
  target=Vector((f['x'],-f['z'],f['y']));position=Vector((f['x']+offset[0]*eye,-f['z']-offset[2]*eye,f['y']+offset[1]*eye))
  data=bpy.data.cameras.new('Runtime_orthographic');cam=bpy.data.objects.new('Runtime_orthographic',data);scene.collection.objects.link(cam);cam.location=position;cam.rotation_euler=(target-position).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=max(spec['width'],spec['height'])/f['zoom'];data.clip_end=2000;scene.camera=cam
  scene.render.resolution_x=spec['width'];scene.render.resolution_y=spec['height'];scene.render.resolution_percentage=100
  bpy.context.view_layer.update()
  for check in spec['projectionChecks']:
   x,y,z=check['world'];projected=world_to_camera_view(scene,cam,Vector((x,-z,y)));expected=check['ndc'];error=max(abs(2*projected.x-1-expected[0]),abs(2*projected.y-1-expected[1]));projection_checks.append({'track':track,'width':spec['width'],'height':spec['height'],'overview':spec['overview'],'max_ndc_xy_error':error});assert error<.00001,(spec,error)
  scene.render.filepath=str(root/f"{track}-{spec['width']}x{spec['height']}-{'overview' if spec['overview'] else 'close'}-geometry.png")
  bpy.ops.render.render(write_still=True)
  bpy.data.objects.remove(cam,do_unlink=True)

(root/"offline-camera-projection.json").write_text(json.dumps({"method":"Three OrthographicCamera NDC versus Blender world_to_camera_view, same target/direction/zoom, sensor AUTO and ortho_scale=max(width,height)/zoom","max_ndc_xy_error":max(c["max_ndc_xy_error"] for c in projection_checks),"checks":projection_checks},indent=2))
