import crypto from 'node:crypto';

function getGlobalOrderStore() {
  if (!globalThis.__PRINT_SHOP_ORDER_STORE__) {
    globalThis.__PRINT_SHOP_ORDER_STORE__ = {
      ordersById: new Map(),
      createdAt: Date.now(),
    };
  }
  return globalThis.__PRINT_SHOP_ORDER_STORE__;
}

export const ORDER_STATUSES = [
  'new',
  'processing',
  'printed',
  'shipped',
  'completed',
  'cancelled',
];

export function addOrder(input) {
  const store = getGlobalOrderStore();
  const id = crypto.randomUUID();
  const now = Date.now();
  const order = {
    id,
    status: 'new',
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  store.ordersById.set(id, order);
  return { ...order };
}

export function listOrders() {
  const store = getGlobalOrderStore();
  return Array.from(store.ordersById.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function getOrderById(id) {
  const store = getGlobalOrderStore();
  return store.ordersById.get(id) || null;
}

export function updateOrderStatus(id, status) {
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error('Invalid status');
  }
  const store = getGlobalOrderStore();
  const existing = store.ordersById.get(id);
  if (!existing) return null;
  const updated = { ...existing, status, updatedAt: Date.now() };
  store.ordersById.set(id, updated);
  return { ...updated };
}

export function deleteOrder(id) {
  const store = getGlobalOrderStore();
  return store.ordersById.delete(id);
}

