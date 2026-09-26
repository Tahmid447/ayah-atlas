/* One private workspace for Atlas and Famous Quran. No service-role key is used. */
(() => {
  'use strict';
  const raw = window.localStorage;
  const allowed = k => /^(atlas\.(?:language|translationLanguages|theme|position|bookmarks|notebook|talk|recoveredTalk|readMode|arabicSize|lineSpacing|pageImage|editions|ink\.[a-zA-Z0-9_.:-]+)|fq[A-Za-z0-9]*|fq:(?:ayah|passage):[0-9:–-]+)$/.test(k);
  let user = null, client = null, config = {}, initialized = false, busy = false, timer;
  let status = 'Saved on this device', conflicts = {}, meta = { versions: {}, dirty: {} };
  const initialOwner = raw.getItem('_atlas/active') || 'guest';
  let owner = initialOwner;
  const prefix = () => owner === 'guest' ? '' : '_atlas/user/' + owner + '/';
  const keyFor = k => allowed(k) ? prefix() + k : k;
  const readJSON = (key, fallback) => { try { return JSON.parse(raw.getItem(key)) || fallback; } catch { return fallback; } };
  function emit(key) { window.dispatchEvent(new CustomEvent('atlas-workspace-change', { detail: { key, status, owner } })); }
  function setStatus(text) { status = text; emit(); const el = document.querySelector('#atlas-account-status'); if (el) el.textContent = text; }
  function saveMeta() { raw.setItem('_atlas/meta/' + owner, JSON.stringify(meta)); }
  function keys() {
    const result = [];
    for (let i = 0; i < raw.length; i++) { const k = raw.key(i); const name = k?.startsWith(prefix()) ? k.slice(prefix().length) : ''; if (allowed(name)) result.push(name); }
    return result;
  }
  window.AtlasStore = {
    getItem: k => raw.getItem(keyFor(k)),
    setItem(k, value) {
      value = String(value);
      if (raw.getItem(keyFor(k)) === value) return;
      raw.setItem(keyFor(k), value);
      if (allowed(k) && owner !== 'guest') { meta.dirty[k] = true; saveMeta(); setStatus('Changes saved on this device · syncing…'); schedule(); }
      emit(k);
    },
    removeItem(k) { this.setItem(k, 'null'); },
    key: i => keys()[i] || null,
    get length() { return keys().length; },
  };
  function schedule() { clearTimeout(timer); timer = setTimeout(sync, 900); }
  async function sync() {
    if (busy || !client || !user) return;
    if (!navigator.onLine) { setStatus('Offline · changes are saved on this device'); return; }
    busy = true;
    const startedOwner = owner;
    try {
      const remote = [];
      for (let offset = 0; ; offset += 500) {
        const r = await client.from('atlas_items').select('key,value,version').eq('user_id', user.id).order('key').range(offset, offset + 499);
        if (r.error) throw r.error;
        remote.push(...r.data); if (r.data.length < 500) break;
      }
      if (owner !== startedOwner) return;
      for (const item of remote) {
        if (meta.dirty[item.key]) {
          if ((meta.versions[item.key] || 0) !== item.version) conflicts[item.key] = item;
        } else if (allowed(item.key)) {
          const text = item.value?.raw ?? JSON.stringify(item.value);
          if (raw.getItem(keyFor(item.key)) !== text) { raw.setItem(keyFor(item.key), text); emit(item.key); }
          meta.versions[item.key] = item.version;
        }
      }
      for (const key of Object.keys(meta.dirty)) {
        if (conflicts[key] || !allowed(key)) continue;
        const text = raw.getItem(keyFor(key));
        // Values are JSON envelopes because some legacy preferences are raw strings.
        const value = { raw: text };
        const r = await client.rpc('atlas_save_item', { p_key: key, p_value: value, p_expected: meta.versions[key] || 0 });
        if (r.error) {
          if (r.error.code === '40001') { schedule(); continue; }
          throw r.error;
        }
        meta.versions[key] = Number(r.data);
        if (raw.getItem(keyFor(key)) === text) delete meta.dirty[key];
        saveMeta();
      }
      saveMeta();
      const n = Object.keys(conflicts).length;
      setStatus(n ? `${n} change${n > 1 ? 's' : ''} need your choice · open Account` : Object.keys(meta.dirty).length ? 'Changes pending · syncing again shortly' : 'All changes saved to your private account');
      if (Object.keys(meta.dirty).some(k => !conflicts[k])) schedule();
    } catch (e) { setStatus('Cloud sync unavailable · your device copy is safe. ' + (e.message || 'Try again when online.')); }
    finally { busy = false; }
  }
  function safeText(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function download(name, value) { const a = document.createElement('a'); const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function exportData() { download('quran-workspace-backup.json', { format: 'quran-workspace', version: 1, exported: new Date().toISOString(), items: Object.fromEntries(keys().map(k => [k, AtlasStore.getItem(k)])) }); }
  function open() {
    document.querySelector('#atlas-account')?.remove();
    const dialog = document.createElement('dialog'); dialog.id = 'atlas-account'; dialog.className = 'atlas-account';
    dialog.innerHTML = `<header><div><span class="atlas-kicker">ONE QURAN WORKSPACE</span><h2>Your private account</h2></div><button type="button" aria-label="Close account" data-close>×</button></header><p>Reader, recitations, annotations, bookmarks, and notes—together.</p><p id="atlas-account-status" role="status">${safeText(status)}</p><div id="atlas-account-controls"></div><hr><button type="button" data-export>Export my workspace backup</button><p class="atlas-hint">Guest work stays on this device. Signing out switches back to your separate guest workspace. Account copies remain available only to that account.</p>`;
    document.body.append(dialog); dialog.querySelector('[data-close]').onclick = () => dialog.close(); dialog.querySelector('[data-export]').onclick = exportData;
    const controls = dialog.querySelector('#atlas-account-controls');
    if (!client) controls.innerHTML = '<p>Account setup is not connected yet. You can annotate and export a device backup now.</p>';
    else if (!user) {
      controls.innerHTML = `${!config.google ? '<p><strong>Public sign-in activation is pending.</strong> Google setup will be completed later. Email access currently works only for this project’s members.</p>' : ''}<form><label>Email address<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label><button type="submit">Send a sign-in code</button></form><p class="atlas-hint">No password needed. This connection currently uses the project’s configured email delivery service.</p>${config.google ? '<button data-google>Continue with Google</button>' : ''}<form data-code hidden><label>Code from your email<input name="code" inputmode="numeric" autocomplete="one-time-code" required minlength="6" maxlength="10"></label><button>Verify & sign in</button></form>`;
      let email = '';
      controls.querySelector('form').onsubmit = async e => {
        e.preventDefault(); const b = e.target.querySelector('button'); b.disabled = true;
        email = new FormData(e.target).get('email');
        const r = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/' } });
        setStatus(r.error ? r.error.message : 'Check your email for the sign-in link or code.');
        if (!r.error) controls.querySelector('[data-code]').hidden = false; b.disabled = false;
      };
      controls.querySelector('[data-code]').onsubmit = async e => { e.preventDefault(); const r = await client.auth.verifyOtp({ email, token: new FormData(e.target).get('code'), type: 'email' }); if (r.error) setStatus(r.error.message); };
      controls.querySelector('[data-google]')?.addEventListener('click', () => client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/' } }));
    } else {
      controls.innerHTML = `<p>Signed in as <strong>${safeText(user.email || 'Quran reader')}</strong></p><div class="atlas-actions"><button data-sync>Sync now</button><button data-import>Copy guest work into this account</button><button data-out>Sign out</button></div><p class="atlas-hint">Copying guest work fills empty entries only. Existing account notes are preserved.</p><div data-conflicts></div>`;
      controls.querySelector('[data-sync]').onclick = async () => { await sync(); open(); };
      controls.querySelector('[data-out]').onclick = async () => { const r = await client.auth.signOut(); if (r.error) setStatus(r.error.message); };
      controls.querySelector('[data-import]').onclick = () => {
        let n = 0;
        for (let i = 0; i < raw.length; i++) { const k = raw.key(i); if (allowed(k) && AtlasStore.getItem(k) === null) { AtlasStore.setItem(k, raw.getItem(k)); n++; } }
        setStatus(`Copied ${n} guest entries. Existing account entries were kept.`); schedule();
      };
      for (const [key, remote] of Object.entries(conflicts)) {
        const section = document.createElement('section'); section.className = 'atlas-conflict';
        section.innerHTML = `<strong>${safeText(key)}</strong><p>This entry changed on another device. Export both copies before choosing which to use.</p><div class="atlas-actions"><button data-both>Download both copies</button><button data-local>Keep this device’s version</button><button data-remote>Use cloud version</button></div>`;
        section.querySelector('[data-both]').onclick = () => download('quran-conflict-backup.json', { key, device: AtlasStore.getItem(key), cloud: remote.value });
        section.querySelector('[data-local]').onclick = () => { raw.setItem('_atlas/conflict/' + owner + '/' + key + '/' + Date.now(), JSON.stringify(remote)); meta.versions[key] = remote.version; delete conflicts[key]; saveMeta(); schedule(); open(); };
        section.querySelector('[data-remote]').onclick = () => { raw.setItem('_atlas/conflict/' + owner + '/' + key + '/' + Date.now(), AtlasStore.getItem(key)); raw.setItem(keyFor(key), remote.value?.raw ?? JSON.stringify(remote.value)); meta.versions[key] = remote.version; delete meta.dirty[key]; delete conflicts[key]; saveMeta(); emit(key); open(); };
        controls.querySelector('[data-conflicts]').append(section);
      }
    }
    dialog.showModal();
  }
  async function init() {
    try {
      config = await fetch('/api/account-config').then(r => r.json());
      if (config.url && config.key && window.supabase) {
        client = window.supabase.createClient(config.url, config.key, { auth: { flowType: 'pkce', detectSessionInUrl: true } });
        const result = await client.auth.getSession(); user = result.data.session?.user || null;
        owner = user?.id || 'guest'; raw.setItem('_atlas/active', owner);
        meta = readJSON('_atlas/meta/' + owner, { versions: {}, dirty: {} });
        client.auth.onAuthStateChange((_event, session) => {
          const next = session?.user?.id || 'guest';
          if (initialized && next !== owner) { raw.setItem('_atlas/active', next); location.reload(); }
        });
        if (user) await sync();
      } else { owner = 'guest'; raw.setItem('_atlas/active', owner); }
    } catch { owner = 'guest'; raw.setItem('_atlas/active', owner); setStatus('Account connection unavailable · device workspace ready'); }
    initialized = true; emit(); return { owner, changed: initialOwner !== owner };
  }
  window.AtlasWorkspace = { open, sync, exportData, get owner() { return owner; }, get status() { return status; }, ready: init() };
  window.addEventListener('online', sync);
  window.addEventListener('focus', sync);
  window.addEventListener('storage', e => {
    if (e.key === '_atlas/active' && e.newValue !== owner) location.reload();
    else if (e.key?.startsWith('_atlas/meta/' + owner)) meta = readJSON(e.key, meta);
    else if (e.key?.startsWith(prefix())) emit(e.key.slice(prefix().length));
  });
})();
