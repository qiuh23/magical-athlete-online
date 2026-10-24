from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[2];audit=json.loads((ROOT/'docs/sculpt-20261024/source-audit.json').read_text());coverage=json.loads((ROOT/'docs/sculpt-20261024/coverage.json').read_text());rows={r['id']:r for r in coverage['rows']}
for entry in audit['sources']:
 id=entry['id'];r=rows[id];ed=r['edition'];source=('assets/blender/toy-racers.blend'if ed=='original'else f'assets/blender/{ed}/'+('blend/'if ed=='wurstii'else'')+id+'.blend');glb='public/models/toy-racers.glb'if ed=='original'else f'public/models/{ed}/{id}.glb'
 entry['stageSourceSha256']=entry.pop('sourceSha256');entry.update(source=source,sourceSha256=hashlib.sha256((ROOT/source).read_bytes()).hexdigest(),glb=glb,glbSha256=hashlib.sha256((ROOT/glb).read_bytes()).hexdigest())
 r['checks']['reopenedBlend']=entry['reopened'];r['checks']['reimportedGlb']=True
(ROOT/'docs/sculpt-20261024/source-audit.json').write_text(json.dumps(audit,indent=2));sw=[r for r in audit['sources']if rows[r['id']]['edition']=='second-wind'];(ROOT/'docs/sculpt-20261024/second-wind-source-audit.json').write_text(json.dumps({'version':'authored-20261024','passed':all(r['boundaryEdges']==0 and r['looseEdges']==0 for r in sw),'sources':sw},indent=2));(ROOT/'docs/sculpt-20261024/coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2))
