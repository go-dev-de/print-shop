import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Путь к файлу данных
const DATA_FILE = path.join(process.cwd(), 'data', 'catalog.json');

// Убеждаемся, что папка data существует
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Загружаем данные из файла
function loadData() {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading catalog data:', error);
  }
  
  // Возвращаем пустую структуру по умолчанию
  return {
    sections: [],
    products: []
  };
}

// Сохраняем данные в файл
function saveData(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving catalog data:', error);
    return false;
  }
}

// SECTIONS
export function addSectionFile({ name, description }) {
  const data = loadData();
  const section = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    description: String(description || '').trim(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  data.sections.push(section);
  saveData(data);
  return section;
}

export function listSectionsFile() {
  const data = loadData();
  return data.sections.sort((a, b) => a.name.localeCompare(b.name));
}

export function deleteSectionFile(id) {
  const data = loadData();
  data.sections = data.sections.filter(s => s.id !== id);
  // Также удаляем связь с товарами
  data.products.forEach(p => {
    if (p.sectionId === id) {
      p.sectionId = null;
      p.updatedAt = Date.now();
    }
  });
  return saveData(data);
}

export function updateSectionFile(id, patch) {
  const data = loadData();
  const section = data.sections.find(s => s.id === id);
  if (!section) return null;
  
  Object.assign(section, patch, { updatedAt: Date.now() });
  saveData(data);
  return section;
}

// PRODUCTS
export function addProductFile({ name, basePrice, description, section, images }) {
  const data = loadData();
  const product = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    description: String(description || '').trim(),
    basePrice: Number(basePrice) || 0,
    section: section || null,
    sectionId: section || null,
    images: Array.isArray(images) ? images : [],
    image: Array.isArray(images) && images.length > 0 ? images[0] : '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  data.products.push(product);
  saveData(data);
  return product;
}

export function listProductsFile() {
  const data = loadData();
  return data.products.sort((a, b) => b.createdAt - a.createdAt);
}

export function deleteProductFile(id) {
  const data = loadData();
  data.products = data.products.filter(p => p.id !== id);
  return saveData(data);
}

export function updateProductFile(id, patch) {
  const data = loadData();
  const product = data.products.find(p => p.id === id);
  if (!product) return null;
  
  Object.assign(product, patch, { updatedAt: Date.now() });
  saveData(data);
  return product;
}