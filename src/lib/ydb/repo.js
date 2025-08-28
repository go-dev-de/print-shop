import crypto from 'node:crypto';
import { getYdbDriver } from './client';
import { TypedValues } from 'ydb-sdk';
import path from 'node:path';

function json(val) {
  return JSON.stringify(val ?? null);
}

export async function initSchemaIfNeeded() {
  // Миграция не требуется, updateUserYdb теперь работает с опциональным полем avatar
  return true;
}

// Users
export async function createUser({ email, name, passwordHash, role = 'user', avatar = '' }) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  await driver.tableClient.withSession(async (session) => {
    await session.executeQuery(
      'DECLARE $id AS Utf8; DECLARE $email AS Utf8; DECLARE $name AS Utf8; DECLARE $ph AS Utf8; DECLARE $role AS Utf8; DECLARE $avatar AS Utf8; DECLARE $createdAt AS Uint64;\n'
      + `UPSERT INTO \`${db}/users\` (id, email, name, password_hash, role, avatar, created_at) VALUES ($id, $email, $name, $ph, $role, $avatar, $createdAt);`,
      {
        '$id': TypedValues.utf8(id),
        '$email': TypedValues.utf8(email),
        '$name': TypedValues.utf8(name || ''),
        '$ph': TypedValues.utf8(passwordHash),
        '$role': TypedValues.utf8(role),
        '$avatar': TypedValues.utf8(avatar),
        '$createdAt': TypedValues.uint64(createdAt),
      }
    );
  });
  return { id, email, name, role, avatar, createdAt };
}

export async function findUserByEmailYdb(email) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const result = await driver.tableClient.withSession(async (session) => {
    // Сначала проверяем, есть ли поле avatar
    let hasAvatarField = false;
    try {
      await session.executeQuery(`SELECT avatar FROM \`${db}/users\` LIMIT 1;`);
      hasAvatarField = true;
    } catch (e) {
      // Поле avatar не существует
    }

    let query, row;
    if (hasAvatarField) {
      const { resultSets } = await session.executeQuery(
        'DECLARE $email AS Utf8;\n'
        + `SELECT id, email, name, password_hash, role, avatar, created_at FROM \`${db}/users\` WHERE email = $email LIMIT 1;`,
        { '$email': TypedValues.utf8(email) }
      );
      const rs = resultSets?.[0];
      if (!rs || !rs.rows || rs.rows.length === 0) return null;
      row = rs.rows[0];
      const [idCol, emailCol, nameCol, phCol, roleCol, avatarCol, createdCol] = row.items;
      return {
        id: idCol?.textValue || '',
        email: emailCol?.textValue || '',
        name: nameCol?.textValue || '',
        passwordHash: phCol?.textValue || '',
        role: roleCol?.textValue || 'user',
        avatar: avatarCol?.textValue || '',
        createdAt: Number(createdCol?.uint64Value?.low || 0),
      };
    } else {
      const { resultSets } = await session.executeQuery(
        'DECLARE $email AS Utf8;\n'
        + `SELECT id, email, name, password_hash, role, created_at FROM \`${db}/users\` WHERE email = $email LIMIT 1;`,
        { '$email': TypedValues.utf8(email) }
      );
      const rs = resultSets?.[0];
      if (!rs || !rs.rows || rs.rows.length === 0) return null;
      row = rs.rows[0];
      const [idCol, emailCol, nameCol, phCol, roleCol, createdCol] = row.items;
      return {
        id: idCol?.textValue || '',
        email: emailCol?.textValue || '',
        name: nameCol?.textValue || '',
        passwordHash: phCol?.textValue || '',
        role: roleCol?.textValue || 'user',
        avatar: '', // Поле не существует, возвращаем пустую строку
        createdAt: Number(createdCol?.uint64Value?.low || 0),
      };
    }
  });
  return result;
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
      
      // Логируем значения дат для отладки
      console.log('🔍 Отладка дат заказа:', {
        id: idCol?.textValue,
        createdCol: createdCol,
        createdColType: typeof createdCol,
        createdColValue: createdCol?.uint64Value,
        createdColLow: createdCol?.uint64Value?.low,
        updatedCol: updatedCol,
        updatedColType: typeof updatedCol,
        updatedColValue: updatedCol?.uint64Value,
        updatedColLow: updatedCol?.uint64Value?.low
      });
      
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
      createdAt: Number(createdCol?.uint64Value?.low || createdCol?.uint64Value || Date.now()),
      updatedAt: Number(updatedCol?.uint64Value?.low || updatedCol?.uint64Value || Date.now()),
      
      // Добавляем payload полностью
      payload: payload,
      
      // Извлекаем основные поля из payload для обратной совместимости
      productName: payload.productName,
      size: payload.size,
      color: payload.color,
      quantity: payload.quantity,
      image: payload.image,
      
      // Извлекаем данные о принте (для заказов из дизайнера)
      imagePosition: payload.imagePosition, // Позиционирование принта {x, y, scale, rotation}
      imageSide: payload.imageSide, // Сторона принта (перед/зад)
      printSize: payload.printSize, // Размер принта
      printPrice: payload.printPrice, // Цена принта
      
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
  
  try {
    await driver.tableClient.withSession(async (session) => {
      await session.executeQuery(
        'DECLARE $id AS Utf8;\n'
        + `DELETE FROM \`${db}/orders\` WHERE id = $id;`,
        {
          '$id': TypedValues.utf8(id),
        }
      );
    });
    console.log('✅ Заказ успешно удален из YDB:', id);
    return true;
  } catch (error) {
    console.error('❌ Ошибка удаления заказа из YDB:', error);
    throw error;
  }
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
  
  // Логируем значения для отладки
  console.log('🔍 getOrderByIdYdb отладка:', {
    id: idCol?.textValue,
    payloadCol: payloadCol,
    payloadColType: typeof payloadCol,
    payloadColJsonValue: payloadCol?.jsonValue,
    createdCol: createdCol,
    createdColType: typeof createdCol,
    createdColValue: createdCol?.uint64Value,
    createdColLow: createdCol?.uint64Value?.low,
    totalCol: totalCol,
    totalColType: typeof totalCol,
    totalColValue: totalCol?.int64Value,
    totalColLow: totalCol?.int64Value?.low
  });
  
  // Извлекаем payload
  let payload = {};
  try {
    if (payloadCol?.jsonValue) {
      payload = JSON.parse(payloadCol.jsonValue);
    } else if (payloadCol?.textValue) {
      payload = JSON.parse(payloadCol.textValue);
    }
  } catch (e) {
    console.error('❌ Failed to parse payload JSON in getOrderByIdYdb:', e);
    payload = {};
  }
  
  // Извлекаем даты с fallback
  const createdAt = Number(createdCol?.uint64Value?.low || createdCol?.uint64Value || Date.now());
  const updatedAt = Number(updatedCol?.uint64Value?.low || updatedCol?.uint64Value || Date.now());
  
  return {
    id: idCol?.textValue || '',
    userId: userIdCol?.textValue || '',
    status: statusCol?.textValue || 'new',
    payload: payload,
    totalPrice: Number(totalCol?.int64Value?.low || totalCol?.int64Value || 0),
    createdAt: createdAt,
    updatedAt: updatedAt,
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

export async function updateUserYdb(userId, { name, email, avatar }) {
  console.log('🔄 updateUserYdb called:', { userId, name, email, avatar });
  const driver = await getYdbDriver();
  const db = driver.database;
  let user = null;
  
  await driver.tableClient.withSession(async (session) => {
    // Сначала проверим, существует ли пользователь (без поля avatar)
    console.log('🔍 Checking if user exists in YDB:', userId);
    const checkRs = await session.executeQuery(
      'DECLARE $id AS Utf8;\n'
      + `SELECT id, email, name, role FROM \`${db}/users\` WHERE id = $id;`,
      { '$id': TypedValues.utf8(userId) }
    );
    
    if (checkRs.resultSets[0].rows.length === 0) {
      console.log('❌ User not found in YDB:', userId);
      return;
    }
    
    console.log('✅ User found, proceeding with update');
    
    // Обновляем пользователя БЕЗ поля avatar (так как его нет в таблице)
    console.log('🔍 Updating user without avatar field in YDB:', userId);
    await session.executeQuery(
      'DECLARE $id AS Utf8; DECLARE $name AS Utf8; DECLARE $email AS Utf8;\n'
      + `UPDATE \`${db}/users\` SET name = $name, email = $email WHERE id = $id;`,
      { 
        '$id': TypedValues.utf8(userId), 
        '$name': TypedValues.utf8(name || ''),
        '$email': TypedValues.utf8(email)
      }
    );
      
    // Получаем обновленного пользователя БЕЗ поля avatar
    const rs = await session.executeQuery(
      'DECLARE $id AS Utf8;\n'
      + `SELECT id, email, name, role FROM \`${db}/users\` WHERE id = $id;`,
      { '$id': TypedValues.utf8(userId) }
    );
    
    const result = rs.resultSets[0];
    if (result.rows.length > 0) {
      const row = result.rows[0];
      const [idCol, emailCol, nameCol, roleCol] = row.items;
      user = {
        id: idCol?.textValue || '',
        email: emailCol?.textValue || '',
        name: nameCol?.textValue || '',
        role: roleCol?.textValue || 'user',
        avatar: avatar || '1' // Используем переданное значение или дефолт
      };
      console.log('✅ User updated successfully (avatar stored in memory):', user);
    } else {
      console.log('❌ User not found after update');
    }

  });
  
  console.log('🔍 Final result from updateUserYdb:', user);
  return user;
}

export async function getUserRepo(userId) {
  const driver = await getYdbDriver();
  const db = driver.database;
  let user = null;
  
  await driver.tableClient.withSession(async (session) => {
    const rs = await session.executeQuery(
      'DECLARE $id AS Utf8;\n'
      + `SELECT id, email, name, role, avatar FROM \`${db}/users\` WHERE id = $id;`,
      { '$id': TypedValues.utf8(userId) }
    );
    
    const result = rs.resultSets[0];
    if (result.rows.length > 0) {
      const row = result.rows[0];
      const [idCol, emailCol, nameCol, roleCol, avatarCol] = row.items;
      user = {
        id: idCol?.textValue || '',
        email: emailCol?.textValue || '',
        name: nameCol?.textValue || '',
        role: roleCol?.textValue || 'user',
        avatar: avatarCol?.textValue || ''
      };
    }
  });
  
  return user;
}

export async function deleteUserYdb(userId) {
  const driver = await getYdbDriver();
  const db = driver.database;
  
  // Сначала проверим, что пользователь не админ
  let user = null;
  await driver.tableClient.withSession(async (session) => {
    const rs = await session.executeQuery(
      'DECLARE $id AS Utf8;\n'
      + `SELECT id, role FROM \`${db}/users\` WHERE id = $id;`,
      { '$id': TypedValues.utf8(userId) }
    );
    
    const result = rs.resultSets[0];
    if (result.rows.length > 0) {
      const row = result.rows[0];
      const [idCol, roleCol] = row.items;
      user = {
        id: idCol?.textValue || '',
        role: roleCol?.textValue || 'user'
      };
    }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.role === 'admin') {
    throw new Error('Cannot delete admin user');
  }
  
  // Удаляем пользователя
  await driver.tableClient.withSession(async (session) => {
    await session.executeQuery(
      'DECLARE $id AS Utf8;\n'
      + `DELETE FROM \`${db}/users\` WHERE id = $id;`,
      { '$id': TypedValues.utf8(userId) }
    );
  });
  
  return true;
}

