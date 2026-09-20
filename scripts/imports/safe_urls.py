"""Restrict source ingestion and every redirect before making an outbound request."""
import ipaddress,socket,urllib.parse,urllib.request
ALLOWED={'tanzil.net','quranenc.com','api.quran.com','hadeethenc.com','www.equraninstitute.com','sunnah.com'}
def validate(url,resolve=True):
 u=urllib.parse.urlsplit(url)
 if u.scheme!='https' or u.hostname not in ALLOWED or u.username or u.password or u.port not in (None,443):raise ValueError('Unapproved source URL')
 if resolve:
  for item in socket.getaddrinfo(u.hostname,443,type=socket.SOCK_STREAM):
   address=ipaddress.ip_address(item[4][0])
   if not address.is_global:raise ValueError('Source resolves to a non-public network')
 return url
class SafeRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  validate(newurl)
  return super().redirect_request(req,fp,code,msg,headers,newurl)
def open_source(request,timeout=45):
 validate(request.full_url)
 return urllib.request.build_opener(SafeRedirect()).open(request,timeout=timeout)
