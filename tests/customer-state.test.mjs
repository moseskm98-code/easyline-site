import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import { CATALOG_FILTER_DEFAULTS, readCatalogFilters, catalogQuery, parseItemQuantity, readCatalogContext } from '../src/customer-state.mjs';
import { PROTOCOLS } from '../assets/menu-data-6F787N4k.js';

const helper = await readFile(new URL('../src/customer-state.mjs',import.meta.url),'utf8');
const retained = await readFile(new URL('../src/retained-content.js',import.meta.url),'utf8');
const logic = await readFile(new URL('../src/site-logic.js',import.meta.url),'utf8');
const builtIndex = await readFile(new URL('../index.html',import.meta.url),'utf8');
const catalogAsset = builtIndex.match(/'\/easyline-site\/assets\/(menu-catalog-[a-f0-9]+\.js)'/)[1];
const catalogModule = await import(new URL('../assets/' + catalogAsset,import.meta.url));

function appFixture() {
  const context = { URLSearchParams, encodeURIComponent, innerWidth:1440,
    document:{ querySelector:() => null, getElementById:() => null },
    requestAnimationFrame:callback => callback(), CustomEvent:class {},
    DCLogic:class { setState(patch,callback) { this.state={...this.state,...(typeof patch === 'function' ? patch(this.state) : patch)}; callback?.(); } },
  };
  const setLocation = path => { context.location=new URL(path,'http://127.0.0.1:4190'); context.window.location=context.location; };
  context.window={scrollY:0, scrollTo:(x,y) => {context.window.scrollY=typeof x === 'object' ? x.top : y;}, dispatchEvent:() => {}, matchMedia:() => ({matches:false})};
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

test('legacy bowl links open all three bowls without hidden filters and preserve the return position',() => {
  const {app,context,setLocation}=appFixture();
  setLocation('/assortment?category=bowls&protein=shrimp&wholegrain=1&q=%D0%B1%D0%BE%D1%83%D0%BB');
  app.syncRouteFromLocation();
  assert.equal(app.state.route,'bowls');
  assert.equal(context.location.pathname,'/bowls/');
  assert.equal(app.state.category,'all');
  assert.equal(app.state.wholegrain,false);
  assert.equal(app.state.protein,'all');
  assert.equal(app.state.search,'');
  assert.equal(context.location.search,'');
  context.window.scrollY=950;
  app.go('cart');
  app.resumeCatalog({preventDefault(){}});
  assert.equal(app.state.route,'bowls');
  assert.equal(context.window.scrollY,950);
  assert.equal(app.state.protein,'all');
  app.go('assortment');
  assert.equal(app.state.category,'all');
  assert.equal(app.state.protein,'all');
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

test('cross-page application scrolling follows route restoration, including delayed protocol data',() => {
  for (const delayed of [false,true]) {
    const {app,context}=appFixture(),frames=[],actions=[];
    app.state.route='reviews';
    if (delayed) app.state.data=null;
    context.requestAnimationFrame=callback => frames.push(callback);
    context.window.scrollTo=() => actions.push('route-scroll');
    context.document.getElementById=id => !app.state.data ? null
      : id==='application-title' ? {focus:() => actions.push('application-focus')}
      : id==='application' ? {scrollIntoView:() => actions.push('application-scroll')} : null;
    app.setState=(patch,callback) => {
      app.state={...app.state,...patch};
      app.componentDidUpdate();
      callback?.();
    };
    app.openOrder({preventDefault(){}});
    assert.deepEqual(actions,[],'the application must wait for route scrolling');
    while(frames.length) frames.shift()();
    if (delayed) {
      assert.deepEqual(actions,['route-scroll']);
      app.setState({data:{protocols:PROTOCOLS}});
    }
    assert.deepEqual(actions,['route-scroll','application-focus','application-scroll']);
    assert.equal(app._applicationFocusPending,false);
  }
});


test('the home menu exposes all 39 unique dishes in the requested groups',() => {
  const {app}=appFixture();
  app.catalogModule=catalogModule;
  app.state.route='home';
  app.state.catalogLoading=false;
  app.state.cart={'lunch-01':8,'assortment-08':2,'assortment-23':1};
  const values=app.renderVals();
  assert.equal(values.homeLunches.length,13);
  assert.equal(values.homeBowls.length,3);
  assert.deepEqual(Array.from(values.homeMenuGroups,group=>group.items.length),[6,7,5,2,3]);
  const items=[...values.homeLunches,...values.homeBowls,...values.homeMenuGroups.flatMap(group=>group.items)];
  assert.equal(items.length,39);
  assert.equal(new Set(items.map(item=>item.id)).size,39);
  assert.equal(values.cartCount,11);
  assert.equal(values.showCartDock,true);
  assert.ok(values.homeLunches.every(item=>item.showQuantity));
});

test('returning from the basket restores the home section and its actual scroll position',() => {
  const {app,context,setLocation}=appFixture();
  app.state.route='home';
  setLocation('/#home-burgers');
  context.window.scrollY=6842;
  app.go('cart');
  assert.equal(app.renderVals().hrefContinue,'/#home-burgers');
  app.resumeCatalog({preventDefault(){}});
  assert.equal(app.state.route,'home');
  assert.equal(context.location.hash,'#home-burgers');
  assert.equal(context.window.scrollY,6842);
  assert.equal(context.history.state.easylineCatalog.route,'home');
  context.window.scrollY=0;
  app.syncRouteFromLocation();
  assert.equal(context.window.scrollY,6842);
});

test('basket refresh retains the menu return context without browser storage',() => {
  const {app,context,setLocation}=appFixture();
  app.state.route='home';
  setLocation('/#home-burgers');
  context.window.scrollY=6842;
  app.go('cart');
  const reloaded=new context.TestApp();
  reloaded.syncRouteFromLocation();
  assert.equal(reloaded.renderVals().hrefContinue,'/#home-burgers');
  reloaded.resumeCatalog({preventDefault(){}});
  assert.equal(context.location.hash,'#home-burgers');
  assert.equal(context.window.scrollY,6842);
});

test('directory links avoid a reload redirect that would discard history state',() => {
  const {app}=appFixture();
  for (const route of ['lunches','assortment','bowls','cart','checkout','faq','reviews'])
    assert.ok(app.pathFor(route).endsWith('/'),route);
  assert.equal(app.pathFor('program','protokol-28'),'/programs/protokol-28/');
  assert.equal(app.pathFor('legal','privacy'),'/legal/privacy/');
});

test('adding with the keyboard keeps focus in the replacement quantity control',() => {
  for (const inDialog of [false,true]) {
    const {app,context}=appFixture();
    app.catalogModule=catalogModule;
    const active={isConnected:true,closest:selector => selector === '.el-product-dialog' ? (inDialog ? {} : null) : {}};
    context.document.activeElement=active;
    let focused='';
    context.document.querySelector=selector => selector.includes('.el-product-add') ? null : {focus:() => {focused=selector;}};
    const setState=app.setState.bind(app);
    app.setState=(patch,callback) => {active.isConnected=false;setState(patch,callback);};
    app.changeQuantity('assortment-08',1);
    assert.ok(focused.includes(inDialog ? '.el-product-dialog' : '[data-product-id="assortment-08"]'));
    assert.ok(focused.includes('input'));
  }
});

test('saved menu positions are reapplied after asynchronous catalog layout',() => {
  const {app,context,setLocation}=appFixture(), frames=[];
  setLocation('/#home-burgers');
  context.history.state={easylineCatalog:{route:'home',scroll:6842,hash:'#home-burgers'}};
  context.requestAnimationFrame=callback => frames.push(callback);
  // The loading page cannot yet accommodate the saved scroll position.
  context.window.scrollTo=({top}) => {context.window.scrollY=app.catalogModule ? top : Math.min(top,400);};
  app.syncRouteFromLocation();
  while(frames.length) frames.shift()();
  assert.equal(context.window.scrollY,400);
  app.catalogModule=catalogModule;
  app.restoreCatalogPosition();
  while(frames.length) frames.shift()();
  assert.equal(context.window.scrollY,6842);
});

test('return history accepts only menu routes and bounded non-personal state',() => {
  assert.equal(readCatalogContext({route:'https://example.com'}),null);
  assert.equal(readCatalogContext(null),null);
  assert.deepEqual(readCatalogContext({route:'home',scroll:Infinity,hash:'https://example.com',name:'synthetic'}),
    {route:'home',filters:{...CATALOG_FILTER_DEFAULTS},scroll:0,hash:'',filtersOpen:false});
});

test('resizing closes the mobile disclosure before the desktop navigation appears',() => {
  const {app,context}=appFixture();
  app.syncRouteFromLocation=app.syncCatalogChrome=app.loadProtocol=app.loadCatalog=() => {};
  context.window.addEventListener=() => {};
  context.document.addEventListener=() => {};
  context.cancelAnimationFrame=() => {};
  context.innerWidth=390;
  app.componentDidMount();
  app.state.menuOpen=true;
  context.innerWidth=1440;
  app._onResize();
  assert.equal(app.state.menuOpen,false);
  assert.equal(app.renderVals().isWide,true);
});

test('refresh saves the latest menu position rather than the old arrival position',() => {
  const {app,context,setLocation}=appFixture();
  app.syncRouteFromLocation=app.syncCatalogChrome=app.loadProtocol=app.loadCatalog=() => {};
  const listeners={};
  context.window.addEventListener=(type,listener) => {listeners[type]=listener;};
  context.document.addEventListener=() => {};
  app.componentDidMount();
  app.state.route='home';
  setLocation('/#home-burgers');
  context.history.state={easylineCatalog:{route:'home',scroll:6842}};
  context.window.scrollY=7200;
  listeners.beforeunload();
  assert.equal(context.history.state.easylineCatalog.scroll,7200);
});
