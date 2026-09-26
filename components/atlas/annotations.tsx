"use client";
import { useEffect, useRef } from 'react';
export function AnnotatedPage({src,alt}:{src:string;alt:string}) {
  const host=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let cleanup:(()=>void)|undefined;let cancelled=false;
    const img=document.createElement('img');img.src=src;img.alt=alt;
    host.current?.appendChild(img);
    void window.AtlasWorkspace.ready.then(()=>{
      if(!cancelled)cleanup=window.AtlasAnnotations.mount(img,'equran:'+src.split('/').pop());
    });
    return()=>{cancelled=true;cleanup?.();img.remove();};
  },[src,alt]);
  return <div ref={host}/>;
}
