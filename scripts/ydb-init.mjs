import path from 'node:path';
import fs from 'node:fs/promises';
import ydb from 'ydb-sdk';
const { Driver, getCredentialsFromEnv, MetadataAuthService, TableDescription, Column, Types } = ydb;

async function getDriverFromEnv() {
  const endpoint = process.env.YDB_ENDPOINT || 'grpcs://ydb.serverless.yandexcloud.net:2135';
  const database = process.env.YDB_DATABASE;
  if (!database) throw new Error('YDB_DATABASE is not set');
  const authService = getCredentialsFromEnv() || new MetadataAuthService();
  const driver = new Driver({ endpoint, database, authService });
  const timeout = 10000;
  if (!(await driver.ready(timeout))) {
    throw new Error(`YDB connection failed within ${timeout}ms`);
  }
  return driver;
}

async function main() {
  const driver = await getDriverFromEnv();
  const database = process.env.YDB_DATABASE;
  const prefix = database;
  const usersPath = path.posix.join(prefix, 'users');
  const cartsPath = path.posix.join(prefix, 'carts');
  const ordersPath = path.posix.join(prefix, 'orders');
  const reviewsPath = path.posix.join(prefix, 'reviews');
  const sectionsPath = path.posix.join(prefix, 'sections');
  const productsPath = path.posix.join(prefix, 'products');
  const discountsPath = path.posix.join(prefix, 'discounts');

  await driver.tableClient.withSession(async (session) => {
    try {
      const tableDesc = await session.describeTable(usersPath);
      console.log('users table exists');
      
      // Проверяем, есть ли поле avatar
      const hasAvatarColumn = tableDesc.columns.some(col => col.name === 'avatar');
      if (!hasAvatarColumn) {
        console.log('adding avatar column to existing users table...');
        try {
          await driver.schemeClient.modifyTable(usersPath, {
            addColumns: [{
              name: 'avatar',
              type: { typeId: 'UTF8' }
            }]
          });
          console.log('✅ Avatar column added to users table');
        } catch (error) {
          console.warn('Failed to add avatar column:', error.message);
        }
      }
    } catch {
      console.log('creating users table...');
      const desc = new TableDescription()
        .withColumn(new Column('id', Types.UTF8))
        .withColumn(new Column('email', Types.UTF8))
        .withColumn(new Column('name', Types.UTF8))
        .withColumn(new Column('password_hash', Types.UTF8))
        .withColumn(new Column('role', Types.UTF8))
        .withColumn(new Column('avatar', Types.UTF8))
        .withColumn(new Column('created_at', Types.UINT64))
        .withPrimaryKey('id');
      await session.createTable(usersPath, desc);
    }

    try {
      await session.describeTable(cartsPath);
      console.log('carts table exists');
    } catch {
      console.log('creating carts table...');
      const desc = new TableDescription()
        .withColumn(new Column('id', Types.UTF8))
        .withColumn(new Column('user_id', Types.UTF8))
        .withColumn(new Column('items', Types.JSON))
        .withColumn(new Column('updated_at', Types.UINT64))
        .withPrimaryKey('id');
      await session.createTable(cartsPath, desc);
    }

    try {
      await session.describeTable(ordersPath);
      console.log('orders table exists');
    } catch {
      console.log('creating orders table...');
      const desc = new TableDescription()
        .withColumn(new Column('id', Types.UTF8))
        .withColumn(new Column('user_id', Types.UTF8))
        .withColumn(new Column('status', Types.UTF8))
        .withColumn(new Column('payload', Types.JSON))
        .withColumn(new Column('total_price', Types.INT64))
        .withColumn(new Column('created_at', Types.UINT64))
        .withColumn(new Column('updated_at', Types.UINT64))
        .withPrimaryKey('id');
      await session.createTable(ordersPath, desc);
    }

    try {
      await session.describeTable(reviewsPath);
      console.log('reviews table exists');
    } catch {
      console.log('creating reviews table...');
      const desc = new TableDescription()
        .withColumn(new Column('id', Types.UTF8))
        .withColumn(new Column('user_id', Types.UTF8))
        .withColumn(new Column('author_name', Types.UTF8))
        .withColumn(new Column('author_email', Types.UTF8))
        .withColumn(new Column('rating', Types.INT32))
        .withColumn(new Column('title', Types.UTF8))
        .withColumn(new Column('content', Types.UTF8))
        .withColumn(new Column('media_urls', Types.JSON))
        .withColumn(new Column('status', Types.UTF8))
        .withColumn(new Column('created_at', Types.UINT64))
        .withColumn(new Column('updated_at', Types.UINT64))
        .withPrimaryKey('id');
      await session.createTable(reviewsPath, desc);
    }

    // Создаем таблицу sections
    try {
      await session.describeTable(sectionsPath);
      console.log('sections table exists');
    } catch {
      console.log('creating sections table...');
      const desc = new TableDescription()
        .withColumn(new Column('id', Types.UTF8))
        .withColumn(new Column('name', Types.UTF8))
        .withColumn(new Column('description', Types.UTF8))
        .withColumn(new Column('created_at', Types.UINT64))
        .withColumn(new Column('updated_at', Types.UINT64))
        .withPrimaryKey('id');
      await session.createTable(sectionsPath, desc);
    }

    // Создаем таблицу products
    try {
      await session.describeTable(productsPath);
      console.log('products table exists');
    } catch {
      console.log('creating products table...');
      const desc = new TableDescription()
        .withColumn(new Column('id', Types.UTF8))
        .withColumn(new Column('name', Types.UTF8))
        .withColumn(new Column('base_price', Types.DOUBLE))
        .withColumn(new Column('description', Types.UTF8))
        .withColumn(new Column('section', Types.UTF8))
        .withColumn(new Column('images', Types.JSON))
        .withColumn(new Column('created_at', Types.UINT64))
        .withColumn(new Column('updated_at', Types.UINT64))
        .withPrimaryKey('id');
      await session.createTable(productsPath, desc);
    }

    // Создаем таблицу discounts
    try {
      await session.describeTable(discountsPath);
      console.log('discounts table exists');
    } catch {
      console.log('creating discounts table...');
      const desc = new TableDescription()
        .withColumn(new Column('id', Types.UTF8))
        .withColumn(new Column('name', Types.UTF8))
        .withColumn(new Column('percentage', Types.DOUBLE))
        .withColumn(new Column('sections', Types.JSON))
        .withColumn(new Column('products', Types.JSON))
        .withColumn(new Column('is_active', Types.BOOL))
        .withColumn(new Column('created_at', Types.UINT64))
        .withColumn(new Column('updated_at', Types.UINT64))
        .withPrimaryKey('id');
      await session.createTable(discountsPath, desc);
    }
  });
  console.log('Schema initialized.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

