"""Offline Cycles rendering of evaluated runtime meshes. Not browser screenshots.
Run: blender -b --python scripts/recovery/render-mechanism-motion.py -- /tmp/mechanism-motion-proof
"""
import bpy,json,sys,math
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]);report=json.loads((root/'report.json').read_text())
camera_bounds={}
for frame in report['exports']:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(root/frame['file']))
 corners=[o.matrix_world@Vector(c) for o in bpy.context.scene.objects if o.type=='MESH' for c in o.bound_box]
 camera_bounds.setdefault(frame['scenario'],[]).extend(corners)
for frame in report['exports']:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(root/frame['file']));scene=bpy.context.scene
 objects=[o for o in scene.objects if o.type=='MESH']
 corners=camera_bounds[frame['scenario']]
 lo=Vector(tuple(min(p[i] for p in corners) for i in range(3)));hi=Vector(tuple(max(p[i] for p in corners) for i in range(3)));target=(lo+hi)/2
 # A neutral ground for readability; only exported device/actor meshes are under review.
 bpy.ops.mesh.primitive_plane_add(size=200,location=(target.x,target.y,lo.z-.04));floor=bpy.context.object;floor.name='Neutral QA floor - not venue';mat=bpy.data.materials.new('QA floor');mat.diffuse_color=(.18,.24,.22,1);floor.data.materials.append(mat)
 data=bpy.data.cameras.new('Offline QA camera');cam=bpy.data.objects.new(data.name,data);scene.collection.objects.link(cam);cam.location=target+Vector((5,-9,6));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=max(4.0,(hi-lo).length*1.05);scene.camera=cam
 world=bpy.data.worlds.new('Neutral QA world');world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.62,.72,.8,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.6;scene.world=world
 for offset,energy in [((3,-6,9),1100),((-5,2,6),700)]:
  light=bpy.data.lights.new('QA softbox','AREA');light.energy=energy;light.shape='DISK';light.size=6;o=bpy.data.objects.new(light.name,light);scene.collection.objects.link(o);o.location=target+Vector(offset);o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
 scene.render.engine='CYCLES';scene.cycles.samples=12;scene.cycles.use_denoising=False;scene.cycles.max_bounces=3;scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.resolution_x=640;scene.render.resolution_y=520;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(root/(Path(frame['file']).stem+'.png'));bpy.ops.render.render(write_still=True)
