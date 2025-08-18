// src/lib/ydb/autoInit.js
import { getYdbDriver } from './client.js';
import { TableDescription, Column, Types } from 'ydb-sdk';

let initPromise = null;

export async function ensureTablesExist() {
  // Ensure initialization happens only once
  if (initPromise) return initPromise;
  
  initPromise = initializeTables();
  return initPromise;
}

async function initializeTables() {
  try {
    const driver = await getYdbDriver();
    const database = driver.database;
    
    await driver.tableClient.withSession(async (session) => {
      // Check and create sections table
      try {
        await session.describeTable(`${database}/sections`);
        console.log('✅ sections table exists');
      } catch {
        console.log('🔧 creating sections table...');
        const desc = new TableDescription()
          .withColumn(new Column('id', Types.UTF8))
          .withColumn(new Column('name', Types.UTF8))
          .withColumn(new Column('description', Types.UTF8))
          .withColumn(new Column('created_at', Types.UINT64))
          .withColumn(new Column('updated_at', Types.UINT64))
          .withPrimaryKey('id');
        await session.createTable(`${database}/sections`, desc);
      }

      // Check and create products table
      try {
        await session.describeTable(`${database}/products`);
        console.log('✅ products table exists');
      } catch {
        console.log('🔧 creating products table...');
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
        await session.createTable(`${database}/products`, desc);
      }

      // Check and create discounts table
      try {
        await session.describeTable(`${database}/discounts`);
        console.log('✅ discounts table exists');
      } catch {
        console.log('🔧 creating discounts table...');
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
        await session.createTable(`${database}/discounts`, desc);
      }
    });
    
    console.log('✅ YDB tables initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize YDB tables:', error.message);
    // Don't throw error to allow fallback to in-memory storage
  }
}