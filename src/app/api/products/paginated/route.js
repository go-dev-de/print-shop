import { NextResponse } from 'next/server';
import { listProductsYdb, listSectionsYdb } from '@/lib/ydb/catalogRepo';
import { ensureTablesExist } from '@/lib/ydb/autoInit';
import cache from '@/lib/cache';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const section = searchParams.get('section') || 'all';
    
    // Валидация параметров
    if (page < 1) return NextResponse.json({ error: 'Page must be >= 1' }, { status: 400 });
    if (limit < 1 || limit > 100) return NextResponse.json({ error: 'Limit must be between 1 and 100' }, { status: 400 });
    
    console.log(`📄 API: Fetching products page ${page}, limit ${limit}, section: ${section}`);
    
    // Проверяем кэш
    const cacheKey = `products:${page}:${limit}:${section}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`⚡ Cache HIT for ${cacheKey}`);
      return NextResponse.json(cachedData);
    }
    
    console.log(`🔄 Cache MISS for ${cacheKey}, fetching from YDB...`);
    
    // Загружаем данные из YDB
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
      let section = null;
      
      if (product.sectionId) {
        section = allSections.find(s => s.id === product.sectionId);
      } else if (product.section) {
        section = allSections.find(s => s.id === product.section || s.name === product.section);
      }
      
      return {
        ...product,
        sectionId: section?.id || product.sectionId || product.section,
        sectionName: section?.name || (product.section === 'general' ? 'Общий раздел' : product.section || 'Без раздела'),
        section: section || {
          id: product.section,
          name: product.section === 'general' ? 'Общий раздел' : (product.section || 'Без раздела')
        }
      };
    });
    
    // Фильтрация по разделу
    let filteredProducts = productsWithSections;
    if (section !== 'all') {
      filteredProducts = productsWithSections.filter(product => 
        product.sectionId === section || 
        product.section?.id === section ||
        product.section === section
      );
    }
    
    // Пагинация
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    const response = {
      products: paginatedProducts,
      sections: allSections,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
    
    // Кэшируем результат на 3 минуты
    cache.set(cacheKey, response, 3 * 60 * 1000);
    
    console.log(`✅ API: Returned ${paginatedProducts.length} products (page ${page}/${totalPages})`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in paginated products API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 