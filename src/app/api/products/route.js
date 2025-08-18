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
    const productsWithSections = allProducts.map(product => {
      // Ищем раздел: сначала по sectionId, потом по section (ID или название)
      let section = null;
      
      if (product.sectionId) {
        // Есть поле sectionId - ищем по ID
        section = allSections.find(s => s.id === product.sectionId);
      } else if (product.section) {
        // Есть поле section - может быть ID или название
        section = allSections.find(s => s.id === product.section || s.name === product.section);
      }
      
      return {
        ...product,
        sectionId: section?.id || product.sectionId || product.section, // ID раздела для скидок и фильтров
        sectionName: section?.name || product.section || 'Без раздела',
        section: section || { // Полный объект раздела для отображения или заглушка
          id: product.section,
          name: product.section || 'Без раздела'
        }
      };
    });
    
    return NextResponse.json({ 
      products: productsWithSections,
      sections: allSections 
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}