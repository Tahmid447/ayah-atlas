/* Shared by the print UI and the PDF layout verification. */
((root)=>{root.AtlasPagePDF=(data,width,height)=>{
 if(!(width>0&&height>0))throw Error('The page image is not ready.');
 const doc=new root.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
 const scale=Math.min(190/width,277/height),w=width*scale,h=height*scale;
 doc.addImage(data,'PNG',(210-w)/2,(297-h)/2,w,h,undefined,'FAST');
 doc.setProperties({title:'My annotated Quran page',subject:'Original page with personal study marks'});
 return doc;
};})(typeof window==='undefined'?globalThis:window);
