#!/usr/bin/env python3
"""Versioned, resumable publisher imports; validate in staging before promotion."""
import argparse, concurrent.futures, datetime, hashlib, html, json, os, re, shutil, sqlite3, time, urllib.request, urllib.error, xml.etree.ElementTree as ET
from pathlib import Path
from safe_urls import validate,open_source
ROOT=Path(__file__).resolve().parents[2]
RAW=ROOT/'data'/'raw'; RAW.mkdir(parents=True,exist_ok=True)
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat()
ALLOWED={'tanzil.net','quranenc.com','api.quran.com','hadeethenc.com','www.equraninstitute.com','sunnah.com'}
def digest(b): return hashlib.sha256(b if isinstance(b,bytes) else b.encode()).hexdigest()
def download(url,name):
    from urllib.parse import urlparse
    validate(url,resolve=False)
    path=RAW/name
    if path.exists() and path.stat().st_size>20:return path.read_bytes()
    for attempt in range(4):
      try:
        req=urllib.request.Request(url,headers={'User-Agent':'AyahAtlas-LocalResearch/0.1'})
        with open_source(req,timeout=45) as r:
          if urlparse(r.url).hostname not in ALLOWED:raise ValueError('Unapproved redirect')
          b=r.read(50000000)
        path.parent.mkdir(parents=True,exist_ok=True)
        path.with_suffix(path.suffix+'.part').write_bytes(b)
        path.with_suffix(path.suffix+'.part').replace(path)
        return b
      except (urllib.error.URLError,TimeoutError):
        if attempt==3: raise
        time.sleep(2**attempt)
def norm(s):
    s=re.sub(r'<[^>]+>',' ',s)
    s=html.unescape(s).lower()
    s=re.sub('[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06edـ]','',s)
    s=re.sub('[أإآٱ]','ا',s).replace('ى','ي')
    return re.sub(r'\s+',' ',s).strip()
def plain(s):
    return html.unescape(re.sub(r'<[^>]+>','', re.sub(r'</(?:p|h[1-6]|div)>|<br\s*/?>','\n',s)))
def insert(c,table,**v):
    c.execute('INSERT INTO '+table+' ('+','.join('"'+k+'"' for k in v)+') VALUES ('+','.join('?' for _ in v)+')',list(v.values()))
def source(c,key,title,kind,lang,author,publisher,url,version,b,count,scope,terms,metadata=None):
    eid=key+'@'+version+'-'+digest(b)[:12]
    insert(c,'sources',id=key,title=title,type=kind,author=author,publisher=publisher,language=lang,url=url,terms=terms,scope=scope)
    insert(c,'editions',id=eid,source_id=key,version=version,retrieved=NOW,checksum=digest(b),status='imported; machine-validated; not human-reviewed',count=count,active=1,metadata=json.dumps(metadata or {},ensure_ascii=False))
    return eid

def import_all():
    staging=ROOT/'data'/'staging.sqlite'
    staging.unlink(missing_ok=True)
    c=sqlite3.connect(staging)
    for m in sorted((ROOT/'drizzle').glob('*.sql')): c.executescript(m.read_text())
    meta=download('https://tanzil.net/res/text/metadata/quran-data.xml','tanzil-metadata.xml')
    qurl='https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=xml&marks=true&sajdah=true&rub=true&alef=true&tatweel=true&agree=true'
    raw=download(qurl,'tanzil-uthmani-1.1.xml'); qm=ET.fromstring(meta); qt=ET.fromstring(raw)
    surahs=[]
    for s in qm.find('suras'):
      a=s.attrib
      row=dict(id=int(a['index']),name=a['tname'],arabic=a['name'],meaning=a['ename'],count=int(a['ayas']),revelation=a['type'])
      insert(c,'surahs',**row); surahs.append(row)
    expected={f"{s['id']}:{a}" for s in surahs for a in range(1,s['count']+1)}
    assert len(expected)==6236 and len(surahs)==114
    (ROOT/'data'/'surahs.json').write_text(json.dumps(surahs,ensure_ascii=False))
    copyright=raw.decode().split('<!--')[1].split('-->')[0]
    (ROOT/'data'/'TANZIL-LICENSE.txt').write_text(copyright)
    eid=source(c,'tanzil','Quran · Uthmani','quran','ar','Tanzil Project','Tanzil Project','https://tanzil.net/download/','1.1',raw,6236,'Hafs; 114 surahs; 6,236 numbered ayat. Basmalah counted at 1:1; unnumbered openings stored separately; none at surah 9.','https://tanzil.net/docs/Text_License',{'copyright':copyright,'metadataChecksum':digest(meta),'reading':'Hafs'})
    def section(tag,s,a):
      starts=[(int(x.attrib['sura']),int(x.attrib['aya']),int(x.attrib['index'])) for x in qm.find(tag)]
      return max((n for ss,aa,n in starts if (ss,aa)<=(s,a)),default=1)
    for s in qt:
      sn=int(s.attrib['index'])
      for a in s:
        an=int(a.attrib['index']); txt=a.attrib['text'];key=f'{sn}:{an}'
        assert key in expected and '\ufffd' not in txt
        insert(c,'ayat',key=key,surah=sn,ayah=an,text=txt,basmalah=a.attrib.get('bismillah'),juz=section('juzs',sn,an),page=section('pages',sn,an),edition_id=eid,checksum=digest(txt),normalized=norm(txt))
    assert c.execute('select count(*) from ayat').fetchone()[0]==6236
    print('Validated Tanzil: 114 surahs / 6,236 ayat',flush=True)
    home=download('https://quranenc.com/en/home','quranenc-home.html').decode()
    catalog=json.loads(download('https://quranenc.com/api/v1/translations/list','quranenc-catalog.json'))['translations']
    catalog={s['key']:s for s in catalog}
    specs=[('english_rwwad','en','translation','Rowwad Translation Center'),('english_saheeh','en','translation','Noor International Center'),('bengali_zakaria','bn','translation','Dr. Abu Bakr Muhammad Zakaria'),('bengali_rwwad','bn','translation','Rowwad Translation Center'),('japanese_saeedsato','ja','translation','Saeed Sato'),('bengali_mokhtasar','bn','tafsir','Tafsir Center for Quranic Studies'),('japanese_mokhtasar','ja','tafsir','Tafsir Center for Quranic Studies'),('arabic_mokhtasar','ar','tafsir','Tafsir Center for Quranic Studies')]
    def fetch_translation(spec):
      k=spec[0];url=f'https://quranenc.com/downloads/sqlite/{k}.sqlite';return spec,download(url,k+'.sqlite')
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex:
      for spec,b in ex.map(fetch_translation,specs):
        k,lang,kind,author=spec
        item=catalog.get(k)
        if item: version=item['version']; title=item['title']
        else:
          pos=home.find('href="https://quranenc.com/en/browse/'+k+'"')
          assert pos>=0,k+' missing in publisher catalog'
          block=home[home.rfind('<div class="tab_card ',0,pos):pos]
          versions=re.findall(r'V(\d+\.\d+\.\d+)',block)
          assert versions,k+' version absent'
          version=versions[-1];title=plain(re.findall(r'<h2[^>]*>(.*?)</h2>',block,re.S)[-1]).strip()
        rows=sqlite3.connect(RAW/(k+'.sqlite')).execute('select sura,aya,translation,footnotes from translations').fetchall()
        keys=[f'{s}:{a}' for s,a,_,_ in rows]
        assert set(keys)==expected and len(keys)==len(set(keys))==6236,(k,len(keys))
        assert all(t and '\ufffd' not in t for _,_,t,_ in rows)
        se=source(c,k,title,kind,lang,author,'QuranEnc',f'https://quranenc.com/en/browse/{k}',version,b,len(rows),'Full Quran coverage; publisher-mapped individual ayah entries. Sunni collection; does not represent all interpretive traditions.','https://quranenc.com/en/home/api/',{'catalogMethod':'API' if item else 'publisher homepage; API catalog omitted this edition','download':f'https://quranenc.com/downloads/sqlite/{k}.sqlite'})
        for s,a,t,f in rows:
          key=f'{s}:{a}';pid=se+':'+key
          insert(c,'passages',id=pid,edition_id=se,kind=kind,key=key,surah=s,ayah=a,language=lang,text=t,footnotes=f or '',checksum=digest(t+'\n'+(f or '')),url=f'https://quranenc.com/en/browse/{k}/{s}#{a}',normalized=norm(t+' '+(f or '')))
          if kind=='tafsir': insert(c,'tafsir_ranges',id=pid,passage_id=pid,start_key=key,end_key=key)
        print('Validated',k,version,len(rows),flush=True)
    # Quran.com's identified English tafsir, preserve grouped source passages and verse mappings.
    res=json.loads(download('https://api.quran.com/api/v4/resources/tafsirs?language=en','qurancom-tafsirs.json'))
    resource=next(x for x in res['tafsirs'] if x['id']==169)
    def fetch_tafsir(s):
      collected=[];page=1
      while True:
        d=json.loads(download(f'https://api.quran.com/api/v4/tafsirs/169/by_chapter/{s}?page={page}&per_page=300',f'ibnkathir/{s}-{page}.json'))
        collected+=d['tafsirs'];p=d.get('pagination',{})
        if not p.get('next_page'):break
        page=p['next_page']
      return collected
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
      tafsir=[t for rows in ex.map(fetch_tafsir,range(1,115)) for t in rows]
    covered={t['verse_key'] for t in tafsir}
    assert covered==expected,('English tafsir coverage',len(covered))
    b=json.dumps(tafsir,ensure_ascii=False).encode()
    se=source(c,'ibn-kathir-en',resource['name'],'tafsir','en',resource['author_name'],'Quran.com / Quran Foundation','https://quran.com/en/tafsirs/en-tafisr-ibn-kathir','snapshot-'+NOW[:10],b,6236,'English abridgment; Sunni commentary. Upstream print edition/version not supplied by endpoint. Range grouping follows identical source passage, not new per-ayah commentary.','https://quran.com/about',resource)
    groups={}
    for t in tafsir:
      key=t['verse_key'];text=t['text'];h=digest(text);groups.setdefault(h,{'text':text,'keys':[]})['keys'].append(key)
    for h,g in groups.items():
      keys=sorted(set(g['keys']),key=lambda k:tuple(map(int,k.split(':'))));s,a=map(int,keys[0].split(':'));pid=se+':'+h[:16]
      insert(c,'passages',id=pid,edition_id=se,kind='tafsir',key=keys[0],surah=s,ayah=a,language='en',text=g['text'],footnotes='',checksum=digest(g['text']+'\n'),url='https://quran.com/'+keys[0].replace(':','/')+'/tafsirs/en-tafisr-ibn-kathir',normalized=norm(g['text']))
      # Explicit mappings for every covered ayah, plus original shared range metadata.
      for key in keys: insert(c,'tafsir_ranges',id=pid+':'+key,passage_id=pid,start_key=key,end_key=key)
    print('Validated English Ibn Kathir: 6,236 mapped ayat;',len(groups),'shared passages',flush=True)
    # Curated HADITH scope: complete API categories for speech and hypocrisy.
    cats=[287,98,636];items={}
    for cat in cats:
      page=1
      while True:
        d=json.loads(download(f'https://hadeethenc.com/api/v1/hadeeths/list/?language=en&category_id={cat}&per_page=100&page={page}',f'hadith-category-{cat}-{page}.json'))
        for x in d['data']:items[x['id']]=x
        if page>=d['meta']['last_page']:break
        page+=1
    tasks=[(k,lang) for k,x in items.items() for lang in ['en','bn','ja','ar'] if lang in x['translations']]
    def get_hadith(t):
      k,lang=t;d=download(f'https://hadeethenc.com/api/v1/hadeeths/one/?language={lang}&id={k}',f'hadith/{k}-{lang}.json');return k,lang,json.loads(d)
    hs={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
      for k,lang,d in ex.map(get_hadith,tasks):hs.setdefault(k,{})[lang]=d
    hb=json.dumps(hs,ensure_ascii=False).encode()
    se=source(c,'hadeethenc','Hadith Encyclopedia · speech & hypocrisy','hadith','mul','HadeethEnc editorial team','HadeethEnc','https://hadeethenc.com/en/','snapshot-'+NOW[:10],hb,len(hs),'Selected complete categories 287, 98 and 636; not a complete hadith library. Availability varies by language. Grades are publisher-reported, not independent judgments.','https://hadeethenc.com/en/home/about',{'categories':cats,'languages':['ar','en','bn','ja']})
    for k,langs in hs.items():
      en=langs.get('en',{});ar=langs.get('ar',{})
      insert(c,'hadith',id=k,edition_id=se,title=en.get('title',''),arabic=ar.get('hadeeth',en.get('hadeeth_ar','')),attribution=en.get('attribution',''),reference=ar.get('reference',''),payload=json.dumps(langs,ensure_ascii=False))
      insert(c,'gradings',id=k+':publisher',hadith_id=k,grade=en.get('grade','Unreported'),attributed_to='HadeethEnc editorial classification',url=f'https://hadeethenc.com/en/browse/hadith/{k}')
      for lang,d in langs.items():
        txt=d.get('hadeeth','');explanation=d.get('explanation','');pid=se+':'+k+':'+lang
        insert(c,'passages',id=pid,edition_id=se,kind='hadith',key='h:'+k,surah=None,ayah=None,language=lang,text=txt,footnotes=explanation,checksum=digest(txt+'\n'+explanation),url=f'https://hadeethenc.com/{lang}/browse/hadith/{k}',normalized=norm(txt+' '+explanation+' '+d.get('title','')))
    # Exact benchmark numbering checked against original source pages, never model-generated.
    from html.parser import HTMLParser
    class Extract(HTMLParser):
      def __init__(self): super().__init__();self.stack=[];self.parts={'english':[],'arabic':[],'reference':[]}
      def handle_starttag(self,tag,attrs):
        a=dict(attrs);cl=a.get('class','');kind=next((k for k,needle in [('english','english_hadith_full'),('arabic','arabic_hadith_full'),('reference','hadith_reference')] if needle in cl),'')
        self.stack.append((tag,kind or (self.stack[-1][1] if self.stack else '')))
      def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,-1,-1):
          if self.stack[i][0]==tag: del self.stack[i:];break
      def handle_data(self,data):
        if self.stack and self.stack[-1][1]:self.parts[self.stack[-1][1]].append(data)
    for ref,k in [('muslim:2589','5326'),('bukhari:33','sunnah-bukhari-33')]:
      url='https://sunnah.com/'+ref;raw=download(url,ref.replace(':','-')+'.html');p=Extract();p.feed(raw.decode());eng=' '.join(' '.join(p.parts['english']).split());arabic=' '.join(' '.join(p.parts['arabic']).split());reference=' '.join(' '.join(p.parts['reference']).split())
      assert eng and arabic and reference,ref+' parsing failed'
      if k.startswith('sunnah-'):
        sourceid='sunnah-bukhari-33';ss=source(c,sourceid,'Sahih al-Bukhari 33','hadith','en','Imam al-Bukhari; English wording as published by Sunnah.com','Sunnah.com',url,'snapshot-'+NOW[:10],raw,1,'Single benchmark narration; English and Arabic only. No claim of complete collection coverage.','https://sunnah.com/about')
        insert(c,'hadith',id=k,edition_id=ss,title='The signs of a hypocrite',arabic=arabic,attribution='Sahih al-Bukhari',reference=reference,payload='{}')
        insert(c,'gradings',id=k+':collection',hadith_id=k,grade='Sahih collection; no independent per-narration grade imported',attributed_to='Collection classification',url=url)
        insert(c,'passages',id=ss+':'+k,edition_id=ss,kind='hadith',key='h:'+k,surah=None,ayah=None,language='en',text=eng,footnotes='',checksum=digest(eng+'\n'),url=url,normalized=norm(eng+' hypocrisy hypocrite'))
      insert(c,'numbering_aliases',id=ref,hadith_id=k,collection='Sahih Muslim' if 'muslim' in ref else 'Sahih al-Bukhari',number=ref.split(':')[1],scheme='Sunnah.com displayed collection numbering',url=url,verification=reference)
    print('Imported hadith:',len(hs)+1,'with publisher grades and actual benchmark pages',flush=True)
    # Derived FTS never replaces originals. Trigram index handles Japanese substrings.
    c.executescript("CREATE VIRTUAL TABLE search_fts USING fts5(id UNINDEXED, body, tokenize='unicode61 remove_diacritics 0'); CREATE VIRTUAL TABLE search_cjk USING fts5(id UNINDEXED, body, tokenize='trigram');")
    c.execute("INSERT INTO search_fts SELECT 'q:'||key,normalized FROM ayat")
    c.execute('INSERT INTO search_fts SELECT id,normalized FROM passages')
    c.execute("INSERT INTO search_cjk SELECT id,normalized FROM passages WHERE language='ja'")
    insert(c,'import_runs',id='import-'+NOW,started=NOW,completed=datetime.datetime.now(datetime.timezone.utc).isoformat(),status='validated',report=json.dumps({'ayat':6236,'translations':5,'tafsirEditions':4,'hadith':len(hs)+1,'humanReview':False}))
    c.commit()
    assert c.execute('pragma integrity_check').fetchone()[0]=='ok'
    assert not c.execute('pragma foreign_key_check').fetchall()
    c.execute('pragma optimize');c.commit()
    report={'retrieved':NOW,'ayat':6236,'surahs':114,'editions':[dict(zip(['source','version','count','sha256'],r)) for r in c.execute('select source_id,version,count,checksum from editions')],'humanReviewed':0}
    (ROOT/'data'/'coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    c.close()
    target=ROOT/'data'/'corpus.sqlite'
    if target.exists():
      archive=ROOT/'data'/'archive';archive.mkdir(exist_ok=True);shutil.copy2(target,archive/(digest(target.read_bytes())+'.sqlite'))
    os.replace(staging,target)
    print('Promoted complete corpus atomically:',target,flush=True)
if __name__=='__main__':import_all()
