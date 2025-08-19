// src/lib/ydb/catalogRepo.js
import { getYdbDriver } from './client';
import { TypedValues } from 'ydb-sdk';
import crypto from 'crypto';

function json(value) {
  return JSON.stringify(value);
}

// ===== SECTIONS (РАЗДЕЛЫ) =====

export async function createSectionYdb({ name, description }) {
  console.log('🗂️ Creating section in YDB:', { name, description });
  const driver = await getYdbDriver();
  const db = driver.database;
  const id = crypto.randomUUID();
  const now = Date.now();

  try {
    await driver.tableClient.withSession(async (session) => {
      await session.executeQuery(
        'DECLARE $id AS Utf8; DECLARE $name AS Utf8; DECLARE $description AS Utf8; DECLARE $createdAt AS Uint64; DECLARE $updatedAt AS Uint64;\n'
        + `UPSERT INTO \`${db}/sections\` (id, name, description, created_at, updated_at) VALUES ($id, $name, $description, $createdAt, $updatedAt);`,
        {
          '$id': TypedValues.utf8(id),
          '$name': TypedValues.utf8(name || ''),
          '$description': TypedValues.utf8(description || ''),
          '$createdAt': TypedValues.uint64(now),
          '$updatedAt': TypedValues.uint64(now),
        }
      );
    });
    return { id, name, description, createdAt: now, updatedAt: now };
  } catch (error) {
    console.error('Error creating section in YDB:', error);
    throw error;
  }
}

export async function listSectionsYdb() {
  console.log('📋 Listing sections from YDB');
  const driver = await getYdbDriver();
  const db = driver.database;
  try {
    const rows = await driver.tableClient.withSession(async (session) => {
      const { resultSets } = await session.executeQuery(
        `SELECT id, name, description, created_at, updated_at FROM \`${db}/sections\` ORDER BY created_at DESC LIMIT 500;`
      );
      const rs = resultSets?.[0];
      return rs?.rows || [];
    });
    return rows.map((row) => {
      const [idCol, nameCol, descriptionCol, createdCol, updatedCol] = row.items;
      return {
        id: idCol?.textValue || '',
        name: nameCol?.textValue || '',
        description: descriptionCol?.textValue || '',
        createdAt: createdCol?.uint64Value || 0,
        updatedAt: updatedCol?.uint64Value || 0,
      };
    }).filter(section => section.id && section.id.trim() !== ''); // Filter out sections with empty IDs
  } catch (error) {
    console.error('Error listing sections from YDB:', error);
    return [];
  }
}

export async function updateSectionYdb(id, { name, description }) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const now = Date.now();
  try {
    await driver.tableClient.withSession(async (session) => {
      const query = `
        DECLARE $id AS Utf8;
        DECLARE $name AS Utf8;
        DECLARE $description AS Utf8;
        DECLARE $updatedAt AS Uint64;
        UPDATE \`${db}/sections\` SET
          name = $name,
          description = $description,
          updated_at = $updatedAt
        WHERE id = $id;
      `;
      await session.executeQuery(query, {
        '$id': TypedValues.utf8(id),
        '$name': TypedValues.utf8(name),
        '$description': TypedValues.utf8(description),
        '$updatedAt': TypedValues.uint64(now),
      });
    });
    return true;
  } catch (error) {
    console.error(`Error updating section ${id} in YDB:`, error);
    throw error;
  }
}

export async function deleteSectionYdb(id) {
  const driver = await getYdbDriver();
  const db = driver.database;
  try {
    await driver.tableClient.withSession(async (session) => {
      await session.executeQuery(
        'DECLARE $id AS Utf8;\n'
        + `DELETE FROM \`${db}/sections\` WHERE id = $id;`,
        { '$id': TypedValues.utf8(id) }
      );
    });
    return true;
  } catch (error) {
    console.error(`Error deleting section ${id} from YDB:`, error);
    throw error;
  }
}

// ===== PRODUCTS (ТОВАРЫ) =====

export async function createProductYdb({ name, basePrice, description, section, images }) {
  console.log('🗄️ YDB createProduct called with:', { name, basePrice, section, imagesType: typeof images, imagesLength: images?.length });
  
  const driver = await getYdbDriver();
  const db = driver.database;
  const id = crypto.randomUUID();
  const now = Date.now();

  try {
    await driver.tableClient.withSession(async (session) => {
      await session.executeQuery(
        'DECLARE $id AS Utf8; DECLARE $name AS Utf8; DECLARE $basePrice AS Double; DECLARE $description AS Utf8; DECLARE $section AS Utf8; DECLARE $images AS Json; DECLARE $createdAt AS Uint64; DECLARE $updatedAt AS Uint64;\n'
        + `UPSERT INTO \`${db}/products\` (id, name, base_price, description, section, images, created_at, updated_at) VALUES ($id, $name, $basePrice, $description, $section, $images, $createdAt, $updatedAt);`,
        {
          '$id': TypedValues.utf8(id),
          '$name': TypedValues.utf8(name || ''),
          '$basePrice': TypedValues.double(parseFloat(basePrice) || 0),
          '$description': TypedValues.utf8(description || ''),
          '$section': TypedValues.utf8(section || ''),
          '$images': (() => {
            const jsonString = json(images || []);
            console.log('🔄 YDB Images JSON conversion:', jsonString);
            console.log('🔄 YDB Using TypedValues.json for images');
            return TypedValues.json(jsonString);
          })(),
          '$createdAt': TypedValues.uint64(now),
          '$updatedAt': TypedValues.uint64(now),
        }
      );
    });
    return { id, name, basePrice: parseFloat(basePrice), description, section, images, createdAt: now, updatedAt: now };
  } catch (error) {
    console.error('Error creating product in YDB:', error);
    throw error;
  }
}

export async function listProductsYdb() {
  const driver = await getYdbDriver();
  const db = driver.database;
  try {
    const rows = await driver.tableClient.withSession(async (session) => {
      const { resultSets } = await session.executeQuery(
        `SELECT id, name, base_price, description, section, images, created_at, updated_at FROM \`${db}/products\` ORDER BY created_at DESC LIMIT 500;`
      );
      const rs = resultSets?.[0];
      return rs?.rows || [];
    });
    return rows.map((row) => {
      const [idCol, nameCol, basePriceCol, descriptionCol, sectionCol, imagesCol, createdCol, updatedCol] = row.items;
      return {
        id: idCol?.textValue || '',
        name: nameCol?.textValue || '',
        basePrice: basePriceCol?.doubleValue || 0,
        description: descriptionCol?.textValue || '',
        section: sectionCol?.textValue || '',
        images: (() => {
          const rawValue = imagesCol?.textValue || imagesCol?.jsonValue;
          console.log('🔍 DEBUG: Reading images from YDB:', { rawValue, type: typeof rawValue, textValue: imagesCol?.textValue, jsonValue: imagesCol?.jsonValue });
          try {
            return JSON.parse(rawValue || '[]');
          } catch (e) {
            console.error('❌ JSON parse error:', e, 'Raw value:', rawValue);
            return [];
          }
        })(),
        createdAt: createdCol?.uint64Value || 0,
        updatedAt: updatedCol?.uint64Value || 0,
      };
    }).filter(product => product.id && product.id.trim() !== ''); // Фильтруем товары с пустыми ID
  } catch (error) {
    console.error('Error listing products from YDB:', error);
    return [];
  }
}

export async function updateProductYdb(id, { name, basePrice, description, section, images }) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const now = Date.now();
  try {
    await driver.tableClient.withSession(async (session) => {
      const query = `
        DECLARE $id AS Utf8;
        DECLARE $name AS Utf8;
        DECLARE $basePrice AS Double;
        DECLARE $description AS Utf8;
        DECLARE $section AS Utf8;
        DECLARE $images AS Json;
        DECLARE $updatedAt AS Uint64;
        UPDATE \`${db}/products\` SET
          name = $name,
          base_price = $basePrice,
          description = $description,
          section = $section,
          images = $images,
          updated_at = $updatedAt
        WHERE id = $id;
      `;
      await session.executeQuery(query, {
        '$id': TypedValues.utf8(id),
        '$name': TypedValues.utf8(name),
        '$basePrice': TypedValues.double(parseFloat(basePrice)),
        '$description': TypedValues.utf8(description),
        '$section': TypedValues.utf8(section),
        '$images': TypedValues.json(json(images)),
        '$updatedAt': TypedValues.uint64(now),
      });
    });
    return true;
  } catch (error) {
    console.error(`Error updating product ${id} in YDB:`, error);
    throw error;
  }
}

export async function deleteProductYdb(id) {
  const driver = await getYdbDriver();
  const db = driver.database;
  try {
    await driver.tableClient.withSession(async (session) => {
      await session.executeQuery(
        'DECLARE $id AS Utf8;\n'
        + `DELETE FROM \`${db}/products\` WHERE id = $id;`,
        { '$id': TypedValues.utf8(id) }
      );
    });
    return true;
  } catch (error) {
    console.error(`Error deleting product ${id} from YDB:`, error);
    throw error;
  }
}

// ===== DISCOUNTS (СКИДКИ) =====

export async function createDiscountYdb({ name, percentage, sections, products, isActive = true }) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const id = crypto.randomUUID();
  const now = Date.now();

  try {
    await driver.tableClient.withSession(async (session) => {
      await session.executeQuery(
        'DECLARE $id AS Utf8; DECLARE $name AS Utf8; DECLARE $percentage AS Double; DECLARE $sections AS Json; DECLARE $products AS Json; DECLARE $isActive AS Bool; DECLARE $createdAt AS Uint64; DECLARE $updatedAt AS Uint64;\n'
        + `UPSERT INTO \`${db}/discounts\` (id, name, percentage, sections, products, is_active, created_at, updated_at) VALUES ($id, $name, $percentage, CAST($sections AS Json), CAST($products AS Json), $isActive, $createdAt, $updatedAt);`,
        {
          '$id': TypedValues.utf8(id),
          '$name': TypedValues.utf8(name || ''),
          '$percentage': TypedValues.double(parseFloat(percentage) || 0),
          '$sections': TypedValues.utf8(json(sections || [])),
          '$products': TypedValues.utf8(json(products || [])),
          '$isActive': TypedValues.bool(isActive),
          '$createdAt': TypedValues.uint64(now),
          '$updatedAt': TypedValues.uint64(now),
        }
      );
    });
    return { id, name, percentage: parseFloat(percentage), sections, products, isActive, createdAt: now, updatedAt: now };
  } catch (error) {
    console.error('Error creating discount in YDB:', error);
    throw error;
  }
}

export async function listDiscountsYdb() {
  const driver = await getYdbDriver();
  const db = driver.database;
  try {
    const rows = await driver.tableClient.withSession(async (session) => {
      const { resultSets } = await session.executeQuery(
        `SELECT id, name, percentage, sections, products, is_active, created_at, updated_at FROM \`${db}/discounts\` ORDER BY created_at DESC LIMIT 500;`
      );
      const rs = resultSets?.[0];
      return rs?.rows || [];
    });
    return rows.map((row) => {
      const [idCol, nameCol, percentageCol, sectionsCol, productsCol, isActiveCol, createdCol, updatedCol] = row.items;
      return {
        id: idCol?.textValue || '',
        name: nameCol?.textValue || '',
        percentage: percentageCol?.doubleValue || 0,
        sections: JSON.parse(sectionsCol?.jsonValue || '[]'),
        products: JSON.parse(productsCol?.jsonValue || '[]'),
        isActive: isActiveCol?.boolValue || false,
        createdAt: createdCol?.uint64Value || 0,
        updatedAt: updatedCol?.uint64Value || 0,
      };
    }).filter(discount => discount.id && discount.id.trim() !== ''); // Фильтруем скидки с пустыми ID
  } catch (error) {
    console.error('Error listing discounts from YDB:', error);
    return [];
  }
}

export async function updateDiscountYdb(id, { name, percentage, sections, products, isActive }) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const now = Date.now();
  try {
    await driver.tableClient.withSession(async (session) => {
      const query = `
        DECLARE $id AS Utf8;
        DECLARE $name AS Utf8;
        DECLARE $percentage AS Double;
        DECLARE $sections AS Json;
        DECLARE $products AS Json;
        DECLARE $isActive AS Bool;
        DECLARE $updatedAt AS Uint64;
        UPDATE \`${db}/discounts\` SET
          name = $name,
          percentage = $percentage,
          sections = CAST($sections AS Json),
          products = CAST($products AS Json),
          is_active = $isActive,
          updated_at = $updatedAt
        WHERE id = $id;
      `;
      await session.executeQuery(query, {
        '$id': TypedValues.utf8(id),
        '$name': TypedValues.utf8(name),
        '$percentage': TypedValues.double(parseFloat(percentage)),
        '$sections': TypedValues.utf8(json(sections)),
        '$products': TypedValues.utf8(json(products)),
        '$isActive': TypedValues.bool(isActive),
        '$updatedAt': TypedValues.uint64(now),
      });
    });
    return true;
  } catch (error) {
    console.error(`Error updating discount ${id} in YDB:`, error);
    throw error;
  }
}

export async function deleteDiscountYdb(id) {
  const driver = await getYdbDriver();
  const db = driver.database;
  try {
    await driver.tableClient.withSession(async (session) => {
      await session.executeQuery(
        'DECLARE $id AS Utf8;\n'
        + `DELETE FROM \`${db}/discounts\` WHERE id = $id;`,
        { '$id': TypedValues.utf8(id) }
      );
    });
    return true;
  } catch (error) {
    console.error(`Error deleting discount ${id} from YDB:`, error);
    throw error;
  }
}