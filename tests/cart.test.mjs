import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const index = await readFile(new URL('../index.html',import.meta.url),'utf8');
const asset = index.match(/'\/easyline-site\/assets\/(menu-catalog-[a-f0-9]+\.js)'/)?.[1];
assert.ok(asset,'built catalog module is referenced');
const module = await import(new URL('../assets/' + asset,import.meta.url));
const { CATALOG,CATEGORIES,sanitizeCart,decodeCart,setQuantity,summarizeCart,filterCatalog } = module;

test('all supplied positions remain distinct, with no invented prices or photographs',() => {
  assert.equal(CATALOG.length,39);
  assert.equal(new Set(CATALOG.map(item => item.id)).size,39);
  assert.equal(CATALOG.filter(item => item.direction === 'corporate-lunches').length,13);
  assert.equal(CATEGORIES.reduce((sum,item) => sum + item.count,0),26);
  assert.ok(CATALOG.every(item => item.priceRub === null && item.image === null));
  assert.equal(CATALOG.find(item => item.id === 'lunch-08').name,'Крабовый салат, киноа, котлета');
});

test('old, corrupted and hostile saved carts cannot create unknown products or unsafe quantities',() => {
  assert.deepEqual(decodeCart('{broken'),{});
  assert.deepEqual(decodeCart(JSON.stringify({ version:2,items:{'lunch-01':2} })),{});
  assert.deepEqual(sanitizeCart(['lunch-01']),{});
  assert.deepEqual(sanitizeCart({ 'lunch-01':100000,'lunch-02':-3,'lunch-03':'2','lunch-04':1.5,'unknown':1 }),{'lunch-01':99});
  assert.deepEqual(decodeCart('{"version":1,"items":{"__proto__":{"polluted":true},"lunch-01":2}}'),{'lunch-01':2});
  assert.equal({}.polluted,undefined);
});

test('mixed catalog orders preserve quantities, removal, reload encoding, and unknown total',() => {
  let cart = setQuantity({},'lunch-01',2);
  cart = setQuantity(cart,'assortment-13',3);
  assert.equal(summarizeCart(cart).count,5);
  assert.equal(summarizeCart(cart).totalRub,null);
  assert.equal(summarizeCart(cart).lines.length,2);
  assert.deepEqual(decodeCart(JSON.stringify({version:1,items:cart})),cart);
  cart = setQuantity(cart,'lunch-01',0);
  assert.deepEqual(cart,{'assortment-13':3});
  assert.deepEqual(setQuantity(cart,'not-a-product',1),cart);
  assert.deepEqual(setQuantity(cart,'assortment-13',NaN),cart);
});

test('bread, protein, category and search filters combine without silently relabeling dishes',() => {
  const result = filterCatalog({direction:'assortment',category:'ciabatta',protein:'chicken',wholegrain:true});
  assert.deepEqual(result.map(item => item.id),['assortment-13']);
  assert.deepEqual(filterCatalog({direction:'assortment',category:'bowls',wholegrain:true}),[]);
  assert.deepEqual(filterCatalog({direction:'assortment',search:'  ТОМЛЕНОЕ  '}).map(item => item.id),[]);
  assert.deepEqual(filterCatalog({direction:'assortment',search:'томленым'}).map(item => item.id),['assortment-07']);
  assert.equal(filterCatalog({direction:'corporate-lunches',search:'плов'}).length,2);
});

test('blocked browser storage does not crash the cart or misreport a successful save',() => {
  const saved = globalThis.window;
  try {
    globalThis.window={get localStorage(){throw new Error('storage denied')}};
    assert.deepEqual(module.readCart(),{});
    assert.equal(module.writeCart({'lunch-01':1}),false);
  } finally { if(saved === undefined) delete globalThis.window; else globalThis.window=saved; }
});

test('checkout stays explicitly unavailable while prices and order integration are missing',() => {
  const checkout = index.match(/<form id="checkout-form"[\s\S]*?<\/form>/)?.[0];
  assert.ok(checkout);
  assert.ok(checkout.includes('onSubmit="{{ preventCheckout }}"'));
  assert.ok(checkout.includes('type="submit" disabled="{{ true }}"'));
  assert.ok(checkout.includes('Заказ не отправлен'));
  assert.ok(!checkout.includes('submitInquiry'));
});
