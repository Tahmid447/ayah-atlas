#!/usr/bin/env python3
"""Create a self-contained recovery archive, excluding secrets and reinstallable caches."""
from pathlib import Path
import hashlib,json,tarfile,sys,datetime
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root.parent
out.mkdir(parents=True,exist_ok=True)
archive=out/'ayah-atlas-recovery-2026-09-20.tar.gz'
skip={'node_modules','.wrangler','dist','.next','.vinext','__pycache__','.agents','.codex'}
def selected(p):
 rel=p.relative_to(root)
 if any(part in skip for part in rel.parts):return False
 if p.name.endswith(('.pyc','.tsbuildinfo','.log')):return False
 if (p.name.startswith('.env') and p.name!='.env.example') or p.name.startswith('.dev.vars'):return False
 if rel.parts[0]=='.sites-runtime' and str(rel)!='.sites-runtime/execution-profile.json':return False
 return True
files=sorted(p for p in root.rglob('*') if p.is_file() and not p.is_symlink() and selected(p))
manifest={str(p.relative_to(root)):hashlib.file_digest(p.open('rb'),'sha256').hexdigest() for p in files if str(p.relative_to(root))!='data/recovery-manifest.json'}
manifest_path=root/'data/recovery-manifest.json';manifest_path.write_text(json.dumps({'created':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':manifest},indent=2))
if manifest_path not in files:files.append(manifest_path)
with tarfile.open(archive,'w:gz',compresslevel=5) as t:
 for p in files:t.add(p,arcname='ayah-atlas/'+str(p.relative_to(root)),recursive=False)
h=hashlib.file_digest(archive.open('rb'),'sha256').hexdigest()
(out/'SHA256SUMS.txt').write_text(h+'  '+archive.name+'\n')
print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'files':len(files),'sha256':h}),flush=True)
