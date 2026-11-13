"""Source sampled offline animation with exact per-frame mesh matrices."""
import bpy,json,sys,math,os
from pathlib import Path
from mathutils import Vector,Matrix
root=Path(sys.argv[sys.argv.index('--')+1]);manifest=json.loads((root/'manifest.json').read_text());C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
def V(p):return Vector((p[0],-p[2],p[1]))
def M(a):return Matrix(tuple(tuple(a[c*4+r] for c in range(4))for r in range(4)))
checks=[]
for spec in manifest['files']:
 if os.environ.get('ONLY_CASE') and spec['name']!=os.environ['ONLY_CASE']:continue
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(root/(spec['name']+'.glb')));scene=bpy.context.scene;frames=json.loads((root/(spec['name']+'-frames.json')).read_text());objects={o.name:o for o in scene.objects};max_error=0
 for f,frame in enumerate(frames):
  for row in frame['objects']:
   ob=objects[row['name']];desired=C@M(row['matrix'])@C.inverted()
   if f==0:max_error=max(max_error,max(abs(ob.matrix_world[r][c]-desired[r][c])for r in range(4)for c in range(4)))
   ob.matrix_world=desired;ob.rotation_mode='QUATERNION';ob.keyframe_insert('location',frame=f+1);ob.keyframe_insert('rotation_quaternion',frame=f+1);ob.keyframe_insert('scale',frame=f+1);ob.hide_render=not row['visible'];ob.keyframe_insert('hide_render',frame=f+1)
   if ob.data.shape_keys and row['morph']:
    for i,v in enumerate(row['morph']):ob.data.shape_keys.key_blocks[i+1].value=v;ob.data.shape_keys.key_blocks[i+1].keyframe_insert('value',frame=f+1)
 assert max_error<.0001,max_error
 for rid in spec['unchangedResidents']:
  values=[next(a for a in f['actors']if a['id']==rid)for f in frames];assert all(v==values[0]for v in values)
 atlas=root/(spec['track']+'-labels.png')
 if atlas.exists():
  for mat in bpy.data.materials:
   if mat.name.startswith('tile-atlas-'):
    mat.use_nodes=True;n=mat.node_tree.nodes;link=mat.node_tree.links;tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(atlas));mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY_ADD';mapping.inputs[1].default_value=(1,-1,1);mapping.inputs[2].default_value=(0,1,0);uv=n.new('ShaderNodeTexCoord');link.new(uv.outputs['UV'],mapping.inputs[0]);link.new(mapping.outputs['Vector'],tex.inputs['Vector']);p=n.new('ShaderNodeBsdfPrincipled');link.new(p.outputs['BSDF'],n.get('Material Output').inputs['Surface']);link.new(tex.outputs['Color'],p.inputs['Base Color']);link.new(tex.outputs['Alpha'],p.inputs['Alpha']);p.inputs['Roughness'].default_value=.8
 points=[V(p)for p in spec['points']];target=sum(points,Vector())/len(points);target.y-=.8;target.z+=.35
 if spec['track']=='boardwalks':target+=(points[0]-target)*.25
 data=bpy.data.cameras.new('Offline_review_camera');cam=bpy.data.objects.new('Offline_review_camera',data);scene.collection.objects.link(cam);cam.location=target+Vector((2,-6,10));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=11.5 if spec['track']=='wild' else 13.5;scene.camera=cam
 world=bpy.data.worlds.new('Neutral_preview_day');world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.60,.72,.83,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65;scene.world=world
 ld=bpy.data.lights.new('Soft_preview_light','AREA');ld.energy=1800;ld.shape='DISK';ld.size=7;lo=bpy.data.objects.new(ld.name,ld);scene.collection.objects.link(lo);lo.location=target+Vector((1,-5,12));lo.rotation_euler=(target-lo.location).to_track_quat('-Z','Y').to_euler()
 scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=False;scene.cycles.max_bounces=2;scene.render.threads_mode='FIXED';scene.render.threads=6;scene.render.resolution_x=768;scene.render.resolution_y=576;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.render.fps=15;scene.frame_start=1;scene.frame_end=len(frames);folder=root/spec['name'];folder.mkdir(exist_ok=True);scene.render.filepath=str(folder/'frame-');
 if os.environ.get('KEYFRAMES'):
  for frame in map(int,os.environ['KEYFRAMES'].split(',')):scene.frame_set(frame);scene.render.filepath=str(folder/f'keyframe-{frame:04d}.png');bpy.ops.render.render(write_still=True)
 else:bpy.ops.render.render(animation=True)
 checks.append({'name':spec['name'],'matrixMaxError':max_error,'unchangedResidents':len(spec['unchangedResidents']),'frames':len(frames),'scope':manifest['scope']})
(root/'checks.json').write_text(json.dumps(checks,indent=2))
