/* Original pages remain untouched. Coordinates are normalized to the image. */
(() => {
  'use strict';
  const COLORS = ['#243c3a','#137d70','#246bd2','#a44090','#d44838','#d3a31a'];
  const clamp = n => Math.max(0, Math.min(1, n));
  function distance(p, a, b, ratio) {
    const x=p.x,y=p.y*ratio, ax=a.x,ay=a.y*ratio,bx=b.x,by=b.y*ratio;
    const t=clamp(((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2||1));
    return Math.hypot(x-ax-t*(bx-ax),y-ay-t*(by-ay));
  }
  function valid(value) {
    return value && value.version === 1 && Array.isArray(value.strokes) && value.strokes.length <= 1500 && typeof value.note === 'string' && value.note.length <= 12000 && value.strokes.every(s => ['pen','highlight','line','arrow','rectangle','ellipse'].includes(s.tool) && /^#[a-f\d]{6}$/i.test(s.color) && Number.isFinite(s.width) && s.width >= 1 && s.width <= 40 && Array.isArray(s.points) && s.points.length <= 12000 && s.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1 && Number.isFinite(p.p)));
  }
  function mount(img, id) {
    if (img.dataset.annotated) return () => {};
    img.dataset.annotated = 'true';
    const key = 'atlas.ink.' + id.replace(/[^a-zA-Z0-9_.:-]/g,'_');
    const shell=document.createElement('section'); shell.className='atlas-annotation';
    img.before(shell);
    const toolbar=document.createElement('div'); toolbar.className='atlas-ink-toolbar'; toolbar.setAttribute('aria-label','Page annotation tools');
    toolbar.innerHTML=`<div class="atlas-ink-title"><span>PAGE STUDIO</span><button data-palette aria-expanded="false">Study · show creative tools</button></div><div class="atlas-ink-row"><button data-tool="navigate" aria-pressed="true">↕ Navigate</button><button data-tool="pen" aria-pressed="false">✎ Pen</button><button data-tool="highlight" aria-pressed="false">▰ Highlight</button><button data-tool="erase" aria-pressed="false">⌫ Eraser</button><button data-undo aria-label="Undo annotation" disabled>↶ Undo</button><button data-redo aria-label="Redo annotation" disabled>↷ Redo</button><button data-print>Print marked page</button></div><div class="atlas-ink-row">${COLORS.map((c,i)=>`<button class="atlas-swatch" data-color="${c}" aria-label="${['Charcoal','Teal','Blue','Purple','Red','Gold'][i]} ink" aria-pressed="${i===0}" style="--swatch:${c}"></button>`).join('')}<label>Width <input data-width type="range" min="1" max="12" value="3" aria-label="Ink width"></label><label><input type="checkbox" data-finger> Draw with finger</label></div><div class="atlas-ink-row atlas-creative" hidden><button data-tool="line">╱ Line</button><button data-tool="arrow">↗ Arrow</button><button data-tool="rectangle">□ Box</button><button data-tool="ellipse">○ Circle</button><label>Custom color <input type="color" value="${COLORS[0]}" data-custom aria-label="Custom ink color"></label><button data-export>Save marked page</button></div><p class="atlas-ink-help" role="status">Navigate to scroll or zoom. Choose a tool for Pencil or mouse; finger drawing is optional.</p>`;
    const stage=document.createElement('div');stage.className='atlas-ink-stage';shell.append(toolbar,stage);stage.append(img);
    const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Annotation drawing surface');canvas.setAttribute('role','img');stage.append(canvas);
    const notes=document.createElement('details');notes.className='atlas-page-notes';notes.innerHTML='<summary>Page notes & memorization</summary><label>My note<textarea rows="3" maxlength="12000" placeholder="A reflection, a difficult phrase, or what to revise next…"></textarea></label><label>Memorization <select><option value="reading">Reading</option><option value="learning">Learning</option><option value="reviewing">Reviewing</option><option value="memorized">Memorized</option></select></label><p>Notes and marks are personal study aids, separate from the printed Quran text.</p>';shell.append(notes);
    const empty=()=>({version:1,strokes:[],note:'',memorization:'reading'});
    let state=empty(), undo=[], redo=[], tool='navigate',color=COLORS[0],width=3,finger=false,current=null,pointer=null,erased=false,beforeErase=null;
    const ctx=canvas.getContext('2d'); const help=toolbar.querySelector('.atlas-ink-help');
    function message(s){help.textContent=s;}
    function load(){try{const saved=JSON.parse(AtlasStore.getItem(key)||'null');if(saved&&!valid(saved)){message('This page backup could not be read. Export your workspace before changing it.');return;}state=saved||empty();notes.querySelector('textarea').value=state.note;notes.querySelector('select').value=state.memorization||'reading';undo=[];redo=[];draw();}catch{message('Page notes could not be loaded.');}}
    function buttons(){toolbar.querySelector('[data-undo]').disabled=!undo.length;toolbar.querySelector('[data-redo]').disabled=!redo.length;}
    function remember(){undo.push(structuredClone(state));if(undo.length>40)undo.shift();redo=[];buttons();}
    function save(){try{const text=JSON.stringify(state);if(text.length>1500000)throw Error('This page has reached its drawing limit. Export a copy before adding more.');AtlasStore.setItem(key,text);message(AtlasWorkspace.owner==='guest'?'Page saved on this device · sign in to sync':'Page saved · account sync pending');}catch(e){message(e.message||'Could not save. Export this page before leaving.');}buttons();}
    function paint(context,s,w,h){
      if(!s.points.length)return;
      const points=s.points.map(p=>({x:p.x*w,y:p.y*h,p:p.p}));const a=points[0],b=points[points.length-1];
      context.save();context.strokeStyle=s.color;context.fillStyle=s.color;context.lineCap='round';context.lineJoin='round';context.lineWidth=s.width*w/1000;
      if(s.tool==='highlight'){context.globalAlpha=.28;context.lineWidth=s.width*w/1000*5;context.beginPath();context.moveTo(a.x,a.y);for(const p of points)context.lineTo(p.x,p.y);if(points.length===1)context.lineTo(a.x+.1,a.y);context.stroke();}
      else if(s.tool==='pen'){
        if(points.length===1){context.beginPath();context.arc(a.x,a.y,Math.max(.7,s.width*w/2000*(.4+a.p)),0,Math.PI*2);context.fill();}
        for(let i=1;i<points.length;i++){const p=points[i-1],q=points[i];context.lineWidth=s.width*w/1000*(.4+(p.p+q.p)/2);context.beginPath();context.moveTo(p.x,p.y);context.lineTo(q.x,q.y);context.stroke();}
      } else {context.beginPath();if(s.tool==='rectangle')context.rect(a.x,a.y,b.x-a.x,b.y-a.y);else if(s.tool==='ellipse')context.ellipse((a.x+b.x)/2,(a.y+b.y)/2,Math.abs(b.x-a.x)/2,Math.abs(b.y-a.y)/2,0,0,Math.PI*2);else{context.moveTo(a.x,a.y);context.lineTo(b.x,b.y);if(s.tool==='arrow'){const angle=Math.atan2(b.y-a.y,b.x-a.x),size=Math.max(10,s.width*4)*w/1000;context.moveTo(b.x-size*Math.cos(angle-.5),b.y-size*Math.sin(angle-.5));context.lineTo(b.x,b.y);context.lineTo(b.x-size*Math.cos(angle+.5),b.y-size*Math.sin(angle+.5));}}context.stroke();}
      context.restore();
    }
    function draw(){const r=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,3);if(!r.width||!r.height)return;canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);for(const s of state.strokes)paint(ctx,s,r.width,r.height);if(current)paint(ctx,current,r.width,r.height);buttons();}
    const point=e=>{const r=canvas.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width),y:clamp((e.clientY-r.top)/r.height),p:e.pointerType==='pen'?Math.max(.1,e.pressure):.5};};
    function erase(p){const ratio=canvas.clientHeight/canvas.clientWidth;const keep=state.strokes.filter(s=>{let pts=s.points;if(['rectangle','ellipse'].includes(s.tool)&&pts.length>1){const a=pts[0],b=pts.at(-1);pts=s.tool==='rectangle'?[a,{x:b.x,y:a.y},b,{x:a.x,y:b.y},a]:Array.from({length:33},(_,i)=>({x:(a.x+b.x)/2+(b.x-a.x)/2*Math.cos(i*Math.PI/16),y:(a.y+b.y)/2+(b.y-a.y)/2*Math.sin(i*Math.PI/16)}));}return !pts.some((a,i)=>distance(p,a,pts[i+1]||a,ratio)<.014+s.width/1000);});if(keep.length!==state.strokes.length){state.strokes=keep;erased=true;draw();}}
    canvas.onpointerdown=e=>{
      if(tool==='navigate'||pointer!==null||e.button!==0||(e.pointerType==='touch'&&!finger))return;
      if(state.strokes.length>=1500){message('Page limit reached. Export a copy to keep your work.');return;}
      e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);
      if(tool==='erase'){beforeErase=structuredClone(state);erased=false;erase(point(e));}
      else current={id:crypto.randomUUID(),tool,color,width,points:[point(e)]};draw();
    };
    canvas.onpointermove=e=>{
      if(e.pointerId!==pointer)return;e.preventDefault();
      if(tool==='erase'){erase(point(e));return;}
      if(!current)return;
      const events=e.getCoalescedEvents?.()||[e];
      for(const ev of events){const p=point(ev);if(['pen','highlight'].includes(tool)){const prev=current.points.at(-1);if(Math.hypot(p.x-prev.x,p.y-prev.y)>.00035&&current.points.length<12000)current.points.push(p);}else current.points=[current.points[0],p];}draw();
    };
    function finish(e){if(e.pointerId!==pointer)return;pointer=null;if(current){remember();state.strokes.push(current);current=null;save();}else if(erased){undo.push(beforeErase);redo=[];save();}draw();}
    canvas.onpointerup=finish;
    canvas.onpointercancel=e=>{if(e.pointerId!==pointer)return;pointer=null;current=null;if(beforeErase&&erased)state=beforeErase;draw();message('Gesture cancelled · previous marks kept');};
    canvas.onlostpointercapture=e=>{if(pointer!==null)finish(e);};
    function selectTool(next){tool=next;canvas.style.pointerEvents=tool==='navigate'?'none':'auto';canvas.style.touchAction=finger&&tool!=='navigate'?'none':'pan-x pan-y pinch-zoom';toolbar.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===tool)));message(tool==='navigate'?'Scroll or zoom the page. Your marks remain aligned.':finger?'Finger drawing enabled. Switch to Navigate to scroll.':'Pencil or mouse draws; fingers scroll.');}
    toolbar.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>selectTool(b.dataset.tool));
    toolbar.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{color=b.dataset.color;toolbar.querySelectorAll('[data-color]').forEach(c=>c.setAttribute('aria-pressed',String(c===b)));toolbar.querySelector('[data-custom]').value=color;});
    toolbar.querySelector('[data-custom]').oninput=e=>{color=e.target.value;toolbar.querySelectorAll('[data-color]').forEach(b=>b.setAttribute('aria-pressed','false'));};
    toolbar.querySelector('[data-width]').oninput=e=>width=Number(e.target.value);
    toolbar.querySelector('[data-finger]').onchange=e=>{finger=e.target.checked;selectTool(tool);};
    toolbar.querySelector('[data-palette]').onclick=e=>{const area=toolbar.querySelector('.atlas-creative');area.hidden=!area.hidden;e.target.setAttribute('aria-expanded',String(!area.hidden));e.target.textContent=area.hidden?'Study · show creative tools':'Creative · hide extra tools';};
    toolbar.querySelector('[data-undo]').onclick=()=>{if(!undo.length)return;redo.push(structuredClone(state));state=undo.pop();notes.querySelector('textarea').value=state.note;notes.querySelector('select').value=state.memorization;save();draw();};
    toolbar.querySelector('[data-redo]').onclick=()=>{if(!redo.length)return;undo.push(structuredClone(state));state=redo.pop();notes.querySelector('textarea').value=state.note;notes.querySelector('select').value=state.memorization;save();draw();};
    toolbar.querySelector('[data-export]').onclick=()=>{try{const out=document.createElement('canvas');out.width=img.naturalWidth;out.height=img.naturalHeight;const c=out.getContext('2d');c.drawImage(img,0,0);for(const s of state.strokes)paint(c,s,out.width,out.height);out.toBlob(blob=>{if(!blob){message('Export unavailable. Use the workspace backup instead.');return;}const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=id+'-my-annotations.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');}catch{message('This publisher image cannot be exported here. Your strokes are included in the workspace backup.');}};
    toolbar.querySelector('[data-print]').onclick=()=>{
      if(!img.complete||!img.naturalWidth){message('Wait for the original page image to finish loading.');return;}
      try {
        const out=document.createElement('canvas');out.width=img.naturalWidth*2;out.height=img.naturalHeight*2;
        const context=out.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,out.width,out.height);context.drawImage(img,0,0,out.width,out.height);
        for(const stroke of state.strokes)paint(context,stroke,out.width,out.height);
        const png=out.toDataURL('image/png');
        const job=crypto.randomUUID();
        const preview=window.open('/print.html?job='+encodeURIComponent(job),'_blank');
        if(!preview){message('Allow the print preview to open, then try again.');return;}
        const receive=event=>{
          if(event.origin!==location.origin||event.source!==preview||event.data?.job!==job||event.data?.type!=='atlas-print-ready')return;
          preview.postMessage({type:'atlas-print-page',job,png,id,note:state.note,memorization:state.memorization||'reading'},location.origin);
          window.removeEventListener('message',receive);
        };
        window.addEventListener('message',receive);
        setTimeout(()=>window.removeEventListener('message',receive),120000);
        message('Print preview opened with your marks. Notes are optional on a separate page.');
      } catch { message('The image publisher blocked print export. Your marks remain safe; open the same page in the Atlas reader to print.'); }
    };
    let noteTimer;notes.querySelector('textarea').onfocus=()=>remember();notes.querySelector('textarea').oninput=e=>{state.note=e.target.value;clearTimeout(noteTimer);noteTimer=setTimeout(save,350);};notes.querySelector('select').onchange=e=>{remember();state.memorization=e.target.value;save();};
    const changed=e=>{if(e.detail?.key===key&&!pointer){const incoming=AtlasStore.getItem(key);if(incoming!==JSON.stringify(state))load();}};
    window.addEventListener('atlas-workspace-change',changed);window.addEventListener('pagehide',save);
    const observer=new ResizeObserver(draw);observer.observe(img);img.addEventListener('load',draw);selectTool('navigate');load();
    return()=>{clearTimeout(noteTimer);save();observer.disconnect();img.removeEventListener('load',draw);window.removeEventListener('atlas-workspace-change',changed);window.removeEventListener('pagehide',save);shell.before(img);shell.remove();delete img.dataset.annotated;};
  }
  window.AtlasAnnotations={mount,valid,distance};
})();
