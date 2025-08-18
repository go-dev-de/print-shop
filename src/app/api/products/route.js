import { NextResponse } from 'next/server';
import { listProducts, listSections } from '@/lib/catalogStore';
import { listProductsYdb, listSectionsYdb } from '@/lib/ydb/catalogRepo';
import { ensureTablesExist } from '@/lib/ydb/autoInit';

export async function GET() {
  try {
    // Ensure YDB tables exist on first run
    await ensureTablesExist();
    
    // Получаем данные из YDB и in-memory
    const ydbProducts = await listProductsYdb().catch(error => {
      console.warn('Failed to fetch products from YDB:', error);
      return [];
    });
    const ydbSections = await listSectionsYdb().catch(error => {
      console.warn('Failed to fetch sections from YDB:', error);
      return [];
    });
    
    const inMemoryProducts = listProducts();
    const inMemorySections = listSections();
    
    // Объединяем данные
    const allProducts = [...ydbProducts, ...inMemoryProducts];
    const allSections = [...ydbSections, ...inMemorySections];
    
    // Добавляем информацию о разделе к каждому товару
    const productsWithSections = allProducts.map(product => ({
      ...product,
      section: allSections.find(s => s.id === product.sectionId || s.name === product.section) || null
    }));
    
    return NextResponse.json({ 
      products: productsWithSections,
      sections: allSections 
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}