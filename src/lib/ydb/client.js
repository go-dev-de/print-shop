import { Driver, getCredentialsFromEnv, MetadataAuthService } from 'ydb-sdk';
import path from 'node:path';
import fs from 'node:fs';

let sharedDriver = null;

export async function getYdbDriver() {
  if (sharedDriver) return sharedDriver;
  
  // Use environment variables with fallback
  const endpoint = process.env.YDB_ENDPOINT || 'grpcs://ydb.serverless.yandexcloud.net:2135';
  const database = process.env.YDB_DATABASE || '/ru-central1/b1gg229m54tpdno56431/etn4bo731i5c82gkkppa';
  
  console.log('🔍 YDB Connection Debug:');
  console.log('- Endpoint:', endpoint);
  console.log('- Database:', database);
  console.log('- SA Key Path:', process.env.YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS);
  
  if (!database) throw new Error('YDB_DATABASE is not set');

  // Handle SA key for production
  const saKeyJson = process.env.YDB_SA_KEY_JSON;
  if (saKeyJson) {
    // Production: use SA key from environment variable
    process.env.YDB_SERVICE_ACCOUNT_KEY = saKeyJson;
  } else {
    // Development: use SA key file
    const rawKeyPath = process.env.YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS;
    const saKeyPath = rawKeyPath || path.join(process.cwd(), '.secrets', 'ydb-sa.json');
    
    if (fs.existsSync(saKeyPath)) {
      process.env.YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS = saKeyPath;
    } else {
      throw new Error(`SA key file not found at: ${saKeyPath}`);
    }
  }

  const authService = getCredentialsFromEnv() || new MetadataAuthService();
  const driver = new Driver({ endpoint, database, authService });
  const timeout = 10000; // Increased timeout for production
  if (!(await driver.ready(timeout))) {
    throw new Error(`YDB connection failed within ${timeout}ms`);
  }
  sharedDriver = driver;
  return driver;
}

