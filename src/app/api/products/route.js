import { NextResponse } from 'next/server';
import { listProductsYdb, listSectionsYdb } from '@/lib/ydb/catalogRepo';
import { ensureTablesExist } from '@/lib/ydb/autoInit';
import cache from '@/lib/cache';

export async function GET() {
  try {
    // Проверяем кэш
    const cacheKey = 'products:all';
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log('⚡ Cache HIT for products:all');
      return NextResponse.json(cachedData);
    }
    
    console.log('🔄 Cache MISS for products:all, fetching from YDB...');
    
    // Загружаем данные только из YDB
    await ensureTablesExist();
    
    const allProducts = await listProductsYdb().catch(error => {
      console.warn('Failed to fetch products from YDB:', error);
      return [];
    });
    const allSections = await listSectionsYdb().catch(error => {
      console.warn('Failed to fetch sections from YDB:', error);
      return [];
    });
    
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
        sectionName: section?.name || (product.section === 'general' ? 'Общий раздел' : product.section || 'Без раздела'),
        section: section || { // Полный объект раздела для отображения или заглушка
          id: product.section,
          name: product.section === 'general' ? 'Общий раздел' : (product.section || 'Без раздела')
        }
      };
    });
    
    const response = { 
      products: productsWithSections,
      sections: allSections 
    };
    
    // Кэшируем результат на 5 минут
    cache.set(cacheKey, response, 5 * 60 * 1000);
    
    console.log(`✅ API: Returned ${productsWithSections.length} products and ${allSections.length} sections`);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}