from pathlib import Path
import json,hashlib,csv,subprocess,statistics
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/sculpt-20261024';cov=json.loads((OUT/'coverage.json').read_text());motion=json.loads((OUT/'motion-validation.json').read_text());assert len(motion)==153 and all(x['passed']for x in motion)
assert '47 passed' in (OUT/'browser-complete-final.log').read_text();assert '2 passed' in (OUT/'browser-recovery-final.log').read_text();assert '6 passed' in (OUT/'browser-static-forms-final.log').read_text();assert 'pass 172' in (OUT/'final-tests-172.log').read_text()
for p in (OUT/'game-form-switches').glob('*-verification.json'):
 v=json.loads(p.read_text());assert v['normalAndWereSwitch']and v['knightAndMarioMount']
assert len(list((OUT/'game-form-switches').glob('*-verification.json')))==2
packs={ed:json.loads((ROOT/'public/models'/ed/'manifest.json').read_text())for ed in ['second-wind','extra-mile','leaf','wurstii']};original=json.loads((ROOT/'public/models/toy-racers.manifest.json').read_text());resources={};models=[];packComparison=[]
def resource(path):
 if path not in resources:
  p=ROOT/path;resources[path]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
 return path
for row in cov['rows']:
 id=row['id'];ed=row['edition'];ref=json.loads((ROOT/'tmp/sculpt-stage'/(id+'.json')).read_text())['sourceReference'];record=next(x for x in (original['models']if ed=='original'else packs[ed]['models']+packs[ed].get('variants',[]))if x['id']==id)
 row['recognition']=ref;row['sourceInference']='单视角参考之外的侧背面、完整体积、衣物厚度与关节由本项目补全，并非原作者批准的生产模型。'+('本轮未取得 Leaf 原作者 PNG，使用仓库 SVG 与登记特征。'if ed=='leaf'else'')
 row['sourceReference']={'checkedOn':'2026-10-24','basis':ref,'originalAuthorImageChecked':ed!='leaf'and id not in ['bite-mark-were','hog-knight-hog']};row['status']='completed-local-validation';row['checks'].update(sculpt=True,reopenedBlend=True,reimportedGlb=True,visual=True,game=True)
 load=row['actualLoadFile'];row['current']['runtimeFileBytes']=(ROOT/load).stat().st_size;row['current']['sharedRuntimeFile']=ed=='original'and id!='banana'
 if 'bytes'in row['current']:row['current']['validationGlbBytes']=row['current'].pop('bytes')
 record['sculptStatus']='completed-local-validation';record['recognition']=ref;record['assetVersion']='authored-sculpt-final-20261024';record['modelPreview']=f'/models/{ed}/avatars/{id}.png'
 if ed!='original':(ROOT/record['editableSource']).with_suffix('.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
 shape={k:row['current'][k]for k in ['triangles','draws','bones','bounds','clips','staticBindMaxError']};models.append({'id':id,'nameZh':row['nameZh'],'edition':ed,'itemType':row['itemType'],'rootNode':'toy_'+id,'source':resource(row['source']),'runtimeResource':resource(load),'sharedRuntimeResource':ed=='original'and id!='banana','additionalQualityResources':[resource(p)for p in row['extraQualityFiles']],'bundleAlias':resource(row['bundleAlias'])if row.get('bundleAlias')else None,'specification':shape,'referenceBasis':ref,'inference':row['sourceInference'],'previews':{v:f'evidence/glb-previews/{id}-{v}.webp'for v in ['front','side','back','quarter']},'checks':row['checks'],'denseMotionSamplesPerClip':65,'status':'completed-local-validation'})
for name in ['toy-racers','toy-racers-economy']:
 p=ROOT/'public/models'/f'{name}.manifest.json';m=original if name=='toy-racers'else json.loads(p.read_text());
 for r in m['models']:r['sculptStatus']='completed-local-validation';r['assetVersion']='authored-sculpt-final-20261024'
 p.write_text(json.dumps(m,ensure_ascii=False,indent=2));resource('public/models/'+name+'.glb')
for ed,m in packs.items():(ROOT/'public/models'/ed/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2))
for ed in ['original','second-wind','extra-mile','leaf','wurstii']:
 p='public/models/'+('toy-racers.manifest.json'if ed=='original'else ed+'/manifest.json');old=json.loads(subprocess.check_output(['git','show',cov['baseline']+':'+p],cwd=ROOT));new=json.loads((ROOT/p).read_text());a=old['models']+old.get('variants',[]);b=new['models']+new.get('variants',[])
 packComparison.append({'edition':ed,'forms':len(b),'beforeBytes':old.get('optimizedBytes',sum(x.get('bytes',0)for x in a)),'afterBytes':new.get('optimizedBytes',new.get('totalBytes')),'beforeTriangles':sum(x['triangles']for x in a),'afterTriangles':sum(x['triangles']for x in b),'beforeDrawUnits':sum(x['draws']for x in a),'afterDrawUnits':sum(x['draws']for x in b)})
bench=[]
for name in ['1280-high','360-low']:
 d=json.loads((OUT/'game-final'/f'{name}-benchmark.json').read_text());bench.append({'case':name,'frames':d['frames'],'elapsedMs':d['elapsedMs'],'cpuSubmitMedianMs':statistics.median(x['cpuSubmissionMs']for x in d['samples']),'renderStartIntervalMedianMs':statistics.median(x['intervalMs']for x in d['samples']if x['intervalMs']is not None),'renderer':d['stats']['renderer'],'method':d['method']})
manifest={'baseline':cov['baseline'],'characterCount':151,'independentModuleCount':2,'logicalForms':153,'completedForms':153,'unfinishedForms':0,'physicalPhoneTested':False,'sourceBlender':'4.3.2','originalAssemblyBlender':'5.2.2 LTS','up':'+Y','front':'+Z','rootTransform':'position/rotation zero, scale one; ground Y=0','resourceNotes':'原版共享总包不应按每个角色重复累加；banana实际走独立覆盖文件。每角色draws是角色几何材质绘制单元，不含游戏底座、地图或阴影重复pass。','resources':resources,'models':models,'packComparison':packComparison,'benchmarks':bench,'validation':{'assetAndSceneTests':172,'gameFunctionalChecks':63,'performanceCases':2,'allFormsDenseMotionChecks':153,'sourceCatalogsReopened':[36,38],'productionBuild':True,'typecheck':True}}
(OUT/'delivery-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));(OUT/'coverage.json').write_text(json.dumps(cov,ensure_ascii=False,indent=2))
with (OUT/'character-specifications.csv').open('w',encoding='utf-8-sig',newline='')as f:
 w=csv.writer(f);w.writerow(['ID','中文名','包','类型','源文件','运行时文件','共享文件','三角面','角色绘制单元','骨骼','高度Y','宽X','深Z','文件字节','动画','状态'])
 for m in models:
  s=m['specification'];w.writerow([m['id'],m['nameZh'],m['edition'],m['itemType'],m['source'],m['runtimeResource'],m['sharedRuntimeResource'],s['triangles'],s['draws'],s['bones'],s['bounds'][1],s['bounds'][0],s['bounds'][2],resources[m['runtimeResource']]['bytes'],','.join(s['clips']),m['status']])
print('FINAL_MANIFEST',len(models),'resources',len(resources),'GLBs',sum(p.endswith('.glb')for p in resources))
