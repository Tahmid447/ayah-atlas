#!/usr/bin/env python3
"""Install a validated corpus into the project's fresh local D1 preview database."""
from pathlib import Path
import sqlite3,json
root=Path(__file__).resolve().parents[1]
source=root/'data/corpus.sqlite'
assert source.exists(),'Run python3 scripts/imports/corpus.py first'
c=sqlite3.connect(source)
manifest=json.loads((root/'data/reference-pages.json').read_text())
c.execute('delete from display_mappings')
for x in manifest['sections']:
 c.execute('insert into display_mappings (id,surah,section,images,source_url,start_ayah,end_ayah) values (?,?,?,?,?,?,?)',[x[k] for k in ['id','surah','section','images','source_url','start_ayah','end_ayah']])
c.commit()
assert c.execute('pragma integrity_check').fetchone()[0]=='ok'
assert c.execute('select count(*) from ayat').fetchone()[0]==6236
paths=[p for p in (root/'.wrangler/state/v3/d1').glob('**/*.sqlite') if p.name!='metadata.sqlite']
assert len(paths)==1, f'Expected one local D1 database; found {len(paths)}. Initialize with wrangler.local.json first.'
d=sqlite3.connect(paths[0])
tables={x[0] for x in d.execute("select name from sqlite_master where type='table'")}
# Refuse destructive replacement if editorial/private data have been written.
for table in ['reviews','notebooks','talks','research_sessions']:
 if table in tables:assert d.execute('select count(*) from '+table).fetchone()[0]==0,'Export '+table+' before a fresh corpus replacement.'
c.backup(d);d.close();c.close()
print('Local D1 corpus ready:',paths[0])
