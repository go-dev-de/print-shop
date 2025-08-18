import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { addProduct, listProducts } from '@/lib/catalogStore';
import { listProductsYdb, createProductYdb, deleteProductYdb } from '@/lib/ydb/catalogRepo';
import { ensureTablesExist } from '@/lib/ydb/autoInit';

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    // Ensure tables exist
    await ensureTablesExist();
    
    // Пытаемся получить из YDB
    const ydbProducts = await listProductsYdb();
    const inMemoryProducts = listProducts();
    
    // Убираем дубликаты: приоритет YDB данным
    const ydbIds = new Set(ydbProducts.map(p => p.id));
    const uniqueInMemoryProducts = inMemoryProducts.filter(p => !ydbIds.has(p.id));
    
    const allProducts = [...ydbProducts, ...uniqueInMemoryProducts];
    
    return NextResponse.json({ products: allProducts });
  } catch (error) {
    console.error('Failed to fetch products from YDB, falling back to in-memory:', error);
    return NextResponse.json({ products: listProducts() });
  }
}

export async function POST(request) {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    // Ensure tables exist
    await ensureTablesExist();
    
    const requestBody = await request.json();
    const { name, basePrice, sectionId, description, image, images } = requestBody;
    
    // Логируем размер запроса для отладки
    const bodySize = JSON.stringify(requestBody).length;
    console.log('📊 DEBUG: Request body size:', bodySize, 'bytes', '~', Math.round(bodySize / 1024), 'KB');
    
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    
    // Пытаемся сохранить в YDB
    try {
      const productData = {
        name,
        basePrice: parseFloat(basePrice) || 0,
        description,
        section: sectionId,
        images: images && images.length > 0 ? images : (image ? [image] : [])
      };
      console.log('💾 DEBUG: Creating product with data:', productData);
      console.log('🖼️ DEBUG: Images array:', productData.images, 'Type:', typeof productData.images, 'Length:', productData.images?.length);
      const newProduct = await createProductYdb(productData);
      console.log('📄 DEBUG: YDB returned product:', { id: newProduct.id, images: newProduct.images });
      console.log('✅ DEBUG: Product created in YDB:', newProduct.id);
      const allProducts = await listProductsYdb();
      console.log('📋 DEBUG: All products after creation:', allProducts.length);
      return NextResponse.json({ product: newProduct, products: allProducts });
    } catch (ydbError) {
      console.error('❌ DEBUG: YDB product creation failed:', ydbError.message);
      console.error('❌ DEBUG: Full YDB error:', ydbError);
      console.warn('Failed to save product to YDB, falling back to in-memory:', ydbError);
      const p = addProduct({ name, basePrice, sectionId, description, image, images });
      return NextResponse.json({ product: p, products: listProducts() });
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

