import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../assets/gentle-motion.js',import.meta.url),'utf8');

function fixture() {
  const events = new Map(), frames = [], values = new Map();
  const section = top => {
    const classes = new Set();
    return { top, isConnected:true, getBoundingClientRect() { return {top:this.top,bottom:this.top+200}; },
      classList:{add:name => classes.add(name),remove:name => classes.delete(name),contains:name => classes.has(name)} };
  };
  const visible=section(100), below=section(1200), sections=[visible,below];
  const photo={isConnected:true,src:'hero.jpg',getAttribute:() => 'hero.jpg',
    parentElement:{getBoundingClientRect:() => ({top:100,bottom:500,height:400})},
    style:{setProperty:(key,value) => values.set(key,value),removeProperty:key => values.delete(key)}};
  let observe;
  const media={matches:false,addEventListener:(_type,callback) => {events.set('reduced',callback);}};
  const context={window:{innerHeight:800,scrollY:0,matchMedia:() => media,
    addEventListener:(type,callback) => events.set(type,callback)},
    document:{documentElement:{dataset:{}},addEventListener:() => {},querySelectorAll:selector => selector.includes('main section') ? sections : selector==='.el-gentle-enter' ? sections.filter(s=>s.classList.contains('el-gentle-enter')) : [photo]},
    IntersectionObserver:class {constructor(callback){observe=callback;}observe(){}unobserve(){}disconnect(){}},
    MutationObserver:class {observe(){}},requestAnimationFrame:callback => {frames.push(callback);return frames.length;}};
  context.window.IntersectionObserver=context.IntersectionObserver;
  vm.runInNewContext(source,context);
  const flush=() => {while(frames.length)frames.shift()();};
  flush();
  return {visible,below,events,values,context,media,flush,intersect:node => observe([{target:node,isIntersecting:true}])};
}

test('visible content stays still on page entry while a later scroll can animate unseen sections',() => {
  const f=fixture();
  f.intersect(f.visible);
  assert.equal(f.visible.classList.contains('el-gentle-enter'),false);
  f.events.get('easyline:navigation-start')();
  f.below.top=100;
  f.intersect(f.below);
  assert.equal(f.below.classList.contains('el-gentle-enter'),false);
  f.events.get('easyline:navigation-end')();f.flush();
  f.intersect(f.below);
  assert.equal(f.below.classList.contains('el-gentle-enter'),false);
  const fresh=fixture();fresh.below.top=750;fresh.intersect(fresh.below);
  assert.equal(fresh.below.classList.contains('el-gentle-enter'),true);
});

test('parallax starts at zero, is bounded during scrolling, and resets for navigation and reduced motion',() => {
  const f=fixture(),key='--el-gentle-photo-y';
  assert.equal(f.values.get(key),'0.00px');
  f.context.window.scrollY=100;f.events.get('scroll')();f.flush();
  assert.equal(f.values.get(key),'8.00px');
  f.events.get('resize')();f.flush();
  assert.equal(f.values.get(key),'8.00px','viewport resizing must not reset the photo offset');
  f.context.window.scrollY=1000;f.events.get('scroll')();f.flush();
  assert.equal(f.values.get(key),'14.00px');
  f.events.get('easyline:navigation-start')();
  f.context.window.scrollY=0;f.events.get('easyline:navigation-end')();f.flush();
  assert.equal(f.values.get(key),'0.00px');
  f.media.matches=true;f.events.get('reduced')();f.flush();
  assert.equal(f.values.has(key),false);
});
