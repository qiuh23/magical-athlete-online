import{resolve}from'node:path';import{pathToFileURL}from'node:url';import fs from'node:fs/promises';
const dir=resolve('.tools/sculpt/node_modules'),load=p=>import(pathToFileURL(resolve(dir,p)).href);
const{NodeIO}=await load('@gltf-transform/core/dist/index.js'),{EXTMeshoptCompression,KHRMeshQuantization,ALL_EXTENSIONS}=await load('@gltf-transform/extensions/dist/index.js'),{dedup,prune,resample,mergeDocuments,unpartition,quantize,joinPrimitives}=await load('@gltf-transform/functions/dist/index.js'),{MeshoptEncoder,MeshoptDecoder}=await load('meshoptimizer/index.js');await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const ids=process.argv.slice(2).length?process.argv.slice(2):['coach','hare','gunk','copycat'];
for(const quality of ['','-economy']){const path=`public/models/toy-racers${quality}.glb`,doc=await io.read(path),scene=doc.getRoot().getDefaultScene()??doc.getRoot().listScenes()[0];
 for(const id of ids){const old=doc.getRoot().listNodes().find(n=>n.getName()===`toy_${id}`);if(!old)throw Error(id);const nodes=[];old.traverse(n=>nodes.push(n));for(const anim of doc.getRoot().listAnimations())if(anim.getName().startsWith(id+'-'))anim.dispose();for(const n of nodes.reverse())n.dispose();
 const part=await io.read(`tmp/sculpt-stage/${id}${quality}.glb`),map=mergeDocuments(doc,part);for(const s of part.getRoot().listScenes()){const copy=map.get(s);for(const n of [...copy.listChildren()])scene.addChild(n);copy.dispose();}}
 // A shared vertex-colour swatch preserves each sculpt's authored colours
 // while retaining the original catalog's ten-material GPU palette budget.
 const paper=doc.getRoot().listMaterials().find(m=>m.getName()==='toy-paper')??doc.createMaterial('toy-paper');
 for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
  const material=p.getMaterial();if(!material||(material!==paper&&!material.getName().startsWith('toy-sw-')))continue;
  const color=material.getBaseColorFactor(),count=p.getAttribute('POSITION').getCount(),values=new Float32Array(count*4);
  const existing=p.getAttribute('COLOR_0');for(let i=0;i<count;i++){const tint=existing?existing.getElement(i,[]):[1,1,1,1];values.set(color.map((v,k)=>v*(tint[k]??1)),i*4);}
  p.setAttribute('COLOR_0',doc.createAccessor().setType('VEC4').setArray(values).setBuffer(doc.getRoot().listBuffers()[0]));p.setMaterial(paper);
 }
 paper.setBaseColorFactor([1,1,1,1]).setRoughnessFactor(.74).setMetallicFactor(0);
 // Merge sibling meshes only when they have exactly the same skin and
 // identity local transforms. Joint indices remain unchanged, unlike flattening.
 await doc.transform(dedup());
 for(const id of ids){const root=doc.getRoot().listNodes().find(n=>n.getName()===`toy_${id}`);const meshes=root.listChildren().filter(n=>n.getMesh());if(meshes.length<2)continue;
  const skin=meshes[0].getSkin();for(const n of meshes){if(n.getSkin()!==skin||n.listChildren().length||n.getTranslation().some(v=>v!==0)||n.getScale().some(v=>v!==1)||n.getRotation().some((v,i)=>v!==(i===3?1:0)))throw Error('Unsafe skinned join '+id);}
  const prims=meshes.flatMap(n=>n.getMesh().listPrimitives()),merged=joinPrimitives(prims);meshes[0].setMesh(doc.createMesh(`${id}_sculpt`).addPrimitive(merged)).setName(`${id}_sculpt`);for(const n of meshes.slice(1))n.dispose();
 }
 // Fixed world-unit SNORM16 grid: no per-mesh translations/scales are added,
 // so static clones and inverse bind matrices remain in the same coordinate space.
 for(const mesh of doc.getRoot().listMeshes())for(const p of mesh.listPrimitives()){
  const a=p.getAttribute('POSITION');if(a.getArray() instanceof Float32Array){const values=a.getArray();if(values.some(v=>Math.abs(v)>1))throw Error('Fixed-grid position out of range');a.setArray(Int16Array.from(values,v=>Math.round(v*32767))).setNormalized(true);}
 }
 doc.createExtension(KHRMeshQuantization).setRequired(true);
 await doc.transform(dedup(),resample(),quantize({pattern:/^(NORMAL|TANGENT|COLOR_)/,quantizeNormal:10,quantizeColor:8}),prune(),unpartition());doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.FILTER});await io.write(path,doc);console.log(path,(await fs.stat(path)).size);
}
