from pathlib import Path
import json,urllib.request,concurrent.futures
ROOT=Path(__file__).resolve().parents[2];dest=ROOT/'tmp/sculpt-reference';dest.mkdir(parents=True,exist_ok=True)
m=json.loads((ROOT/'public/models/second-wind/manifest.json').read_text());jobs=[(r['id'],r['referenceImage'])for r in m['models']if r.get('referenceImage')]
jobs+=[('extra-mile.pdf','https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf')]
def fetch(job):
 id,url=job;p=dest/(id if id.endswith('.pdf')else id+'-original.png')
 try:
  if not p.exists():
   with urllib.request.urlopen(url,timeout=30)as response:p.write_bytes(response.read())
  return {'id':id,'url':url,'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'retrieved':True,'visuallyReviewed':False}
 except Exception as e:return {'id':id,'url':url,'retrieved':False,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:rows=list(pool.map(fetch,jobs))
(ROOT/'docs/sculpt-20261024/reference-retrieval.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('retrieved',sum(r['retrieved']for r in rows),'/',len(rows))
