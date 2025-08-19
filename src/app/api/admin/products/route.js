import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { listProductsYdb, createProductYdb, deleteProductYdb } from '@/lib/ydb/catalogRepo';
import { ensureTablesExist } from '@/lib/ydb/autoInit';

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    // Получаем данные только из YDB
    await ensureTablesExist();
    const allProducts = await listProductsYdb();
    
    console.log(`📊 Products loaded from YDB: ${allProducts.length}`);
    
    return NextResponse.json({ products: allProducts });
  } catch (error) {
    console.error('Failed to fetch products from YDB:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request) {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    const { name, basePrice, sectionId, description, image, images } = await request.json();
    console.log('🛍️ Creating product:', { name, basePrice, sectionId, hasImages: !!(images?.length) });
    
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    
    // Простое создание товара - как разделы
    try {
      console.log('💾 Attempting to save product to YDB...');
      await ensureTablesExist();
      const newProduct = await createProductYdb({ 
        name, 
        basePrice: parseFloat(basePrice) || 0, 
        description, 
        section: sectionId,
        images: images || []
      });
      console.log('✅ Product saved to YDB:', newProduct.id);
      
      const allProducts = await listProductsYdb();
      console.log('📋 Retrieved all products from YDB, count:', allProducts.length);
      
      return NextResponse.json({ product: newProduct, products: allProducts });
    } catch (ydbError) {
      console.error('❌ YDB product save failed:', ydbError.message);
      return NextResponse.json({ error: 'Failed to save product to YDB: ' + ydbError.message }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(request) {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    console.log('🔍 DELETE request received. ID from params:', id, 'Type:', typeof id);
    console.log('🔗 Full URL:', request.url);
    
    if (!id) {
      console.log('❌ No ID provided in request');
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }
    
    console.log('🗑️ Attempting to delete product:', id);
    
    // Пытаемся удалить из YDB
    try {
      await deleteProductYdb(id);
      console.log('✅ Product deleted from YDB:', id);
      const allProducts = await listProductsYdb();
      console.log('📋 Returning updated products list, count:', allProducts.length);
      return NextResponse.json({ products: allProducts });
    } catch (ydbError) {
      console.error('❌ YDB product delete failed:', ydbError.message);
      console.error('❌ Full YDB error:', ydbError);
      return NextResponse.json({ error: 'Failed to delete product: ' + ydbError.message }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Failed to delete product:', error);
    return NextResponse.json({ error: 'Bad request: ' + error.message }, { status: 400 });
  }
}

