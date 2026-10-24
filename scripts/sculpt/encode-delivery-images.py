"""Re-encode unmodified evidence images for a manageable delivery download."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[2]/'docs/sculpt-20261024';out=root/'delivery-images';out.mkdir(exist_ok=True)
for folder in ['glb-previews','hero-previews']:
 dest=out/folder;dest.mkdir(exist_ok=True)
 for p in (root/folder).glob('*.png'):
  q=dest/(p.stem+'.webp')
  if not q.exists() or q.stat().st_mtime<p.stat().st_mtime:Image.open(p).save(q,quality=95 if folder=='hero-previews' else 92,method=0)
 print('DONE',folder,flush=True)
for folder in ['game-before','game-complete','game-final','game-final-forms','game-form-switches']:
 dest=out/folder;dest.mkdir(exist_ok=True)
 for p in (root/folder).glob('*.png'):Image.open(p).convert('RGB').save(dest/(p.stem+'.jpg'),quality=92,optimize=True,subsampling=0)
 print('DONE',folder,flush=True)
