import crypto from 'node:crypto';
import { getYdbDriver } from './client';
import ydb from 'ydb-sdk';
const { TypedValues } = ydb;
import path from 'node:path';
import fs from 'node:fs/promises';

function json(val) {
  return JSON.stringify(val ?? null);
}

export async function initSchemaIfNeeded() {
  const driver = await getYdbDriver();
  try {
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'ydb', 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    const stmts = schema.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
    for (const s of stmts) {
      await driver.tableClient.withSession(async (sesh) => sesh.executeSchemeQuery(s + ';'));
    }
  } catch (e) {
    // ignore
  }
  return true;
}

// Users
export async function createUser({ email, name, passwordHash, role = 'user' }) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  await driver.tableClient.withSession(async (session) => {
    await session.executeQuery(
      'DECLARE $id AS Utf8; DECLARE $email AS Utf8; DECLARE $name AS Utf8; DECLARE $ph AS Utf8; DECLARE $role AS Utf8; DECLARE $createdAt AS Uint64;\n'
      + `UPSERT INTO \`${db}/users\` (id, email, name, password_hash, role, created_at) VALUES ($id, $email, $name, $ph, $role, $createdAt);`,
      {
        '$id': TypedValues.utf8(id),
        '$email': TypedValues.utf8(email),
        '$name': TypedValues.utf8(name || ''),
        '$ph': TypedValues.utf8(passwordHash),
        '$role': TypedValues.utf8(role),
        '$createdAt': TypedValues.uint64(createdAt),
      }
    );
  });
  return { id, email, name, role, createdAt };
}

export async function findUserByEmailYdb(email) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const row = await driver.tableClient.withSession(async (session) => {
    const { resultSets } = await session.executeQuery(
      'DECLARE $email AS Utf8;\n'
      + `SELECT id, email, name, password_hash, role, created_at FROM \`${db}/users\` WHERE email = $email LIMIT 1;`,
      { '$email': TypedValues.utf8(email) }
    );
    const rs = resultSets?.[0];
    if (!rs || !rs.rows || rs.rows.length === 0) return null;
    const r = rs.rows[0];
    return r;
  });
  if (!row) return null;
  const [idCol, emailCol, nameCol, phCol, roleCol, createdCol] = row.items;
  return {
    id: idCol?.textValue || '',
    email: emailCol?.textValue || '',
    name: nameCol?.textValue || '',
    passwordHash: phCol?.textValue || '',
    role: roleCol?.textValue || 'user',
    createdAt: Number(createdCol?.uint64Value?.low || 0),
  };
}

// Cart
export async function upsertCart({ id, userId, items }) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const cartId = id || crypto.randomUUID();
  const updatedAt = Date.now();
  await driver.tableClient.withSession(async (session) => {
    await session.executeQuery(
      'DECLARE $id AS Utf8; DECLARE $userId AS Utf8; DECLARE $items AS Utf8; DECLARE $updatedAt AS Uint64;\n'
      + `UPSERT INTO \`${db}/carts\` (id, user_id, items, updated_at) VALUES ($id, $userId, CAST($items AS Json), $updatedAt);`,
      {
        '$id': TypedValues.utf8(cartId),
        '$userId': TypedValues.utf8(userId || ''),
        '$items': TypedValues.utf8(json(items)),
        '$updatedAt': TypedValues.uint64(updatedAt),
      }
    );
  });
  return { id: cartId, userId, items, updatedAt };
}

export async function getCartByUser(userId) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const row = await driver.tableClient.withSession(async (session) => {
    const { resultSets } = await session.executeQuery(
      'DECLARE $userId AS Utf8;\n'
      + `SELECT id, user_id, items, updated_at FROM \`${db}/carts\` WHERE user_id = $userId LIMIT 1;`,
      { '$userId': TypedValues.utf8(userId) }
    );
    const rs = resultSets?.[0];
    if (!rs || !rs.rows || rs.rows.length === 0) return null;
    return rs.rows[0];
  });
  if (!row) return null;
  const [idCol, userIdCol, itemsCol, updatedCol] = row.items;
  return {
            id: idCol?.textValue || '',
        userId: userIdCol?.textValue || '',
    items: JSON.parse(itemsCol?.jsonValue || '[]'),
    updatedAt: Number(updatedCol?.uint64Value?.low || 0),
  };
}

// Orders
export async function createOrderYdb({ userId, status, payload, totalPrice }) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const id = crypto.randomUUID();
  const now = Date.now();
  
  await driver.tableClient.withSession(async (session) => {
    await session.executeQuery(
      'DECLARE $id AS Utf8; DECLARE $userId AS Utf8; DECLARE $status AS Utf8; DECLARE $payload AS Utf8; DECLARE $total AS Int64; DECLARE $created AS Uint64; DECLARE $updated AS Uint64;\n'
      + `UPSERT INTO \`${db}/orders\` (id, user_id, status, payload, total_price, created_at, updated_at) VALUES ($id, $userId, $status, CAST($payload AS Json), $total, $created, $updated);`,
      {
        '$id': TypedValues.utf8(id),
        '$userId': TypedValues.utf8(userId || ''),
        '$status': TypedValues.utf8(status || 'new'),
        '$payload': TypedValues.utf8(json(payload)),
        '$total': TypedValues.int64(Number(totalPrice) || 0),
        '$created': TypedValues.uint64(now),
        '$updated': TypedValues.uint64(now),
      }
    );
  });
  
  return { id, userId, status: status || 'new', payload, totalPrice: Number(totalPrice)||0, createdAt: now, updatedAt: now };
}

export async function listOrdersYdb() {
  const driver = await getYdbDriver();
  const db = driver.database;
  const rows = await driver.tableClient.withSession(async (session) => {
    const { resultSets } = await session.executeQuery(
      `SELECT id, user_id, status, payload, total_price, created_at, updated_at FROM \`${db}/orders\` ORDER BY created_at DESC LIMIT 500;`
    );
    const rs = resultSets?.[0];
    return rs?.rows || [];
  });
  return rows.map((row) => {
    const [idCol, userIdCol, statusCol, payloadCol, totalCol, createdCol, updatedCol] = row.items;
    
    // Извлекаем JSON payload из YDB
    let payloadStr = payloadCol?.jsonValue || payloadCol?.textValue || payloadCol?.utf8Value || '{}';
    let payload;
    try {
      payload = JSON.parse(payloadStr);
    } catch (e) {
      console.error('❌ Failed to parse payload JSON:', payloadStr, e);
      payload = {};
    }
    
    // Создаем базовую структуру заказа
    const order = {
      id: idCol?.textValue || '',
      userId: userIdCol?.textValue || '',
      status: statusCol?.textValue || 'new',
      totalPrice: Number(totalCol?.int64Value?.low || 0),
      createdAt: Number(createdCol?.uint64Value?.low || 0),
      updatedAt: Number(updatedCol?.uint64Value?.low || 0),
      
      // Добавляем payload полностью
      payload: payload,
      
      // Извлекаем основные поля из payload для обратной совместимости
      productName: payload.productName,
      size: payload.size,
      color: payload.color,
      quantity: payload.quantity,
      image: payload.image,
      
      // Извлекаем данные клиента
      customerInfo: payload.customerInfo,
      customer: payload.customer || payload.customerInfo, // Fallback для старых заказов
    };
    
    return order;
  });
}

export async function updateOrderStatusYdb(id, status) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const updatedAt = Date.now();
  await driver.tableClient.withSession(async (session) => {
    await session.executeQuery(
      'DECLARE $id AS Utf8; DECLARE $status AS Utf8; DECLARE $updated AS Uint64;\n'
      + `UPDATE \`${db}/orders\` SET status = $status, updated_at = $updated WHERE id = $id;`,
      {
        '$id': TypedValues.utf8(id),
        '$status': TypedValues.utf8(status),
        '$updated': TypedValues.uint64(updatedAt),
      }
    );
  });
  return true;
}

export async function deleteOrderYdb(id) {
  const driver = await getYdbDriver();
  const db = driver.database;
  await driver.tableClient.withSession(async (session) => {
    await session.executeQuery(
      'DECLARE $id AS Utf8;\n'
      + `DELETE FROM \`${db}/orders\` WHERE id = $id;`,
      { '$id': TypedValues.utf8(id) }
    );
  });
  return true;
}

export async function getOrderByIdYdb(id) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const row = await driver.tableClient.withSession(async (session) => {
    const { resultSets } = await session.executeQuery(
      'DECLARE $id AS Utf8;\n'
      + `SELECT id, user_id, status, payload, total_price, created_at, updated_at FROM \`${db}/orders\` WHERE id = $id LIMIT 1;`,
      { '$id': TypedValues.utf8(id) }
    );
    const rs = resultSets?.[0];
    if (!rs || !rs.rows || rs.rows.length === 0) return null;
    return rs.rows[0];
  });
  if (!row) return null;
  const [idCol, userIdCol, statusCol, payloadCol, totalCol, createdCol, updatedCol] = row.items;
  return {
            id: idCol?.textValue || '',
        userId: userIdCol?.textValue || '',
            status: statusCol?.textValue || 'new',
    ...JSON.parse(payloadCol?.jsonValue || '{}'),
    totalPrice: Number(totalCol?.int64Value?.low || 0),
    createdAt: Number(createdCol?.uint64Value?.low || 0),
    updatedAt: Number(updatedCol?.uint64Value?.low || 0),
  };
}

export async function listUsersYdb() {
  const driver = await getYdbDriver();
  const db = driver.database;
  const rows = await driver.tableClient.withSession(async (session) => {
    const { resultSets } = await session.executeQuery(
      `SELECT id, email, name, role, created_at FROM \`${db}/users\` LIMIT 1000;`
    );
    const rs = resultSets?.[0];
    return rs?.rows || [];
  });
  return rows.map((row) => {
    const [idCol, emailCol, nameCol, roleCol, createdCol] = row.items;
    return {
      id: idCol?.textValue || '',
      email: emailCol?.textValue || '',
      name: nameCol?.textValue || '',
      role: roleCol?.textValue || 'user',
      createdAt: Number(createdCol?.uint64Value?.low || 0),
    };
  });
}

export async function updateUserRoleYdb(userId, role) {
  const driver = await getYdbDriver();
  const db = driver.database;
  await driver.tableClient.withSession(async (session) => {
    await session.executeQuery(
      'DECLARE $id AS Utf8; DECLARE $role AS Utf8;\n'
      + `UPDATE \`${db}/users\` SET role = $role WHERE id = $id;`,
      { '$id': TypedValues.utf8(userId), '$role': TypedValues.utf8(role) }
    );
  });
  return true;
}


