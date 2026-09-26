import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync('public/shared/workspace.js','utf8');
async function workspace({user=null,initial={},remote=[]}={}){
 const data=new Map(Object.entries(initial)),writes=[];
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),key:i=>[...data.keys()][i],get length(){return data.size;}};
 const sdk={auth:{getSession:async()=>({data:{session:user?{user:{id:user,email:'test@example.invalid'}}:null}}),onAuthStateChange:()=>{}},from:()=>({select:()=>({eq:()=>({order:()=>({range:async()=>({data:remote,error:null})})})})}),rpc:async(_,{p_key,p_value,p_expected})=>{writes.push({key:p_key,value:p_value,expected:p_expected});return{data:p_expected+1,error:null};}};
 const win={localStorage:storage,dispatchEvent:()=>{},addEventListener:()=>{},supabase:{createClient:()=>sdk}};
 const context=vm.createContext({window:win,localStorage:storage,document:{querySelector:()=>null},navigator:{onLine:true},CustomEvent:class{},setTimeout:()=>0,clearTimeout:()=>{},fetch:async()=>({json:async()=>({url:'https://example.invalid',key:'publishable'})}),location:{reload:()=>{}},console});
 vm.runInContext(script,context);await win.AtlasWorkspace.ready;
 return{data,writes,win,remote};
}
test('sign-in isolates guest and another account data without automatic upload',async()=>{
 const {win,writes}=await workspace({user:'B',initial:{'atlas.notebook':'["guest"]','_atlas/user/A/atlas.notebook':'["private-A"]'}});
 assert.equal(win.AtlasStore.getItem('atlas.notebook'),null);assert.equal(writes.length,0);
});
test('account changes sync with version and preserve legacy raw strings',async()=>{
 const {win,writes,data}=await workspace({user:'A'});win.AtlasStore.setItem('fqLang','bn');await win.AtlasWorkspace.sync();
 assert.deepEqual(JSON.parse(JSON.stringify(writes[0])), {key:'fqLang',value:{raw:'bn'},expected:0});assert.equal(data.get('_atlas/user/A/fqLang'),'bn');
});
test('remote changes and local changes conflict instead of overwriting',async()=>{
 const {win,writes,remote}=await workspace({user:'A'});win.AtlasStore.setItem('atlas.ink.equran:p566.gif','{"note":"local"}');remote.push({key:'atlas.ink.equran:p566.gif',value:{raw:'{"note":"remote"}'},version:2});await win.AtlasWorkspace.sync();
 assert.equal(writes.length,0);assert.match(win.AtlasWorkspace.status,/need your choice/);assert.equal(win.AtlasStore.getItem('atlas.ink.equran:p566.gif'),'{"note":"local"}');
});
test('signed-out session restores guest workspace without exposing account cache',async()=>{
 const {win}=await workspace({initial:{'_atlas/active':'A','_atlas/user/A/atlas.talk':'private','atlas.talk':'guest'}});assert.equal(win.AtlasStore.getItem('atlas.talk'),'guest');
});
test('annotation payload rejects invalid coordinates and script-valued colors',()=>{
 const window={};vm.runInNewContext(fs.readFileSync('public/shared/annotations.js','utf8'),{window});const a=window.AtlasAnnotations;
 const value={version:1,note:'study',strokes:[{tool:'pen',color:'#243c3a',width:3,points:[{x:.2,y:.3,p:.7}]}]};assert.equal(a.valid(value),true);value.strokes[0].points[0].x=Infinity;assert.equal(a.valid(value),false);value.strokes[0].points[0].x=.2;value.strokes[0].color='url(script)';assert.equal(a.valid(value),false);
 assert.equal(a.distance({x:.5,y:.5},{x:0,y:.5},{x:1,y:.5},1.5),0);
});
