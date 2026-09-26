(async()=>{
  await AtlasWorkspace.ready;
  const start=localStorage.getItem('_atlas/famous-owner');
  if(start!==AtlasWorkspace.owner){localStorage.setItem('_atlas/famous-owner',AtlasWorkspace.owner);location.reload();return;}
  const mounted=new Map();
  function annotate(){
    for(const [img,dispose] of mounted)if(!img.isConnected){dispose();mounted.delete(img);}
    document.querySelectorAll('.mushaf-page img:not([data-annotated])').forEach(img=>{const url=new URL(img.src,location.href);const name=url.searchParams.get('image')||url.pathname.split('/').pop();if(/^p\d+(?:_[a-zA-Z0-9]+)?\.(gif|png|jpe?g)$/.test(name))mounted.set(img,AtlasAnnotations.mount(img,'equran:'+name));});
  }
  const observer=new MutationObserver(annotate);observer.observe(document.body,{childList:true,subtree:true});annotate();
  Q.account=()=>AtlasWorkspace.open();
  window.addEventListener('atlas-workspace-change',e=>{if(e.detail?.key?.startsWith('fq'))Q.favs=new Set(Q.get('fqFav',[]));});
})();
