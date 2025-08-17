import crypto from 'node:crypto';

function getGlobalDiscountStore() {
  if (!globalThis.__PRINT_SHOP_DISCOUNT_STORE__) {
    globalThis.__PRINT_SHOP_DISCOUNT_STORE__ = {
      discountsById: new Map(),
    };
  }
  return globalThis.__PRINT_SHOP_DISCOUNT_STORE__;
}

export function addDiscount({ name, percent, startsAt, endsAt, active = false, productIds = [], sectionIds = [] }) {
  const store = getGlobalDiscountStore();
  const id = crypto.randomUUID();
  const discount = {
    id,
    name: String(name).trim(),
    percent: Math.min(90, Math.max(0, Number(percent) || 0)),
    startsAt: startsAt ? Number(startsAt) : Date.now(),
    endsAt: endsAt ? Number(endsAt) : Date.now() + 7 * 24 * 3600 * 1000,
    active: Boolean(active),
    productIds: Array.isArray(productIds) ? productIds : [],
    sectionIds: Array.isArray(sectionIds) ? sectionIds : [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  store.discountsById.set(id, discount);
  return { ...discount };
}

export function listDiscounts() {
  const store = getGlobalDiscountStore();
  return Array.from(store.discountsById.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function updateDiscount(id, patch) {
  const store = getGlobalDiscountStore();
  const d = store.discountsById.get(id);
  if (!d) return null;
  const updated = { ...d, ...patch, updatedAt: Date.now() };
  if (patch.percent != null) updated.percent = Math.min(90, Math.max(0, Number(patch.percent) || 0));
  store.discountsById.set(id, updated);
  return { ...updated };
}

export function deleteDiscount(id) {
  const store = getGlobalDiscountStore();
  return store.discountsById.delete(id);
}

export function getActiveDiscounts(nowTs = Date.now()) {
  const store = getGlobalDiscountStore();
  return Array.from(store.discountsById.values()).filter((d) => d.active && d.startsAt <= nowTs && nowTs <= d.endsAt);
}

