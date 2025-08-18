// src/lib/s3/client.js
import { S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: 'https://storage.yandexcloud.net',
  region: 'ru-central1',
  credentials: {
    accessKeyId: process.env.YC_STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.YC_STORAGE_SECRET_KEY,
  },
});

export { s3Client };