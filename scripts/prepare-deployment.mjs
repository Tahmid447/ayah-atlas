import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const manifest = JSON.parse(fs.readFileSync('data/corpus-deployment.json'));
const data = gunzipSync(Buffer.concat(fs.readdirSync('data/corpus-parts').filter(name=>/^part-[0-9]{2}\.bin$/.test(name)).sort().map(name=>fs.readFileSync(path.join('data/corpus-parts',name)))));
if (createHash('sha256').update(data).digest('hex') !== manifest.sha256 || data.length !== manifest.bytes) throw Error('Corpus verification failed');
fs.writeFileSync('data/corpus.sqlite', data);
for (const script of ['build.mjs', 'upgrade.mjs', 'community-build.mjs'])
  execFileSync(process.execPath, [script], { cwd: 'vendor/famous-quran', stdio: 'inherit' });
fs.mkdirSync('public/famous', { recursive: true });
const assetNames=fs.readdirSync('vendor/famous-quran/public');
const mergedRevision=createHash('sha256').update(fs.readFileSync(import.meta.filename)).update(fs.readFileSync('public/shared/workspace.js')).update(fs.readFileSync('public/shared/annotations.js')).digest('hex').slice(0,16);
for (const name of assetNames) {
  let data = fs.readFileSync(path.join('vendor/famous-quran/public', name));
  if (/\.(html|js|css|webmanifest)$/.test(name)) {
    let text = data.toString();
    for (const asset of assetNames) {
      for (const quote of ['\"', "'", '`']) text=text.replaceAll(quote+'/'+asset+quote, quote+'/famous/'+asset+quote);
    }
    if (name==='sw.js') text=text.replaceAll("'/'","'/famous/'").replace(/fq-shell-[a-f0-9]+/g,'fq-shell-merged-'+mergedRevision).replace("self.clients.claim();","self.clients.claim();");
    if (name==='manifest.webmanifest') text=text.replaceAll('"/"','"/famous/"');
    if (name.endsWith('.js') && name !== 'sw.js') text = text.replaceAll('localStorage.', 'AtlasStore.');
    if (name === 'index.html') {
      text = text.replace('</head>', '<link rel="stylesheet" href="/shared/workspace.css"><script src="/shared/supabase.js"></script><script src="/shared/workspace.js"></script><script src="/shared/annotations.js"></script></head>');
      text = text.replace('<nav class="nav-actions">', '<nav class="nav-actions"><a class="btn" href="/">Atlas reader & research</a>');
      text = text.replace('</body>', '<script src="/shared/famous-bridge.js"></script></body>');
    }
    if (name === 'account.js') text = 'Q.account=()=>AtlasWorkspace.open();';
    data = Buffer.from(text);
  }
  fs.writeFileSync(path.join('public/famous', name), data);
}
console.log('Verified corpus prepared; Famous Quran integrated at /famous/');
