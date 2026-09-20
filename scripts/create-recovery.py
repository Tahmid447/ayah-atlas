#!/usr/bin/env python3
"""Create a self-contained recovery archive, excluding secrets and reinstallable caches."""
from pathlib import Path
import hashlib,json,tarfile,sys,datetime
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root.parent
out.mkdir(parents=True,exist_ok=True)
label=sys.argv[2] if len(sys.argv)>2 else datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')
if not all(c.isalnum() or c in '-_' for c in label):raise SystemExit('Invalid archive label')
archive=out/f'ayah-atlas-recovery-{label}.tar.gz'
if archive.exists():raise SystemExit('Archive already exists; choose a new checkpoint label')
def digest(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
skip={'node_modules','.wrangler','dist','.next','.vinext','__pycache__','.agents','.codex'}
def selected(p):
 rel=p.relative_to(root)
 if any(part in skip for part in rel.parts):return False
 if p.name.endswith(('.pyc','.tsbuildinfo','.log')):return False
 if (p.name.startswith('.env') and p.name!='.env.example') or p.name.startswith('.dev.vars'):return False
 if rel.parts[0]=='.sites-runtime' and str(rel)!='.sites-runtime/execution-profile.json':return False
 return True
files=sorted(p for p in root.rglob('*') if p.is_file() and not p.is_symlink() and selected(p))
manifest={str(p.relative_to(root)):digest(p) for p in files if str(p.relative_to(root))!='data/recovery-manifest.json'}
manifest_path=root/'data/recovery-manifest.json';manifest_path.write_text(json.dumps({'created':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':manifest},indent=2))
if manifest_path not in files:files.append(manifest_path)
with tarfile.open(archive,'w:gz',compresslevel=5) as t:
 for p in files:t.add(p,arcname='ayah-atlas/'+str(p.relative_to(root)),recursive=False)
h=digest(archive)
(out/'SHA256SUMS.txt').write_text(h+'  '+archive.name+'\n')
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'files':len(files),'sha256':h}),flush=True)
