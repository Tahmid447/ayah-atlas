interface Window {
 AtlasStore: Pick<Storage,'getItem'|'setItem'|'removeItem'|'key'|'length'>;
 AtlasWorkspace: {ready:Promise<{owner:string;changed:boolean}>;open:()=>void;sync:()=>Promise<void>;owner:string;status:string};
 AtlasAnnotations:{mount:(img:HTMLImageElement,id:string)=>()=>void};
}
