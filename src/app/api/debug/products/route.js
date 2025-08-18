import { NextResponse } from 'next/server';
import { listProducts, listSections } from '@/lib/catalogStore';
import { listProductsYdb, listSectionsYdb } from '@/lib/ydb/catalogRepo';
import { ensureTablesExist } from '@/lib/ydb/autoInit';

export async function GET() {
  try {
    console.log('🔍 DEBUG: Starting product debug...');
    
    // Ensure tables exist
    await ensureTablesExist();
    console.log('✅ DEBUG: Tables initialized');
    
    // Get YDB data
    let ydbProducts = [];
    let ydbSections = [];
    
    try {
      ydbProducts = await listProductsYdb();
      console.log('🗄️ DEBUG: YDB Products:', ydbProducts.length, ydbProducts);
    } catch (error) {
      console.error('❌ DEBUG: YDB Products error:', error.message);
    }
    
    try {
      ydbSections = await listSectionsYdb();
      console.log('🗂️ DEBUG: YDB Sections:', ydbSections.length, ydbSections);
    } catch (error) {
      console.error('❌ DEBUG: YDB Sections error:', error.message);
    }
    
    // Get in-memory data
    const inMemoryProducts = listProducts();
    const inMemorySections = listSections();
    console.log('💾 DEBUG: In-memory Products:', inMemoryProducts.length, inMemoryProducts);
    console.log('💾 DEBUG: In-memory Sections:', inMemorySections.length, inMemorySections);
    
    // Combined data
    const allProducts = [...ydbProducts, ...inMemoryProducts];
    const allSections = [...ydbSections, ...inMemorySections];
    console.log('📋 DEBUG: All Products:', allProducts.length);
    console.log('📋 DEBUG: All Sections:', allSections.length);
    
    return NextResponse.json({ 
      debug: true,
      timestamp: new Date().toISOString(),
      ydb: {
        products: ydbProducts,
        sections: ydbSections
      },
      inMemory: {
        products: inMemoryProducts,
        sections: inMemorySections
      },
      totals: {
        products: allProducts.length,
        sections: allSections.length
      }
    });
  } catch (error) {
    console.error('💥 DEBUG: Fatal error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}