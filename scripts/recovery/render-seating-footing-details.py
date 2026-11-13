"""Source geometry cutaway details; not game screenshots or complete scenes."""
import bpy,bmesh,sys,json,math
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]);views=json.loads((root/'views.json').read_text())
for view in views:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(root/(view['track']+'-footing-notches.glb')))
 for ob in list(bpy.context.scene.objects):
  if ob.type!='MESH':continue
  # Deliberate isolated construction view: actual low cream/nosing surfaces and
  # display foundations, without overhead rostrums, crowds or device cabinets.
  keep='seating-joinery_cream' in ob.name or 'seating-joinery_gold' in ob.name or 'seating-joinery:cream' in ob.name or 'seating-joinery:gold' in ob.name or 'coverage-footprint-plinth' in ob.name or 'wild13-ground-tongue' in ob.name
  if not keep:ob.hide_render=True
  elif 'seating-joinery' in ob.name:
   bm=bmesh.new();bm.from_mesh(ob.data);high=[f for f in bm.faces if any((ob.matrix_world@v.co).z>.201 for v in f.verts)];bmesh.ops.delete(bm,geom=high,context='FACES');bm.to_mesh(ob.data);bm.free()
 for material in bpy.data.materials:
  if not material.use_nodes:continue
  nt=material.node_tree;principled=nt.nodes.get('Principled BSDF');color=principled.inputs['Base Color'].default_value[:] if principled else (.7,.7,.7,1);out=next(n for n in nt.nodes if n.type=='OUTPUT_MATERIAL');em=nt.nodes.new('ShaderNodeEmission');em.inputs['Color'].default_value=color;em.inputs['Strength'].default_value=.8;nt.links.new(em.outputs[0],out.inputs['Surface'])
 scene=bpy.context.scene;scene.world=bpy.data.worlds.new('Construction_detail_sky');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.24,.30,.34,1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.8
 data=bpy.data.lights.new('Soft_key','SUN');data.energy=2;data.angle=.25;light=bpy.data.objects.new('Soft_key',data);scene.collection.objects.link(light);light.rotation_euler=(.35,-.4,-.3)
 x,y,z=view['center'];target=Vector((x,-z,.13));camdata=bpy.data.cameras.new('Detail_camera');cam=bpy.data.objects.new('Detail_camera',camdata);scene.collection.objects.link(cam);cam.location=target+Vector((0,-2.0,7));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=3.7;scene.camera=cam
 scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=False;scene.cycles.max_bounces=2;scene.render.threads_mode='FIXED';scene.render.threads=4;scene.render.resolution_x=560;scene.render.resolution_y=480;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.render.filepath=str(root/(view['anchor'].replace(':','-')+'-detail.png'));bpy.ops.render.render(write_still=True)
