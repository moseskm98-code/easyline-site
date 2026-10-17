import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import { CATALOG_FILTER_DEFAULTS, readCatalogFilters, catalogQuery, parseItemQuantity } from '../src/customer-state.mjs';
import { PROTOCOLS } from '../assets/menu-data-6F787N4k.js';

const helper = await readFile(new URL('../src/customer-state.mjs',import.meta.url),'utf8');
const retained = await readFile(new URL('../src/retained-content.js',import.meta.url),'utf8');
const logic = await readFile(new URL('../src/site-logic.js',import.meta.url),'utf8');

function appFixture() {
  const context = { URLSearchParams, encodeURIComponent, innerWidth:1440,
    document:{ querySelector:() => null, getElementById:() => null },
    requestAnimationFrame:callback => callback(), CustomEvent:class {},
    DCLogic:class { setState(patch,callback) { this.state={...this.state,...(typeof patch === 'function' ? patch(this.state) : patch)}; callback?.(); } },
  };
  const setLocation = path => { context.location=new URL(path,'http://127.0.0.1:4190'); context.window.location=context.location; };
  context.window={scrollY:0, scrollTo:(_x,y) => {context.window.scrollY=y;}, dispatchEvent:() => {}, matchMedia:() => ({matches:false})};
  context.history={state:{},replaceState:(state,_title,url) => {context.history.state=state;setLocation(url);},pushState:(state,_title,url) => {context.history.state=state;setLocation(url);}};
  setLocation('/assortment');
  vm.createContext(context);
  vm.runInContext(helper.replace(/^export /gm,'')+'\n'+retained+'\n'+logic+'\nglobalThis.TestApp=Component;',context);
  const app=new context.TestApp();
  app.state.data={protocols:PROTOCOLS};
  return {app,context,setLocation};
}

test('catalog URLs restore all preferences and a search containing reserved characters',() => {
  const filters={category:'burgers',protein:'chicken',wholegrain:true,search:'сыр & курица?'};
  assert.deepEqual(readCatalogFilters(catalogQuery(filters)),filters);
  assert.deepEqual(readCatalogFilters('?protein=invalid&wholegrain=no'),CATALOG_FILTER_DEFAULTS);
  assert.equal(catalogQuery(CATALOG_FILTER_DEFAULTS),'');
});

test('direct quantities accept zero and team orders but reject unsafe or fractional input',() => {
  for (const [value,quantity] of [['0',0],['20',20],['99',99],[' 8 ',8]]) assert.equal(parseItemQuantity(value),quantity);
  for (const value of ['', '-1','1.5','100','1e2','NaN','9007199254740993']) assert.equal(parseItemQuantity(value),null,value);
});

test('cart continuation and browser return preserve the actual catalog controller state',() => {
  const {app,context,setLocation}=appFixture();
  app.state.route='assortment';
  app.setCatalogFilters({category:'burgers',protein:'chicken',wholegrain:true,search:'куриц'});
  const catalogUrl=context.location.href;
  app.go('cart');
  setLocation(catalogUrl);
  app.syncRouteFromLocation();
  assert.equal(app.state.category,'burgers');
  assert.equal(app.state.protein,'chicken');
  assert.equal(app.state.wholegrain,true);
  assert.equal(app.state.search,'куриц');
  app.go('cart');
  app.resumeCatalog({preventDefault(){}});
  assert.equal(context.location.href,catalogUrl);
  assert.equal(app.state.protein,'chicken');
});

test('the application draft survives policy navigation without persistent storage',() => {
  const {app,setLocation}=appFixture();
  app.state.route='program';
  app.renderVals().setApplicationName({target:{value:'Тест'}});
  app.renderVals().setApplicationPhone({target:{value:'НЕ ОТПРАВЛЯТЬ'}});
  app.renderVals().setApplicationPrivacy({target:{checked:true}});
  app.go('legal','privacy');
  setLocation('/programs/protokol-28');
  app.syncRouteFromLocation();
  const values=app.renderVals();
  assert.equal(values.applicationName,'Тест');
  assert.equal(values.applicationPhone,'НЕ ОТПРАВЛЯТЬ');
  assert.equal(values.applicationPrivacy,true);
});

test('application CTA transfers focus and honors reduced motion',() => {
  const {app,context}=appFixture();
  app.state.route='program';
  let focused=false,behavior;
  context.document.getElementById=id => id==='application-title' ? {focus:() => {focused=true;}} : id==='application' ? {scrollIntoView:options => {behavior=options.behavior;}} : null;
  context.window.matchMedia=() => ({matches:true});
  app.openOrder({preventDefault(){}});
  assert.equal(focused,true);
  assert.equal(behavior,'auto');
  assert.equal(app._applicationFocusPending,false);
});
