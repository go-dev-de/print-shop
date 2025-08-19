import { getYdbDriver } from './client.js';
import { TypedValues } from 'ydb-sdk';
import crypto from 'crypto';

function json(obj) {
  return JSON.stringify(obj);
}

// === REVIEWS ===

export async function createReviewYdb(reviewData) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const id = crypto.randomUUID();
  const now = Date.now();

  await driver.tableClient.withSession(async (session) => {
    await session.executeQuery(
      'DECLARE $id AS Utf8; DECLARE $userId AS Utf8; DECLARE $authorName AS Utf8; DECLARE $authorEmail AS Utf8; DECLARE $rating AS Int32; DECLARE $title AS Utf8; DECLARE $content AS Utf8; DECLARE $mediaUrls AS Utf8; DECLARE $status AS Utf8; DECLARE $created AS Uint64; DECLARE $updated AS Uint64;\n'
      + `UPSERT INTO \`${db}/reviews\` (id, user_id, author_name, author_email, rating, title, content, media_urls, status, created_at, updated_at) VALUES ($id, $userId, $authorName, $authorEmail, $rating, $title, $content, CAST($mediaUrls AS Json), $status, $created, $updated);`,
      {
        '$id': TypedValues.utf8(id),
        '$userId': TypedValues.utf8(reviewData.userId || ''),
        '$authorName': TypedValues.utf8(reviewData.authorName || 'Анонимный'),
        '$authorEmail': TypedValues.utf8(reviewData.authorEmail || ''),
        '$rating': TypedValues.int32(Number(reviewData.rating) || 5),
        '$title': TypedValues.utf8(reviewData.title || ''),
        '$content': TypedValues.utf8(reviewData.content || ''),
        '$mediaUrls': TypedValues.utf8(json(reviewData.mediaUrls || [])),
        '$status': TypedValues.utf8(reviewData.status || 'pending'),
        '$created': TypedValues.uint64(now),
        '$updated': TypedValues.uint64(now),
      }
    );
  });

  return {
    id,
    userId: reviewData.userId || null,
    authorName: reviewData.authorName || 'Анонимный',
    authorEmail: reviewData.authorEmail || '',
    rating: Number(reviewData.rating) || 5,
    title: reviewData.title || '',
    content: reviewData.content || '',
    mediaUrls: reviewData.mediaUrls || [],
    status: reviewData.status || 'pending',
    createdAt: now,
    updatedAt: now
  };
}

export async function listReviewsYdb(options = {}) {
  const driver = await getYdbDriver();
  const db = driver.database;
  const { status = 'approved', limit = 50 } = options;

  const rows = await driver.tableClient.withSession(async (session) => {
    let query, params;
    
    if (status === 'all') {
      // Для админа - показываем все отзывы
      query = 'DECLARE $limit AS Uint64;\n'
        + `SELECT id, user_id, author_name, author_email, rating, title, content, media_urls, status, created_at, updated_at FROM \`${db}/reviews\` ORDER BY created_at DESC LIMIT $limit;`;
      params = { '$limit': TypedValues.uint64(limit) };
    } else {
      // Для пользователей - фильтруем по статусу
      query = 'DECLARE $status AS Utf8; DECLARE $limit AS Uint64;\n'
        + `SELECT id, user_id, author_name, author_email, rating, title, content, media_urls, status, created_at, updated_at FROM \`${db}/reviews\` WHERE status = $status ORDER BY created_at DESC LIMIT $limit;`;
      params = {
        '$status': TypedValues.utf8(status),
        '$limit': TypedValues.uint64(limit)
      };
    }
    
    const { resultSets } = await session.executeQuery(query, params);
    return resultSets?.[0]?.rows || [];
  });

  const reviews = rows.map((row) => {
    const [idCol, userIdCol, authorNameCol, authorEmailCol, ratingCol, titleCol, contentCol, mediaUrlsCol, statusCol, createdCol, updatedCol] = row.items;
    return {
      id: idCol?.textValue || '',
      userId: userIdCol?.textValue || null,
      authorName: authorNameCol?.textValue || 'Анонимный',
      authorEmail: authorEmailCol?.textValue || '',
      rating: Number(ratingCol?.int32Value) || 5,
      title: titleCol?.textValue || '',
      content: contentCol?.textValue || '',
      mediaUrls: JSON.parse(mediaUrlsCol?.jsonValue || '[]'),
      status: statusCol?.textValue || 'pending',
      createdAt: Number(createdCol?.uint64Value) || 0,
      updatedAt: Number(updatedCol?.uint64Value) || 0
    };
  }).filter(review => review.id && review.id.trim() !== ''); // Фильтруем отзывы с пустыми ID

  return {
    reviews,
    total: reviews.length,
    hasMore: reviews.length >= limit
  };
}

export async function updateReviewYdb(id, updateData) {
  const driver = await getYdbDriver();
  const db = driver.database;

  await driver.tableClient.withSession(async (session) => {
    await session.executeQuery(
      'DECLARE $id AS Utf8; DECLARE $status AS Utf8; DECLARE $updated AS Uint64;\n'
      + `UPDATE \`${db}/reviews\` SET status = $status, updated_at = $updated WHERE id = $id;`,
      {
        '$id': TypedValues.utf8(id),
        '$status': TypedValues.utf8(updateData.status),
        '$updated': TypedValues.uint64(Date.now())
      }
    );
  });

  return true;
}

export async function deleteReviewYdb(id) {
  const driver = await getYdbDriver();
  const db = driver.database;

  await driver.tableClient.withSession(async (session) => {
    await session.executeQuery(
      'DECLARE $id AS Utf8;\n'
      + `DELETE FROM \`${db}/reviews\` WHERE id = $id;`,
      { '$id': TypedValues.utf8(id) }
    );
  });

  return true;
}