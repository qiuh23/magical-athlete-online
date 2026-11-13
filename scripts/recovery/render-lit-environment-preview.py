"""Two exact runtime geometry views with receiver-calibrated Cycles spots, not WebGL."""
import bpy,sys,json,math
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
root=Path(sys.argv[sys.argv.index('--')+1]);manifest=json.loads((root/'runtime-layout.json').read_text());errors=[]
def V(p):return Vector((p[0],-p[2],p[1]))
for spec in manifest['files']:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(root/spec['file']))
 scene=bpy.context.scene;turn=bpy.data.objects.new('Runtime_compact_parent_rotation',None);scene.collection.objects.link(turn)
 for ob in list(scene.objects):
  if ob!=turn and ob.parent is None:ob.parent=turn
 turn.rotation_euler.z=-math.pi/2 if spec['compact'] else 0
 preset=spec['lighting'];scene.world=bpy.data.worlds.new('Offline_approximate_sky');scene.world.use_nodes=True;bg=scene.world.node_tree.nodes['Background'];bg.inputs['Color'].default_value=(.10,.16,.26,1);bg.inputs['Strength'].default_value=.18
 sun=bpy.data.lights.new('Runtime_main_directional','SUN');sun.energy=preset['keyPower'];sun.angle=math.radians(4);sun.color=preset['key'];so=bpy.data.objects.new('Runtime_main_directional',sun);scene.collection.objects.link(so);so.rotation_euler=(-V(spec['mainDirection'])).to_track_quat('-Z','Y').to_euler()
 for lamp in spec['lights']:
  ld=bpy.data.lights.new('Runtime_calibrated_local_spot','SPOT');ld.energy=lamp['blenderWatts'];ld.color=(1,.745,.397);ld.spot_size=2*lamp['angle'];ld.spot_blend=lamp['penumbra'];ld.shadow_soft_size=.13
  lo=bpy.data.objects.new('Runtime_calibrated_local_spot',ld);scene.collection.objects.link(lo);lo.parent=turn;lo.location=V(lamp['position']);lo.rotation_euler=(V(lamp['target'])-lo.location).to_track_quat('-Z','Y').to_euler()
 f=spec['frame'];offset=spec['view']['offset'];target=V([f['x'],f['y'],f['z']]);position=V([f['x']+offset[0]*5,f['y']+offset[1]*5,f['z']+offset[2]*5]);data=bpy.data.cameras.new('Runtime_camera');cam=bpy.data.objects.new('Runtime_camera',data);scene.collection.objects.link(cam);cam.location=position;cam.rotation_euler=(target-position).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=max(spec['width'],spec['height'])/f['zoom'];data.clip_end=2000;scene.camera=cam
 scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=False;scene.cycles.max_bounces=3;scene.render.threads_mode='FIXED';scene.render.threads=6;scene.render.resolution_x=spec['width'];scene.render.resolution_y=spec['height'];scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0
 bpy.context.view_layer.update()
 for check in spec['projectionChecks']:
  p=world_to_camera_view(scene,cam,V(check['world']));error=max(abs(2*p.x-1-check['ndc'][0]),abs(2*p.y-1-check['ndc'][1]));assert error<.00002;errors.append(error)
 path=root/(spec['file'].replace('.glb','')+'-night-offline.png');scene.render.filepath=str(path);bpy.ops.render.render(write_still=True);print('RENDERED',path,flush=True)
(root/'offline-render-checks.json').write_text(json.dumps({'projectionMaxError':max(errors),'images':2,'browserVerified':False,'scope':manifest['scope']},indent=2))
