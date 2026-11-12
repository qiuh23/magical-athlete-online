"""Offline identical-camera LOD comparison, not a game/mobile screenshot."""
import bpy,sys,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
out=root.parent/'mechanism-integration-delivery'/'lod-review';out.mkdir(parents=True,exist_ok=True)
for quality,suffix in [('full',''),('economy','_economy')]:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(root/f'public/models/mechanisms/approved_soft_track_tile{suffix}.glb'))
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=False
 scene.world=bpy.data.worlds.new('Review');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.64,.70,.73,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.7
 scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
 data=bpy.data.lights.new('Key','AREA');light=bpy.data.objects.new('Key',data);scene.collection.objects.link(light);light.location=(0,-2,5);data.energy=450;data.size=5
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.55));ground=bpy.context.object;mat=bpy.data.materials.new('Ground');mat.diffuse_color=(.3,.38,.34,1);ground.data.materials.append(mat)
 for view,position,scale in [('module',(3,-4,3),3.7),('detail',(1,-2,2.4),1.6)]:
  data=bpy.data.cameras.new('Review_camera');camera=bpy.data.objects.new('Review_camera',data);scene.collection.objects.link(camera);target=Vector((0,0,-.05) if view=='module' else(0,-.45,.03));camera.location=position;camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();data.type='ORTHO';data.ortho_scale=scale;scene.camera=camera
  scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100;scene.render.filepath=str(out/f'tile-{quality}-{view}.png');bpy.ops.render.render(write_still=True);bpy.data.objects.remove(camera,do_unlink=True)
