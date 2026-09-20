"""Live local retrieval evaluation. Expected references are verified in the stored editions, not final-answer fixtures."""
import json,urllib.request,urllib.parse,sqlite3,os,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('TEST_BASE_URL','http://localhost:4173')
specs=[
 ('backbiting',['gossip and backbiting','গীবত ও চোগলখুরি','陰口と噂話'],['49:12','h:5326']),
 ('hypocrisy',['hypocrisy','মুনাফিক','偽善'],['h:sunnah-bukhari-33']),
 ('honesty',['truthfulness','সত্যবাদিতা','正直'],['9:119']),
 ('charity',['charity','দান','施し'],['2:261']),
 ('justice',['justice','ন্যায়বিচার','公正'],['4:135']),
 ('parents',['parents','পিতা-মাতা','両親'],['17:23']),
 ('patience',['patience','ধৈর্য','忍耐'],['2:153']),
 ('gratitude',['gratitude','কৃতজ্ঞতা','感謝'],['14:7']),
 ('repentance',['repentance','তাওবা','悔い改め'],['39:53']),
 ('moses',['Moses','মূসা','ムーサー'],['20:9']),
]
db=sqlite3.connect(ROOT/'data/corpus.sqlite');db.row_factory=sqlite3.Row
results=[]
transient_failures=[]
for topic,queries,expected in specs:
 for lang,q in zip(['en','bn','ja'],queries):
  start=time.time();hits=[];reported=None
  # Evaluate recall at the first 54 ranked results; do not claim comprehensive relevance.
  for page in range(1,4):
   req=urllib.request.Request(BASE+'/api/search?'+urllib.parse.urlencode({'q':q,'page':page}),headers={'CF-Connecting-IP':'research-evaluation-'+lang})
   for attempt in range(3):
    try:
     with urllib.request.urlopen(req,timeout=60) as r:d=json.load(r)
     break
    except urllib.error.HTTPError as e:
     if e.code not in (429,503) or attempt==2:raise
     transient_failures.append({'query':q,'page':page,'status':e.code})
     time.sleep(2**attempt)
   reported=d['total'];hits+=d['results']
   if page*d['pageSize']>=reported:break
  keys=[r['key'] for r in hits];found=[k for k in expected if k in keys]
  # Every returned reference must resolve to immutable stored content.
  unresolved=[]
  for h in hits:
   if h['kind']=='quran':known=db.execute('select key from ayat where key=?',[h['key']]).fetchone()
   else:known=db.execute('select id from passages where id=?',[h['id']]).fetchone()
   if not known:unresolved.append(h['id'])
  result={'topic':topic,'language':lang,'query':q,'expected':expected,'found':found,'recallAt54':len(found)/len(expected),'positions':{k:keys.index(k)+1 for k in found},'referencesResolved':not unresolved,'returned':len(hits),'totalResults':reported,'seconds':round(time.time()-start,2)}
  results.append(result);print(lang,q,result['positions'],'recall',result['recallAt54'],flush=True)
summary={'transientFailures':transient_failures,'queries':len(results),'meanRecallAt54':sum(r['recallAt54'] for r in results)/len(results),'allReferencesResolve':all(r['referencesResolved'] for r in results),'semanticSupport':'Not evaluated by a human; reference resolution is not proof of interpretive support.','method':'30 queries, 10 source-verified benchmark themes, three languages; expected refs are evaluation seeds only; exact source search uses full corpus FTS and topic aliases.','results':results}
(ROOT/'docs/test-results/research-evaluation.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in summary.items() if k!='results'},ensure_ascii=False,indent=2))
