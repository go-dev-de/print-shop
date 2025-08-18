import { NextResponse } from 'next/server';
import { listProducts, listSections } from '@/lib/catalogStore';
import { listProductsYdb, listSectionsYdb } from '@/lib/ydb/catalogRepo';
import { ensureTablesExist } from '@/lib/ydb/autoInit';

export async function GET() {
  try {
    console.log('🔍 DEBUG: Starting product debug...');
    console.log('🌍 DEBUG: Environment variables:');
    console.log('   YDB_ENDPOINT:', process.env.YDB_ENDPOINT);
    console.log('   YDB_DATABASE:', `"${process.env.YDB_DATABASE}"` );
    console.log('   YDB_SA_KEY_JSON:', process.env.YDB_SA_KEY_JSON ? 'SET' : 'NOT SET');
    console.log('   YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS:', process.env.YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS ? 'SET' : 'NOT SET');
    
    // Ensure tables exist
    await ensureTablesExist();
    console.log('✅ DEBUG: Tables initialized');
    
    // Get YDB data
    let ydbProducts = [];
    let ydbSections = [];
    let ydbError = null;
    
    try {
      ydbProducts = await listProductsYdb();
      console.log('🗄️ DEBUG: YDB Products:', ydbProducts.length, ydbProducts);
    } catch (error) {
      ydbError = error.message;
      console.error('❌ DEBUG: YDB Products error:', error.message);
      console.error('❌ DEBUG: Full YDB error:', error);
    }
    
    try {
      ydbSections = await listSectionsYdb();
      console.log('🗂️ DEBUG: YDB Sections:', ydbSections.length, ydbSections);
    } catch (error) {
      if (!ydbError) ydbError = error.message;
      console.error('❌ DEBUG: YDB Sections error:', error.message);
      console.error('❌ DEBUG: Full YDB error:', error);
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
      environment: {
        YDB_ENDPOINT: process.env.YDB_ENDPOINT,
        YDB_DATABASE: process.env.YDB_DATABASE,
        YDB_SA_KEY_JSON_LENGTH: process.env.YDB_SA_KEY_JSON?.length || 0,
        YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS: process.env.YDB_SERVICE_ACCOUNT_KEY_FILE_CREDENTIALS
      },
      ydb: {
        products: ydbProducts,
        sections: ydbSections,
        error: ydbError
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