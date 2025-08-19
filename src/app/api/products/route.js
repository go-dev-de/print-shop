import { NextResponse } from 'next/server';
import { listProducts, listSections } from '@/lib/catalogStore';
import { listProductsYdb, listSectionsYdb } from '@/lib/ydb/catalogRepo';
import { ensureTablesExist } from '@/lib/ydb/autoInit';
import { listProductsFile, listSectionsFile } from '@/lib/fileStore';

export async function GET() {
  try {
    // Получаем данные из всех источников
    let ydbProducts = [];
    let ydbSections = [];
    
    try {
      await ensureTablesExist();
      ydbProducts = await listProductsYdb();
      ydbSections = await listSectionsYdb();
    } catch (ydbError) {
      console.warn('YDB not available:', ydbError.message);
    }
    
    const fileProducts = listProductsFile();
    const fileSections = listSectionsFile();
    const inMemoryProducts = listProducts();
    const inMemorySections = listSections();
    
    // Объединяем данные с приоритетом: YDB > File > Memory
    const productsMap = new Map();
    const sectionsMap = new Map();
    
    [...inMemoryProducts, ...fileProducts, ...ydbProducts].forEach(product => {
      if (product.id) productsMap.set(product.id, product);
    });
    
    [...inMemorySections, ...fileSections, ...ydbSections].forEach(section => {
      if (section.id) sectionsMap.set(section.id, section);
    });
    
    const allProducts = Array.from(productsMap.values());
    const allSections = Array.from(sectionsMap.values());
    
    console.log(`📊 Public API: Products=${allProducts.length}, Sections=${allSections.length}`);
    
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
    
    return NextResponse.json({ 
      products: productsWithSections,
      sections: allSections 
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}