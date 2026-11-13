"""Static offline view of exported runtime art, not a game screenshot."""
import bpy,json,sys,math
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]);manifest=json.loads((root/'manifest.json').read_text())
def V(p):return Vector((p[0],-p[2],p[1]))
views=[('wild',[5,7], 'force-and-trip'),('wild',[23,24], 'forward-and-backward'),('squiggle',[21,23], 'score-machines'),('whirly-world',[3,5], 'paired-portals'),('boardwalks',[18,19,20,21,22,23], 'fork-coverage')]
for track,nodes,name in views:
 spec=next(f for f in manifest['files'] if f['track']==track);bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(root/spec['file']));scene=bpy.context.scene
 atlas=root/f'{track}-labels.png'
 if atlas.exists():
  for mat in bpy.data.materials:
   if mat.name.startswith('tile-atlas-'):
    mat.use_nodes=True;n=mat.node_tree.nodes;link=mat.node_tree.links;tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(atlas));mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY_ADD';mapping.inputs[1].default_value=(1,-1,1);mapping.inputs[2].default_value=(0,1,0);uv=n.new('ShaderNodeTexCoord');link.new(uv.outputs['UV'],mapping.inputs[0]);link.new(mapping.outputs['Vector'],tex.inputs['Vector']);p=n.new('ShaderNodeBsdfPrincipled');link.new(p.outputs['BSDF'],n.get('Material Output').inputs['Surface']);link.new(tex.outputs['Color'],p.inputs['Base Color']);link.new(tex.outputs['Alpha'],p.inputs['Alpha']);p.inputs['Roughness'].default_value=.8
 points=[spec['points'][str(n)] for n in nodes if str(n) in spec['points']];target=sum([V(p) for p in points],Vector())/len(points);target.z+=.30
 distance=max(4,(max(p[0] for p in points)-min(p[0] for p in points))*1.1,(max(p[2] for p in points)-min(p[2] for p in points))*1.1)
 data=bpy.data.cameras.new('Offline_camera');cam=bpy.data.objects.new('Offline_camera',data);scene.collection.objects.link(cam);cam.location=target+Vector((1,-5,9));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=max(8,distance+5);scene.camera=cam
 world=bpy.data.worlds.new('Neutral_preview_day');world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.60,.72,.83,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.45;scene.world=world
 for loc,energy,size in [((2,-5,12),1900,8),((-5,3,8),1200,7)]:
  ld=bpy.data.lights.new('Soft_preview_light','AREA');ld.energy=energy;ld.shape='DISK';ld.size=size;lo=bpy.data.objects.new(ld.name,ld);scene.collection.objects.link(lo);lo.location=target+Vector(loc);lo.rotation_euler=(target-lo.location).to_track_quat('-Z','Y').to_euler()
 scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=False;scene.cycles.max_bounces=3;scene.render.threads_mode='FIXED';scene.render.threads=6;scene.render.resolution_x=1400;scene.render.resolution_y=1050;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.render.filepath=str(root/(name+'-offline.png'));bpy.ops.render.render(write_still=True)
