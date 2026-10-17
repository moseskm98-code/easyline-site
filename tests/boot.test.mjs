import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source=await readFile(new URL('../assets/first-frame-init.js',import.meta.url),'utf8');
function fixture(){
  const nodes=new Map(),timers=new Map();let main=null,callback,observing=false;
  const context={document:{documentElement:{dataset:{}},readyState:'complete',
    querySelector:selector=>selector==='#dc-root main'?main:null,
    getElementById:id=>nodes.get(id)||null,
    createElement:()=>({append(){},setAttribute(){},addEventListener(){},remove(){nodes.delete(this.id);}}),
    body:{appendChild:node=>nodes.set(node.id,node)}},
    MutationObserver:class{constructor(fn){callback=fn;}observe(){observing=true;}disconnect(){observing=false;}},
    window:{setTimeout:fn=>{timers.set(1,fn);return 1;},clearTimeout:id=>timers.delete(id),location:{reload(){}}}};
  vm.runInNewContext(source,context);
  return{context,nodes,fail:()=>{for(const fn of [...timers.values()])fn();},recover:()=>{main={classList:{remove(){}}};if(observing)callback();}};
}
test('a slow renderer replaces the error screen when it eventually becomes ready',()=>{
  const f=fixture();f.fail();assert.ok(f.nodes.has('el-boot-fallback'));
  f.recover();assert.equal(f.context.document.documentElement.dataset.elBootState,'ready');
  assert.equal(f.nodes.has('el-boot-fallback'),false);
});
test('a ready renderer does not later show a timeout fallback',()=>{
  const f=fixture();f.recover();f.fail();
  assert.equal(f.context.document.documentElement.dataset.elBootState,'ready');
  assert.equal(f.nodes.size,0);
});
