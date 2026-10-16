// Catalog constants are inserted by scripts/sync-static-site.mjs.
export const CART_STORAGE_KEY = 'easyline:menu-cart:v1';
export const MAX_QUANTITY = 99;
const ids = new Set(CATALOG.map(item => item.id));

export function sanitizeCart(value) {
  const result = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const [id, qty] of Object.entries(value)) {
    if (ids.has(id) && Number.isSafeInteger(qty) && qty > 0) result[id] = Math.min(qty, MAX_QUANTITY);
  }
  return result;
}

export function decodeCart(raw) {
  try {
    const saved = JSON.parse(raw);
    return saved?.version === 1 ? sanitizeCart(saved.items) : {};
  } catch { return {}; }
}

export function readCart() {
  try { return decodeCart(window.localStorage.getItem(CART_STORAGE_KEY)); }
  catch { return {}; }
}

export function writeCart(cart) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version:1, items:sanitizeCart(cart) }));
    return true;
  } catch { return false; }
}

export function setQuantity(cart, id, quantity) {
  const next = sanitizeCart(cart);
  if (!ids.has(id) || !Number.isSafeInteger(quantity)) return next;
  if (quantity <= 0) delete next[id];
  else next[id] = Math.min(quantity, MAX_QUANTITY);
  return next;
}

export function cartLines(cart) {
  const clean = sanitizeCart(cart);
  return CATALOG.filter(item => clean[item.id]).map(item => ({ ...item, quantity:clean[item.id] }));
}

export function summarizeCart(cart) {
  const lines = cartLines(cart);
  const allPriced = lines.length > 0 && lines.every(item => Number.isFinite(item.priceRub) && item.priceRub > 0);
  return {
    lines,
    count:lines.reduce((sum, item) => sum + item.quantity, 0),
    // Unknown prices must never appear as free items or a partial order total.
    totalRub:allPriced ? lines.reduce((sum, item) => sum + item.priceRub * item.quantity, 0) : null,
  };
}

export function filterCatalog({ direction, category='all', protein='all', wholegrain=false, search='' }) {
  const query = search.trim().toLocaleLowerCase('ru').replaceAll('ё','е');
  return CATALOG.filter(item => item.direction === direction
    && (category === 'all' || item.category === category)
    && (protein === 'all' || item.protein === protein)
    && (!wholegrain || item.wholegrain === true)
    && (!query || item.name.toLocaleLowerCase('ru').replaceAll('ё','е').includes(query)));
}
