/* Independent, device-only drafts. Reader changes require explicit application. */
(() => {
  const empty = raw => {try{const v=JSON.parse(raw);return v===null||(v.version===1&&Array.isArray(v.strokes)&&!v.strokes.length&&v.note===''&&(!v.memorization||v.memorization==='reading'));}catch{return false;}};
  const same = (a,b) => a===b||(empty(a)&&empty(b));
  window.AtlasStudioStore = (reader, local, prefix) => ({
    getItem(key) {
      const saved=local.getItem(prefix+key);
      if(saved!==null)return JSON.parse(saved).value;
      const value=reader.getItem(key);
      local.setItem(prefix+key,JSON.stringify({base:value,value}));
      return value;
    },
    setItem(key,value) {
      const saved=local.getItem(prefix+key);
      const base=saved===null?reader.getItem(key):JSON.parse(saved).base;
      local.setItem(prefix+key,JSON.stringify({base,value}));
    },
    apply(key) {
      const saved=local.getItem(prefix+key);
      if(saved===null)return;
      const draft=JSON.parse(saved), current=reader.getItem(key);
      if(!same(current,draft.base)&&!same(current,draft.value))throw Error('Your reader has newer marks. They were not overwritten. Download your study copy before reconciling the two versions.');
      reader.setItem(key,draft.value);
      local.setItem(prefix+key,JSON.stringify({base:draft.value,value:draft.value}));
    },
  });
})();
