(async()=>{
  const $=s=>document.querySelector(s),status=$('#status');
  try {
    await AtlasWorkspace.ready;
    const surah=Number(new URL(location.href).searchParams.get('surah'));
    if(!Number.isInteger(surah)||surah<1||surah>114)throw Error('Open the studio from a surah in the reader.');
    const response=await fetch('/api/chapter/'+surah);if(!response.ok)throw Error('The source pages could not be loaded. Please reload to try again.');
    const chapter=await response.json();
    const images=[...new Set(chapter.pages.flatMap(p=>JSON.parse(p.images)))].filter(s=>/^\/reference\/p\d+(?:_[a-zA-Z0-9]+)?\.(gif|png|jpe?g)$/.test(s));
    if(!images.length)throw Error('No original pages are available for this surah.');
    const prefix='_atlas/studio/'+AtlasWorkspace.owner+'/'+surah+'/',store=AtlasStudioStore(AtlasStore,localStorage,prefix);
    const key=i=>'atlas.ink.equran:'+images[i].split('/').pop();
    let index=Math.max(0,Math.min(images.length-1,Number(localStorage.getItem(prefix+'page'))||0)),dispose;
    $('#title').textContent=chapter.surah.name+' · annotation studio';document.title=chapter.surah.name+' · annotation studio';$('#reader').href='/?verse='+surah+':1';
    images.forEach((src,i)=>{const option=document.createElement('option');option.value=i;option.textContent=(i+1)+' / '+images.length+' · '+src.split('/').pop();$('#pages').append(option);});
    function show(next){
      dispose?.(); index=next;localStorage.setItem(prefix+'page',String(index));
      const host=$('#canvas-page');host.replaceChildren();const img=document.createElement('img');img.src=images[index];img.alt=chapter.surah.name+' — original page '+(index+1);host.append(img);
      dispose=AtlasAnnotations.mount(img,'equran:'+images[index].split('/').pop(),{store,savedMessage:'Separate study copy saved on this device · reader unchanged'});
      $('#pages').value=String(index);$('#previous').disabled=index===0;$('#next').disabled=index===images.length-1;
      status.textContent='Page '+(index+1)+' of '+images.length+' · separate device copy';
    }
    $('#previous').onclick=()=>show(Math.max(0,index-1));$('#next').onclick=()=>show(Math.min(images.length-1,index+1));$('#pages').onchange=e=>show(Number(e.target.value));
    $('#apply').onclick=()=>{try{dispose.flush();store.apply(key(index));$('#canvas-page .atlas-ink-help').textContent='Applied to your reader. Further studio edits stay separate.';status.textContent='This page’s marks and note were applied to your personal reader. Original Quran text is unchanged.';}catch(e){status.textContent=e.message;}};
    $('#download').onclick=()=>{dispose.flush();const items=Object.fromEntries(images.map((_,i)=>[key(i),store.getItem(key(i))]));const url=URL.createObjectURL(new Blob([JSON.stringify({format:'atlas-surah-study',version:1,surah,exported:new Date().toISOString(),items},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='surah-'+surah+'-study-copy.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Study-copy backup prepared. PDF and PNG exports are in the page toolbar.';};
    let touch;
    $('#canvas-page').addEventListener('touchstart',e=>{touch=e.touches.length===1&&$('#canvas-page [data-tool="navigate"]').getAttribute('aria-pressed')==='true'?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
    $('#canvas-page').addEventListener('touchend',e=>{if(!touch||e.changedTouches.length!==1)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;touch=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)show(Math.max(0,Math.min(images.length-1,index+(dx<0?1:-1))));},{passive:true});
    $('#canvas-page').addEventListener('touchcancel',()=>{touch=null;},{passive:true});
    show(index);for(const id of ['#pages','#apply','#download'])$(id).disabled=false;
  }catch(e){status.textContent=e.message||'Studio unavailable. Your saved copies remain on this device.';}
})();
