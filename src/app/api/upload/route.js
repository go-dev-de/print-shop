// src/app/api/upload/route.js
import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3/client';
import crypto from 'crypto';

const BUCKET_NAME = process.env.YC_STORAGE_BUCKET || 'print-shop-images';

export async function POST(request) {
  try {
    console.log('📤 Starting file upload...');
    
    // Проверяем переменные окружения
    if (!process.env.YC_STORAGE_ACCESS_KEY || !process.env.YC_STORAGE_SECRET_KEY) {
      console.error('❌ S3 credentials not configured');
      return NextResponse.json({ 
        error: 'S3 storage not configured' 
      }, { status: 500 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files');
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    console.log(`📁 Processing ${files.length} files...`);
    const uploadedUrls = [];

    for (const file of files) {
      if (!file || !file.name) {
        console.warn('⚠️ Skipping invalid file');
        continue;
      }

      // Генерируем уникальное имя файла
      const fileExtension = file.name.split('.').pop();
      const fileName = `products/${crypto.randomUUID()}.${fileExtension}`;
      
      // Конвертируем файл в Buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      console.log(`📎 Uploading: ${file.name} → ${fileName} (${Math.round(buffer.length / 1024)}KB)`);

      // Загружаем в S3
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        ACL: 'public-read', // Публичный доступ для отображения
      });

      await s3Client.send(command);
      
      // Формируем публичный URL
      const publicUrl = `https://storage.yandexcloud.net/${BUCKET_NAME}/${fileName}`;
      uploadedUrls.push(publicUrl);
      
      console.log(`✅ Uploaded: ${publicUrl}`);
    }

    return NextResponse.json({ 
      success: true, 
      urls: uploadedUrls 
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({ 
      error: error.message || 'Upload failed' 
    }, { status: 500 });
  }
}