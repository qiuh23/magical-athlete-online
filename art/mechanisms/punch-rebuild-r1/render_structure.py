"""Technical transparency view only; does not change saved mechanical geometry."""
import bpy,math,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3];ART=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(ART/'punch-rebuild-r1.blend'))
a,h,e,s=math.pi/3,math.pi/12,.30,.175
bpy.data.objects['PUNCH_BOOM_Z'].rotation_euler.z=a;bpy.data.objects['PUNCH_COUNTER_YAW'].rotation_euler.z=h-a
for n in ['PUNCH_R1_TELESCOPE_1','PUNCH_R1_TELESCOPE_2']:bpy.data.objects[n].location.x=e/2
bpy.data.objects['PUNCH_SLIDER_X'].location.x=.35+s;bpy.data.objects['PUNCH_SPRING'].data.shape_keys.key_blocks[1].value=s/.35
# Transparent housing is a technical inspection treatment, not the exported material.
transparent='--opaque' not in sys.argv
for n in (['PUNCH_R1_OUTER_TUBE','PUNCH_R1_MIDDLE_TUBE','PUNCH_R1_INNER_TUBE'] if transparent else []):
 o=bpy.data.objects[n];mat=o.data.materials[0].copy();mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear();out=nodes.new('ShaderNodeOutputMaterial');mix=nodes.new('ShaderNodeMixShader');mix.inputs[0].default_value=.58;glass=nodes.new('ShaderNodeBsdfTransparent');metal=nodes.new('ShaderNodeBsdfPrincipled');metal.inputs['Base Color'].default_value=(.05,.40,.34,1);metal.inputs['Metallic'].default_value=.35;metal.inputs['Roughness'].default_value=.3;mat.node_tree.links.new(metal.outputs[0],mix.inputs[1]);mat.node_tree.links.new(glass.outputs[0],mix.inputs[2]);mat.node_tree.links.new(mix.outputs[0],out.inputs[0]);o.data.materials[0]=mat
for o in bpy.data.objects:
 if transparent and o.type=='MESH' and 'STOP' in o.name:
  m=o.data.materials[0].copy();m.diffuse_color=(.8,.42,.06,1);m.use_nodes=True;m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=m.diffuse_color;o.data.materials[0]=m
floor=bpy.data.materials.new('studio floor');floor.diffuse_color=(.10,.14,.15,1)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-1.47));bpy.context.object.data.materials.append(floor)
scene=bpy.context.scene;scene.world=scene.world or bpy.data.worlds.new('World');scene.world.color=(.25,.25,.25)
def light(name,loc,power,size):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((-.2,-1.5,.2))-o.location).to_track_quat('-Z','Y').to_euler()
light('key',(3,-4,6),1000,5);light('fill',(-4,-2,3),700,4);light('rim',(2,3,4),1200,3)
d=bpy.data.cameras.new('Camera');camera=bpy.data.objects.new('Camera',d);scene.collection.objects.link(camera);camera.location=(4,-6,3.2);target=Vector((-.15,-1.5,.05));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=4.15;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=False;scene.render.resolution_x=1100;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/('docs/qa/punch-rebuild-r1/structure-transparent.png' if transparent else 'docs/qa/punch-rebuild-r1/structure-opaque.png'));bpy.ops.render.render(write_still=True)
