export const CATALOG_FILTER_DEFAULTS = Object.freeze({ category:'all', protein:'all', wholegrain:false, search:'' });
export function readCatalogFilters(search) {
  const params = new URLSearchParams(search);
  return { category:params.get('category') || 'all', protein:['chicken','turkey','beef','shrimp'].includes(params.get('protein')) ? params.get('protein') : 'all',
    wholegrain:params.get('wholegrain') === '1', search:(params.get('q') || '').slice(0,100) };
}
export function catalogQuery(filters) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'all') params.set('category',filters.category);
  if (filters.protein && filters.protein !== 'all') params.set('protein',filters.protein);
  if (filters.wholegrain) params.set('wholegrain','1');
  if (filters.search) params.set('q',filters.search);
  return params.size ? '?' + params.toString() : '';
}
export function parseItemQuantity(value) {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return null;
  const quantity = Number(text);
  return Number.isSafeInteger(quantity) && quantity >= 0 && quantity <= 99 ? quantity : null;
}
export function visibleProtocolDays(days, selectedDay, showAll) {
  return showAll ? days : days.filter(day => day.n === selectedDay);
}
export function quantityWord(count, one, few, many) {
  return count % 100 >= 11 && count % 100 <= 14 ? many : count % 10 === 1 ? one : [2,3,4].includes(count % 10) ? few : many;
}
