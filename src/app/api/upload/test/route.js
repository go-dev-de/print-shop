// src/app/api/upload/test/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    YC_STORAGE_ACCESS_KEY: process.env.YC_STORAGE_ACCESS_KEY ? 'SET' : 'NOT SET',
    YC_STORAGE_SECRET_KEY: process.env.YC_STORAGE_SECRET_KEY ? 'SET' : 'NOT SET', 
    YC_STORAGE_BUCKET: process.env.YC_STORAGE_BUCKET || 'NOT SET',
  };
  
  return NextResponse.json({ 
    message: 'S3 Configuration Check',
    config 
  });
}