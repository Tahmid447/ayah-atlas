(() => {
 const job=new URL(location.href).searchParams.get('job');
 const parent=window.opener, status=document.querySelector('#status');
 const receive=event=>{
  if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='atlas-print-page'||event.data?.job!==job)return;
  const data=event.data;if(typeof data.png!=='string'||!data.png.startsWith('data:image/png;base64,'))return;
  const img=document.querySelector('#page');
  img.onload=()=>{document.querySelector('#print').disabled=false;document.querySelector('#pdf').disabled=false;status.textContent='A4 portrait · the original page and your marks stay together. Turn off browser headers and footers for a clean copy.';};
  img.src=data.png;
  document.querySelector('#page-id').textContent=data.id+' · '+data.memorization;
  document.querySelector('#note-text').textContent=data.note||'No page note added.';
  window.removeEventListener('message',receive);window.opener=null;
 };
 window.addEventListener('message',receive);
 if(parent&&job)parent.postMessage({type:'atlas-print-ready',job},location.origin);else status.textContent='Open Print marked page from the reader to prepare a new preview.';
 document.querySelector('#notes').onchange=e=>document.body.classList.toggle('include-notes',e.target.checked);
 document.querySelector('#print').onclick=()=>window.print();
 document.querySelector('#pdf').onclick=()=>{try{const img=document.querySelector('#page');AtlasPagePDF(img.src,img.naturalWidth,img.naturalHeight).save('my-marked-quran-page.pdf');status.textContent='Page PDF prepared. It includes the original page and your marks. Use Print for separate page notes.';}catch(e){status.textContent='PDF could not be prepared: '+e.message;}};
})();
