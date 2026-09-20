import sqlite3,hashlib,json,unittest,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def sha(s):return hashlib.sha256(s if isinstance(s,bytes) else s.encode()).hexdigest()
class CorpusIntegrity(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.db=sqlite3.connect(ROOT/'data/corpus.sqlite');cls.db.row_factory=sqlite3.Row
 def test_exact_inventory(self):
  meta=ET.parse(ROOT/'data/raw/tanzil-metadata.xml').getroot();expected={f"{s.attrib['index']}:{a}" for s in meta.find('suras') for a in range(1,int(s.attrib['ayas'])+1)}
  actual={r[0] for r in self.db.execute('select key from ayat')};self.assertEqual(expected,actual);self.assertEqual(len(actual),6236)
 def test_source_characters_and_checksums(self):
  for v in self.db.execute('select * from ayat'):
   self.assertEqual(sha(v['text']),v['checksum']);self.assertNotIn('\ufffd',v['text'])
  for p in self.db.execute('select * from passages'):
   self.assertEqual(sha(p['text']+'\n'+p['footnotes']),p['checksum']);self.assertNotIn('\ufffd',p['text'])
 def test_translations_complete_independently(self):
  expected={x[0] for x in self.db.execute('select key from ayat')}
  for e in self.db.execute("select e.id from editions e join sources s on s.id=e.source_id where s.type='translation'"):
   actual={x[0] for x in self.db.execute('select key from passages where edition_id=?',[e[0]])};self.assertEqual(expected,actual)
 def test_tafsir_explicit_full_coverage(self):
  expected={x[0] for x in self.db.execute('select key from ayat')}
  for e in self.db.execute("select e.id from editions e join sources s on s.id=e.source_id where s.type='tafsir'"):
   actual={x[0] for x in self.db.execute('select r.start_key from tafsir_ranges r join passages p on p.id=r.passage_id where p.edition_id=?',[e[0]])};self.assertEqual(expected,actual)
 def test_shared_tafsir_is_not_fabricated_individual_entries(self):
  count=self.db.execute("select count(*) from passages where edition_id like 'ibn-kathir-en%'").fetchone()[0];self.assertLess(count,6236);self.assertGreater(count,1000)
 def test_raw_files_preserved(self):
  for e in self.db.execute("select e.*,s.id source_key from editions e join sources s on s.id=e.source_id where s.publisher='QuranEnc'"):
   self.assertEqual(sha((ROOT/'data/raw'/(e['source_key']+'.sqlite')).read_bytes()),e['checksum'])
 def test_reference_image_hashes(self):
  m=json.loads((ROOT/'data/reference-pages.json').read_text());self.assertEqual(len({s['surah'] for s in m['sections']}),114)
  for a in m['assets']:self.assertEqual(sha((ROOT/'public'/a['path'].lstrip('/')).read_bytes()),a['sha256'])
 def test_basmalah_and_juz(self):
  self.assertIsNone(self.db.execute("select basmalah from ayat where key='9:1'").fetchone()[0]);self.assertEqual(self.db.execute('select count(distinct juz) from ayat').fetchone()[0],30)
 def test_database_constraints(self):
  self.assertEqual(self.db.execute('pragma integrity_check').fetchone()[0],'ok');self.assertEqual(self.db.execute('pragma foreign_key_check').fetchall(),[])
 def test_no_scholarly_review_fabricated(self):self.assertEqual(self.db.execute("select count(*) from reviews where status='approved'").fetchone()[0],0)
 def test_benchmark_numbering_is_from_original_pages(self):
  for id in ['muslim:2589','bukhari:33']:
   r=self.db.execute('select * from numbering_aliases where id=?',[id]).fetchone();self.assertIsNotNone(r);self.assertIn('Reference',r['verification']);self.assertTrue((ROOT/'data/raw'/(id.replace(':','-')+'.html')).exists())
if __name__=='__main__':unittest.main(verbosity=2)
