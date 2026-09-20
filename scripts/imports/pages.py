#!/usr/bin/env python3
"""Discover only image URLs actually linked by the supplied reference site."""
from corpus import download,ROOT,digest,NOW
import concurrent.futures,json,re,sqlite3
from html.parser import HTMLParser
BASE='https://www.equraninstitute.com/quranreading/'
class Index(HTMLParser):
 def __init__(self):super().__init__();self.surah=None;self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='article' and 'data-search' in a:self.surah=int(a['data-search'].split()[0])
  if tag=='a' and a.get('class')=='reading-link':self.links.append((self.surah,a['href'],a['aria-label']))
p=Index();p.feed(download(BASE+'index.htm','reference/index.html').decode())
def section(t):
 s,path,label=t;b=download(BASE+path,'reference/'+path)
 imgs=re.findall(r'<img[^>]+src=["\'](quraan_images/[^"\']+)["\']',b.decode(),re.I)
 assert imgs,path
 nums=re.findall(r'Ayat (\d+) to (\d+)',label)
 return {'id':path,'surah':s,'section':label,'paths':imgs,'source_url':BASE+path,'start_ayah':int(nums[0][0]) if nums else 1,'end_ayah':int(nums[0][1]) if nums else None}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:sections=list(ex.map(section,p.links))
paths=sorted({path for x in sections for path in x['paths']})
print('Discovered',len(sections),'sections and',len(paths),'original image assets',flush=True)
public=ROOT/'public'/'reference';public.mkdir(exist_ok=True)
def asset(path):
 b=download(BASE+path,'reference/'+path);assert b[:3]==b'GIF' or b[:8]==b'\x89PNG\r\n\x1a\n' or b[:2]==b'\xff\xd8',path
 name=path.split('/')[-1];(public/name).write_bytes(b)
 return {'path':'/reference/'+name,'url':BASE+path,'sha256':digest(b),'bytes':len(b)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:assets=list(ex.map(asset,paths))
for s in sections:s['images']=json.dumps(['/reference/'+p.split('/')[-1] for p in s.pop('paths')])
(ROOT/'data'/'reference-pages.json').write_text(json.dumps({'retrieved':NOW,'sections':sections,'assets':assets,'reuse':'Source does not identify edition/copyright. User-authorized local reference use; obtain redistribution terms before publishing this image pack.','mapping':'Section-to-surah mapping is from publisher link labels. No inferred per-ayah image bounding boxes. Reference p566 is visually verified as 68:7–31.'},ensure_ascii=False,indent=2))
print('Downloaded and verified',len(assets),'images;',sum(a['bytes'] for a in assets),'bytes',flush=True)
