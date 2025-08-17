import crypto from 'node:crypto';

function getGlobalCatalogStore() {
  if (!globalThis.__PRINT_SHOP_CATALOG_STORE__) {
    globalThis.__PRINT_SHOP_CATALOG_STORE__ = {
      sectionsById: new Map(),
      productsById: new Map(),
    };
  }
  return globalThis.__PRINT_SHOP_CATALOG_STORE__;
}

function toSlug(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 64) || `section-${Date.now()}`;
}

export function addSection({ name }) {
  const store = getGlobalCatalogStore();
  const id = crypto.randomUUID();
  const section = { id, name: String(name).trim(), slug: toSlug(name), createdAt: Date.now(), updatedAt: Date.now() };
  store.sectionsById.set(id, section);
  return { ...section };
}

export function listSections() {
  const store = getGlobalCatalogStore();
  return Array.from(store.sectionsById.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function updateSection(id, patch) {
  const store = getGlobalCatalogStore();
  const s = store.sectionsById.get(id);
  if (!s) return null;
  const updated = { ...s, ...patch, updatedAt: Date.now() };
  if (patch.name) updated.slug = toSlug(patch.name);
  store.sectionsById.set(id, updated);
  return { ...updated };
}

export function deleteSection(id) {
  const store = getGlobalCatalogStore();
  // Also detach products from this section
  for (const [pid, p] of store.productsById.entries()) {
    if (p.sectionId === id) {
      store.productsById.set(pid, { ...p, sectionId: null, updatedAt: Date.now() });
    }
  }
  return store.sectionsById.delete(id);
}

export function addProduct({ name, basePrice, sectionId = null, description = '', image = '', images = [] }) {
  const store = getGlobalCatalogStore();
  const id = crypto.randomUUID();
  
  // Поддерживаем обратную совместимость: если передан image, добавляем его в images
  let productImages = Array.isArray(images) ? [...images] : [];
  if (image && typeof image === 'string' && image.trim()) {
    productImages.unshift(image.trim());
  }
  
  const product = {
    id,
    name: String(name).trim(),
    description: String(description || '').trim(),
    basePrice: Number(basePrice) || 0,
    sectionId: sectionId || null,
    images: productImages,
    // Оставляем image для обратной совместимости (первое изображение)
    image: productImages[0] || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  store.productsById.set(id, product);
  return { ...product };
}

export function listProducts() {
  const store = getGlobalCatalogStore();
  return Array.from(store.productsById.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function updateProduct(id, patch) {
  const store = getGlobalCatalogStore();
  const p = store.productsById.get(id);
  if (!p) return null;
  const updated = { ...p, ...patch, updatedAt: Date.now() };
  if (patch.basePrice != null) updated.basePrice = Number(patch.basePrice) || 0;
  store.productsById.set(id, updated);
  return { ...updated };
}

export function deleteProduct(id) {
  const store = getGlobalCatalogStore();
  return store.productsById.delete(id);
}

export function getProductById(id) {
  const store = getGlobalCatalogStore();
  return store.productsById.get(id) || null;
}

