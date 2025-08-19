// DEPRECATED: This file is no longer used.
// All product and section operations have been moved to YDB.
// See /lib/ydb/catalogRepo.js for the new implementation.

// This file is kept for backward compatibility and potential rollback scenarios.
// All functions now return empty results to avoid breaking existing imports.

export function addSection() {
  console.warn('addSection is deprecated. Use createSectionYdb from /lib/ydb/catalogRepo.js');
  return null;
}

export function listSections() {
  console.warn('listSections is deprecated. Use listSectionsYdb from /lib/ydb/catalogRepo.js');
  return [];
}

export function updateSection() {
  console.warn('updateSection is deprecated. Use updateSectionYdb from /lib/ydb/catalogRepo.js');
  return null;
}

export function deleteSection() {
  console.warn('deleteSection is deprecated. Use deleteSectionYdb from /lib/ydb/catalogRepo.js');
  return false;
}

export function addProduct() {
  console.warn('addProduct is deprecated. Use createProductYdb from /lib/ydb/catalogRepo.js');
  return null;
}

export function listProducts() {
  console.warn('listProducts is deprecated. Use listProductsYdb from /lib/ydb/catalogRepo.js');
  return [];
}

export function updateProduct() {
  console.warn('updateProduct is deprecated. Use updateProductYdb from /lib/ydb/catalogRepo.js');
  return null;
}

export function deleteProduct() {
  console.warn('deleteProduct is deprecated. Use deleteProductYdb from /lib/ydb/catalogRepo.js');
  return false;
}

export function getProductById() {
  console.warn('getProductById is deprecated. Use YDB queries from /lib/ydb/catalogRepo.js');
  return null;
}

