"""Label offline mesh renders. Requires Pillow; never a browser screenshot.
python3 scripts/recovery/assemble-trip-sweep-preview.py /tmp/trip-sweep-preview
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json,sys
root=Path(sys.argv[1]); report=json.loads((root/'report.json').read_text())
fontpath='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font=ImageFont.truetype(fontpath,21);small=ImageFont.truetype(fontpath,15);title=ImageFont.truetype(fontpath,25)
phases=lambda t:'Parked' if t==0 or t>=.98 else 'Aiming' if t<.12 else 'Extending' if t<.20 else 'Preparing low sweep' if t<.26 else 'Low sweep + contact-led fall' if t<.60 else 'Raising working section' if t<.66 else 'Retracting' if t<.80 else 'Returning'
by_scenario={}
for item in report['exports']:by_scenario.setdefault(item['scenario'],{})[item['t']]=item
scenarios=[('wild:5-banana','Wild 5 native / banana'),('wild:17-hotel','Wild 17 telescopic / hotel')]
times=sorted(set.intersection(*[set(by_scenario[k]) for k,_ in scenarios]));frames=[]
for t in times:
 canvas=Image.new('RGB',(1280,650),'#183936');draw=ImageDraw.Draw(canvas)
 draw.text((22,12),'OFFLINE RUNTIME MESH PREVIEW',font=title,fill='#fff1c9')
 draw.text((22,46),'Evaluated runtime meshes, not browser pixels. Cream tile is a QA height guide; venue omitted.',font=small,fill='#bdd3cc')
 for i,(key,label) in enumerate(scenarios):
  entry=by_scenario[key][t];im=Image.open(root/(Path(entry['file']).stem+'.png')).convert('RGB');canvas.paste(im,(640*i,85));draw.text((640*i+20,82),label,font=font,fill='#193c36')
 draw.rectangle((20,615,1260,621),fill='#49665f');draw.rectangle((20,615,20+1240*t,621),fill='#ecaa76')
 draw.text((20,628),f'Beat {t:.0%}  |  {phases(t)}  |  End-frame hold is preview-only',font=small,fill='#f8efd7')
 frames.append(canvas)
durations=[max(100,int((times[i+1]-t)*2000)) if i+1<len(times) else 800 for i,t in enumerate(times)]
frames[0].save(root/'trip-sweep-offline-preview.gif',save_all=True,append_images=frames[1:],duration=durations,loop=0,optimize=True)
frames[times.index(.45) if .45 in times else len(frames)//2].save(root/'trip-sweep-contact-preview.png')
print(root/'trip-sweep-offline-preview.gif')
