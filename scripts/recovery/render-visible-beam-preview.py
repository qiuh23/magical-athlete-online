"""Actual fixture and scene geometry views with receiver-calibrated Cycles spots, not WebGL."""
import bpy,sys,json,math
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
root=Path(sys.argv[sys.argv.index('--')+1]);manifest=json.loads((root/'runtime-layout.json').read_text());errors=[]
def V(p):return Vector((p[0],-p[2],p[1]))
for spec in manifest['files']:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(root/spec['file']))
 scene=bpy.context.scene
 for ob in scene.objects:
  if ob.type=='MESH' and 'runtimeCastShadow' in ob:ob.visible_shadow=bool(ob['runtimeCastShadow'])
 turn=bpy.data.objects.new('Runtime_compact_parent_rotation',None);scene.collection.objects.link(turn)
 for ob in list(scene.objects):
  if ob!=turn and ob.parent is None:ob.parent=turn
 turn.rotation_euler.z=-math.pi/2 if spec['compact'] else 0
 # Match the runtime scattering shell profile; offline Cycles surface blending differs from WebGL additive blending.
 for ob in scene.objects:
  if ob.type!='MESH' or not ob.name.startswith('floodlight-soft-beams'):continue
  ob.visible_shadow=False
  mat=bpy.data.materials.new('Soft_beam_runtime_profile');mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();links=mat.node_tree.links
  output=n.new('ShaderNodeOutputMaterial');mix=n.new('ShaderNodeMixShader');transparent=n.new('ShaderNodeBsdfTransparent');emit=n.new('ShaderNodeEmission');emit.inputs['Color'].default_value=tuple(spec['lightColor'])+(1,);emit.inputs['Strength'].default_value=1
  geo=n.new('ShaderNodeNewGeometry');dot=n.new('ShaderNodeVectorMath');dot.operation='DOT_PRODUCT';links.new(geo.outputs['Normal'],dot.inputs[0]);links.new(geo.outputs['Incoming'],dot.inputs[1]);absolute=n.new('ShaderNodeMath');absolute.operation='ABSOLUTE';links.new(dot.outputs['Value'],absolute.inputs[0]);power=n.new('ShaderNodeMath');power.operation='POWER';power.inputs[1].default_value=1.7;links.new(absolute.outputs[0],power.inputs[0])
  tex=n.new('ShaderNodeTexCoord');sep=n.new('ShaderNodeSeparateXYZ');links.new(tex.outputs['UV'],sep.inputs[0]);ramp=n.new('ShaderNodeValToRGB');r=ramp.color_ramp;r.elements.remove(r.elements[1]);r.elements[0].position=0;r.elements[0].color=(0,0,0,1)
  for pos,value in [(.045,.97),(.3,.805),(.65,.5775),(.8,.23),(1,0)]:e=r.elements.new(pos);e.color=(value,value,value,1)
  links.new(sep.outputs['Y'],ramp.inputs[0]);mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';links.new(power.outputs[0],mul.inputs[0]);links.new(ramp.outputs[0],mul.inputs[1]);strength=n.new('ShaderNodeMath');strength.operation='MULTIPLY';strength.inputs[1].default_value=.11;links.new(mul.outputs[0],strength.inputs[0]);front=n.new('ShaderNodeMath');front.operation='SUBTRACT';front.inputs[0].default_value=1;links.new(geo.outputs['Backfacing'],front.inputs[1]);mask=n.new('ShaderNodeMath');mask.operation='MULTIPLY';links.new(strength.outputs[0],mask.inputs[0]);links.new(front.outputs[0],mask.inputs[1]);links.new(mask.outputs[0],mix.inputs[0]);links.new(transparent.outputs[0],mix.inputs[1]);links.new(emit.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],output.inputs[0]);ob.data.materials.clear();ob.data.materials.append(mat)
 preset=spec['lighting'];scene.world=bpy.data.worlds.new('Offline_approximate_sky');scene.world.use_nodes=True;bg=scene.world.node_tree.nodes['Background'];bg.inputs['Color'].default_value=(.64,.77,.95,1) if spec.get('mode')=='day' else (.10,.16,.26,1);bg.inputs['Strength'].default_value=.35 if spec.get('mode')=='day' else .065
 sun=bpy.data.lights.new('Runtime_main_directional','SUN');sun.energy=preset['keyPower'];sun.angle=math.radians(4);sun.color=preset['key'];so=bpy.data.objects.new('Runtime_main_directional',sun);scene.collection.objects.link(so);so.rotation_euler=(-V(spec['mainDirection'])).to_track_quat('-Z','Y').to_euler()
 for lamp in spec['lights']:
  ld=bpy.data.lights.new('Runtime_calibrated_local_spot','SPOT');ld.energy=lamp['blenderWatts'];ld.color=spec['lightColor'];ld.spot_size=2*lamp['angle'];ld.spot_blend=lamp['penumbra'];ld.shadow_soft_size=.13;ld.use_shadow=lamp['castShadow']
  lo=bpy.data.objects.new('Runtime_calibrated_local_spot',ld);scene.collection.objects.link(lo);lo.parent=turn;lo.location=V(lamp['position']);lo.rotation_euler=(V(lamp['target'])-lo.location).to_track_quat('-Z','Y').to_euler()
 f=spec['frame'];offset=spec['view']['offset'];target=V([f['x'],f['y'],f['z']]);position=V([f['x']+offset[0]*5,f['y']+offset[1]*5,f['z']+offset[2]*5]);data=bpy.data.cameras.new('Runtime_camera');cam=bpy.data.objects.new('Runtime_camera',data);scene.collection.objects.link(cam);cam.location=position;cam.rotation_euler=(target-position).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=max(spec['width'],spec['height'])/f['zoom'];data.clip_end=2000;scene.camera=cam
 scene.render.engine='CYCLES';scene.cycles.samples=96;scene.cycles.use_denoising=False;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.025;scene.cycles.max_bounces=3;scene.render.threads_mode='FIXED';scene.render.threads=6;scene.render.resolution_x=spec['width']*(2 if spec['compact'] else 1);scene.render.resolution_y=spec['height']*(2 if spec['compact'] else 1);scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0
 bpy.context.view_layer.update()
 for check in spec['projectionChecks']:
  p=world_to_camera_view(scene,cam,V(check['world']));error=max(abs(2*p.x-1-check['ndc'][0]),abs(2*p.y-1-check['ndc'][1]));assert error<.00002;errors.append(error)
 path=root/(spec['file'].replace('.glb','')+'-offline.png');scene.render.filepath=str(path);bpy.ops.render.render(write_still=True);print('RENDERED',path,flush=True)
(root/'offline-render-checks.json').write_text(json.dumps({'projectionMaxError':max(errors),'images':len(manifest['files']),'browserVerified':False,'scope':manifest['scope']},indent=2))
