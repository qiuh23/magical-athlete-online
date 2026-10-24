import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
for ed in ['second-wind','extra-mile','leaf','wurstii']:
 p=ROOT/'public/models'/ed/'manifest.json';m=json.loads(p.read_text())
 for r in m['models']+m.get('variants',[]):
  r['modelPreview']=f"/models/{ed}/avatars/{r['id']}.png";r['previewMethod']='Actual exported GLB decoded and re-imported into Blender; selection SVG unchanged'
 p.write_text(json.dumps(m,ensure_ascii=False,indent=2))
