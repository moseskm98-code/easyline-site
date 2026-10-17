import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const bundle=await readFile(new URL('../assets/index-Dwt8uDxZ.js',import.meta.url),'utf8');
test('the full mobile DOM audit runs only when explicitly requested',()=>{
  const start=bundle.indexOf('(()=>{var B;const j=document.documentElement');
  const end=bundle.indexOf('(()=>{if(window.__EASYLINE_MOTION_OWNER__',start);
  assert.ok(start>=0&&end>start);
  const queries=[];
  const document={documentElement:{dataset:{}},querySelector:()=>null,getElementById:()=>null,
    querySelectorAll:selector=>{queries.push(selector);return[];},addEventListener(){}};
  const window={innerWidth:390,matchMedia:()=>({matches:false,addEventListener(){}}),
    __EASYLINE_STATIC_HEAD_SYNC__:()=>true,addEventListener(){},requestAnimationFrame:()=>1};
  vm.runInNewContext(bundle.slice(start,end),{document,window,history:{pushState(){},replaceState(){}},
    MutationObserver:class{observe(){}},getComputedStyle:()=>({})});
  assert.ok(!queries.some(selector=>selector.includes('main *')));
  window.__EASYLINE_QA__.auditMobileTypography();
  assert.ok(queries.some(selector=>selector.includes('main *')));
});
