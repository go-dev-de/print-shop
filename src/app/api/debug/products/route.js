import { NextResponse } from 'next/server';
import { listProductsYdb } from '@/lib/ydb/catalogRepo';

export async function GET() {
  try {
    console.log('🔍 DEBUG: Fetching products for debugging...');
    
    // Получаем данные из YDB
    let ydbProducts = [];
    try {
      ydbProducts = await listProductsYdb();
      console.log('📊 YDB products count:', ydbProducts.length);
      ydbProducts.forEach((product, index) => {
        console.log(`📦 YDB Product ${index + 1}:`, {
          id: product.id,
          name: product.name,
          hasImages: !!product.images,
          imagesLength: product.images?.length || 0,
          imagesType: Array.isArray(product.images) ? 'array' : typeof product.images,
          firstImageType: product.images?.[0] ? (product.images[0].startsWith('data:') ? 'base64' : 'URL') : 'none',
          images: product.images
        });
      });
    } catch (error) {
      console.error('❌ YDB products error:', error);
    }
    
    return NextResponse.json({
      ydbProducts,
      memoryProducts: [], // Очищено - используем только YDB
      debug: {
        ydbCount: ydbProducts.length,
        memoryCount: 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Debug products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}