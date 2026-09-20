import unittest,sys,tempfile
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/imports'))
from safe_urls import validate,SafeRedirect
from corpus import download
class ImportSafety(unittest.TestCase):
 def test_rejects_internal_file_credential_and_unapproved_urls(self):
  for url in ['http://127.0.0.1','https://169.254.169.254/latest','file:///etc/passwd','https://quranenc.com.evil.test/','https://u:p@quranenc.com/','https://quranenc.com:9000/']:
   with self.assertRaises(ValueError):validate(url,resolve=False)
 def test_rejects_private_dns(self):
  with patch('safe_urls.socket.getaddrinfo',return_value=[(2,1,6,'',('127.0.0.1',443))]):
   with self.assertRaises(ValueError):validate('https://quranenc.com/')
 def test_rejects_redirect_before_following(self):
  with self.assertRaises(ValueError):SafeRedirect().redirect_request(None,None,302,'',{},'https://127.0.0.1/secret')
 def test_missing_provider_preserves_last_valid_corpus(self):
  import corpus,urllib.error
  active=corpus.ROOT/'data/corpus.sqlite';before=active.stat().st_size
  with tempfile.TemporaryDirectory() as d,patch.object(corpus,'RAW',Path(d)),patch.object(corpus,'open_source',side_effect=urllib.error.URLError('offline')),patch.object(corpus.time,'sleep'):
   with self.assertRaises(urllib.error.URLError):download('https://quranenc.com/test','interrupted.json')
   self.assertFalse((Path(d)/'interrupted.json').exists())
  self.assertEqual(active.stat().st_size,before)
if __name__=='__main__':unittest.main(verbosity=2)
