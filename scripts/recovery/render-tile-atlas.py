"""Optional offline label atlas matching DeckFinish layout, not browser font proof.
Run with Python + Pillow: python3 scripts/recovery/render-tile-atlas.py EXPORT_DIRECTORY
"""
import json,sys,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(sys.argv[1]);manifest=json.loads((root/'manifest.json').read_text())
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
number_font=ImageFont.truetype(font_path,43);caption_font=ImageFont.truetype(font_path,35)
for spec in manifest['files']:
 labels=spec['labels'];image=Image.new('RGBA',(2048,math.ceil(len(labels)/8)*64));draw=ImageDraw.Draw(image)
 for i,item in enumerate(labels):
  x=(i%8)*256;y=(i//8)*64
  draw.rounded_rectangle((x+2,y+2,x+254,y+62),radius=9,fill='#24463f')
  draw.text((x+13,y+33),str(item['node']).zfill(2),font=number_font,anchor='lm',fill='#fff6d9')
  if item['caption']:draw.text((x+243,y+33),item['caption'],font=caption_font,anchor='rm',fill='#fff6d9')
 image.save(root/(spec['track']+'-labels.png'))
