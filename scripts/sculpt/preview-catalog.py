"""Assemble front/side/back sheets and current 3D thumbnails, not selection avatars."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[2];preview=ROOT/'docs/sculpt-20261024/glb-previews';out=ROOT/'docs/sculpt-20261024/catalog';out.mkdir(parents=True,exist_ok=True);rows=json.loads((ROOT/'docs/sculpt-20261024/coverage.json').read_text())['rows']
font=ImageFont.load_default()
for ed in ['original','second-wind','extra-mile','leaf','wurstii']:
 subset=[r for r in rows if r['edition']==ed]
 for start in range(0,len(subset),8):
  if '--partial'in sys.argv and any(not(preview/f"{r['id']}-{view}.png").exists()for r in subset[start:start+8]for view in ['front','side','back','quarter']):continue
  sheet=Image.new('RGB',(1920,1440),'#e8eced');draw=ImageDraw.Draw(sheet)
  for i,r in enumerate(subset[start:start+8]):
   x=i%2*960;y=i//2*360;draw.text((x+10,y+8),r['id'],font=font,fill='#18232d')
   for k,view in enumerate(['front','side','back','quarter']):
    pic=Image.open(preview/f"{r['id']}-{view}.png").convert('RGBA');pic.thumbnail((230,300));sheet.paste(pic,(x+k*240+(230-pic.width)//2,y+38),pic);draw.text((x+k*240+10,y+338),view,font=font,fill='#536171')
  sheet.save(out/f'{ed}-{start//8+1:02d}.jpg',quality=91)
 for r in subset:
  if '--partial'in sys.argv and not(preview/f"{r['id']}-quarter.png").exists():continue
  pic=Image.open(preview/f"{r['id']}-quarter.png").convert('RGBA');pic.thumbnail((180,180));thumb=Image.new('RGBA',(192,192),(0,0,0,0));thumb.alpha_composite(pic,((192-pic.width)//2,(192-pic.height)//2))
  target=ROOT/'public/models'/ed/'avatars'/f"{r['id']}.png";target.parent.mkdir(parents=True,exist_ok=True);thumb.save(target,optimize=True)
