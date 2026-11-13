"""Arrange labeled offline evidence frames, not gameplay screenshots."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,sys
root=Path(sys.argv[1]);frames=json.loads((root/'report.json').read_text())['exports'];scenarios=list(dict.fromkeys(f['scenario'] for f in frames))
width=1920;height=len(scenarios)*574+82
out=Image.new('RGB',(width,height),'#eeeefa');d=ImageDraw.Draw(out)
font_path='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
try:font=ImageFont.truetype(font_path,19);small=ImageFont.truetype(font_path,17)
except OSError:font=small=ImageFont.load_default()
d.text((18,15),'OFFLINE MESH MOTION REVIEW | Original GLBs + current runtime joint sampling',fill='#111111',font=font)
d.text((18,44),'Not browser screenshots. Actors are staged; gameplay movement is tested separately.',fill='#111111',font=small)
for row,scenario in enumerate(scenarios):
 for col,f in enumerate([f for f in frames if f['scenario']==scenario]):
  im=Image.open(root/(Path(f['file']).stem+'.png')).convert('RGB');out.paste(im,(col*640,82+row*574+45))
  d.text((col*640+12,82+row*574+6),f"{scenario} / {f['actor']} / t={f['t']}",fill='#111111',font=small)
out.save(root/'offline-motion-contact-sheet.jpg',quality=91)
# Compact three-phase punch strip for readable attachment-scale review.
punch=frames and [f for f in frames if f['scenario']=='punch-r1-backward']
strip=Image.new('RGB',(1920,610),'#eeeefa');draw=ImageDraw.Draw(strip)
draw.text((18,12),'OFFLINE RUNTIME MESH: Wild24 punch / coach / fixed camera (not gameplay)',font=font,fill='#111111')
for col,f in enumerate(punch):
 strip.paste(Image.open(root/(Path(f['file']).stem+'.png')).convert('RGB'),(col*640,80));draw.text((col*640+20,48),f"t={f['t']}  {'park' if f['t']==0 else 'extended' if f['t']<1 else 'returned'}",font=font,fill='#111111')
strip.save(root/'offline-punch-before-mid-after.jpg',quality=93)
