/* Fixed-origin read-only proxy for the original public eQuran scans. */
const ORIGIN = 'https://www.equraninstitute.com';
const ROOT = ORIGIN + '/quranreading/';
const imageRE = /^p\d{1,3}(?:_[a-zA-Z0-9]+)?\.(gif|png|jpe?g)$/;
const sectionRE = /^\d{3}_[a-zA-Z0-9_]+\.htm$/;
async function load(url, maxBytes) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const r = await fetch(url, { signal: controller.signal, redirect: 'error', headers: { Accept: '*/*' } });
    if (!r.ok) throw Error('Source returned HTTP ' + r.status);
    if (Number(r.headers.get('content-length') || 0) > maxBytes) throw Error('Source file too large');
    const chunks = []; let size = 0;
    for await (const chunk of r.body) { size += chunk.length; if (size > maxBytes) { controller.abort(); throw Error('Source file too large'); } chunks.push(chunk); }
    return { body: Buffer.concat(chunks), type: r.headers.get('content-type') || '' };
  } finally { clearTimeout(timer); }
}
module.exports = async function(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return res.status(405).json({error:'GET only'}); }
  const image = req.query.image, section = req.query.section;
  try {
    if (typeof image === 'string' && imageRE.test(image) && !section) {
      const r = await load(ROOT + 'quraan_images/' + image, 5 * 1024 * 1024);
      if (!/^image\/(gif|png|jpeg)/i.test(r.type)) throw Error('Source did not return an image');
      res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
      res.setHeader('Content-Type',r.type.split(';')[0]); return res.status(200).send(r.body);
    }
    if (typeof section !== 'string' || !sectionRE.test(section) || image) return res.status(400).json({error:'Invalid scan section'});
    const {body} = await load(ROOT + section, 1024 * 1024), html = body.toString('utf8');
    const names = [...new Set([...html.matchAll(/(?:src|href)\s*=\s*["'][^"']*quraan_images\/(p[\w.]+)["']/gi)].map(m=>m[1]).filter(n=>imageRE.test(n)))];
    if (!names.length) throw Error('No original scanned pages found');
    res.setHeader('Cache-Control','public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json({ source:ROOT+section, section, images:names.map(name=>({name, original:ROOT+'quraan_images/'+name, url:'/api/mushaf?image='+encodeURIComponent(name)})), checkedAt:new Date().toISOString() });
  } catch(e) { res.setHeader('Cache-Control','no-store'); return res.status(502).json({error:'Original scan source unavailable', detail:e.message}); }
};
module.exports.imageRE=imageRE; module.exports.sectionRE=sectionRE;
