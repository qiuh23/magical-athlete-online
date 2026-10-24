"""Install measured authored sculptures; does not overwrite 2D selection avatars."""
from pathlib import Path
import json,shutil,hashlib
ROOT=Path(__file__).resolve().parents[2];stage=ROOT/'tmp/sculpt-stage';stats={r['id']:r for r in json.loads((ROOT/'docs/sculpt-20261024/stage-validation.json').read_text())};coverage=json.loads((ROOT/'docs/sculpt-20261024/coverage.json').read_text())
assert len(stats)==153, 'Validate every logical form before installing'
for edition in ['second-wind','extra-mile','leaf','wurstii']:
 path=ROOT/'public/models'/edition/'manifest.json';manifest=json.loads(path.read_text());rows=manifest['models']+manifest.get('variants',[])
 for row in rows:
  id=row['id'];s=stats[id];assert s['passed'];target=path.parent/(id+'.glb');source=ROOT/row['editableSource'];source.parent.mkdir(parents=True,exist_ok=True)
  shutil.copyfile(stage/(id+'.glb'),target);shutil.copyfile(stage/(id+'.blend'),source)
  ref=json.loads((stage/(id+'.json')).read_text());row.update({k:s[k]for k in ['bytes','triangles','draws','bounds','bones']})
  row.update(generator='Blender 4.3.2',sculptVersion='authored-20261024',animations=['idle','move','skill','fall','recover'],pivotY=0,referenceBasis=ref['sourceReference'],referenceChecked=True,originalAuthorImageChecked=edition!='leaf'and id not in ['bite-mark-were','hog-knight-hog'],referenceDate='2026-10-24',inferred='Unseen back/underside, complete depth, joints and costume construction are project interpretations, not original-author-approved sculpts.',sculptStatus='pending-full-game-visual-acceptance',compression='EXT_meshopt_compression; fixed world-unit SNORM16 positions without transform changes',sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),glbSha256=hashlib.sha256(target.read_bytes()).hexdigest())
  row.pop('byteBudget',None);row.pop('budgetReason',None);row.pop('mouthSurfaceVersion',None)
  # Wurstii's old 1024px portraits remain untouched as requested. New 3D previews have a separate path.
  row['modelPreview']=f'/models/{edition}/avatars/{id}.png'
  source.with_suffix('.json').write_text(json.dumps(row,ensure_ascii=False,indent=2))
 manifest.update(generator='Blender 4.3.2 authored replacement sculptures',up='+Y',forward='+Z',pivot='ground-centre',skeletalAnimation=True,compression='EXT_meshopt_compression',totalBytes=sum(r['bytes']for r in rows),totalTriangles=sum(r['triangles']for r in rows))
 manifest['bytes']=manifest['totalBytes'];manifest['materialCount']=1;manifest['textureCount']=0;manifest['animationMethod']='Five independent local skeletal clips; game owns route position and fall/recovery orientation';
 if edition=='wurstii':manifest['portraitMethod']='Existing selection portraits retained unchanged; separate new modelPreview files under /models/wurstii/avatars/'
 path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
for r in coverage['rows']:
 r['status']='authored-pending-full-acceptance';r['checks']['sculpt']=True;r['current']=stats[r['id']]
(ROOT/'docs/sculpt-20261024/coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2))
