#!/usr/bin/env python3
"""Initialize an empty preview DB; leave a populated database untouched."""
from pathlib import Path
import os,sqlite3,subprocess
root=Path(__file__).resolve().parents[1]
paths=[p for p in (root/'.wrangler/state/v3/d1').glob('**/*.sqlite') if p.name!='metadata.sqlite']
if any(sqlite3.connect(p).execute("SELECT COUNT(*) FROM sqlite_master WHERE name='ayat'").fetchone()[0] for p in paths):
 print('Existing local source library preserved.')
else:
 subprocess.run(['node','node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','wrangler.local.json','--command','SELECT 1'],cwd=root,check=True,env={**os.environ,'WRANGLER_SEND_METRICS':'false'})
 subprocess.run(['python3','scripts/seed-local.py'],cwd=root,check=True)
