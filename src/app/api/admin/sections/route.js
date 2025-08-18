import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { addSection, listSections } from '@/lib/catalogStore';
import { listSectionsYdb, createSectionYdb, deleteSectionYdb, updateSectionYdb } from '@/lib/ydb/catalogRepo';
import { ensureTablesExist } from '@/lib/ydb/autoInit';

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    // Ensure tables exist
    await ensureTablesExist();
    
    console.log('🔍 Admin fetching sections...');
    // Пытаемся получить из YDB
    let ydbSections = [];
    try {
      ydbSections = await listSectionsYdb();
      console.log(`✅ YDB sections found: ${ydbSections.length}`);
    } catch (ydbError) {
      console.error('❌ YDB sections failed:', ydbError.message);
    }
    
    const inMemorySections = listSections();
    console.log(`📚 In-memory sections: ${inMemorySections.length}`);
    
    // Убираем дубликаты: приоритет YDB данным
    const ydbIds = new Set(ydbSections.map(s => s.id));
    const uniqueInMemorySections = inMemorySections.filter(s => !ydbIds.has(s.id));
    
    const allSections = [...ydbSections, ...uniqueInMemorySections];
    console.log(`📋 Total sections: ${allSections.length} (YDB: ${ydbSections.length}, unique in-memory: ${uniqueInMemorySections.length})`);
    
    return NextResponse.json({ sections: allSections });
  } catch (error) {
    console.error('Failed to fetch sections from YDB, falling back to in-memory:', error);
    return NextResponse.json({ sections: listSections() });
  }
}

export async function POST(request) {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    // Ensure tables exist
    await ensureTablesExist();
    
    const { name, description } = await request.json();
    console.log('🗂️ Creating section:', { name, description });
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    
    // Пытаемся сохранить в YDB
    try {
      console.log('💾 Attempting to save section to YDB...');
      const newSection = await createSectionYdb({ name, description });
      console.log('✅ Section saved to YDB:', newSection.id, newSection);
      
      const allSections = await listSectionsYdb();
      console.log('📋 Retrieved all sections from YDB, count:', allSections.length);
      console.log('📝 Section IDs:', allSections.map(s => s.id));
      
      return NextResponse.json({ section: newSection, sections: allSections });
    } catch (ydbError) {
      console.error('❌ YDB section save failed:', ydbError.message);
      console.error('❌ Full YDB error:', ydbError);
      console.warn('Failed to save section to YDB, falling back to in-memory:', ydbError);
      const s = addSection({ name });
      const inMemorySections = listSections();
      console.log('📋 Using in-memory sections, count:', inMemorySections.length);
      return NextResponse.json({ section: s, sections: inMemorySections });
    }
  } catch (error) {
    console.error('Failed to create section:', error);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(request) {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    // Ensure tables exist
    await ensureTablesExist();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Section ID required' }, { status: 400 });
    }
    
    console.log('🗑️ Deleting section:', id);
    
    // Пытаемся удалить из YDB
    try {
      await deleteSectionYdb(id);
      console.log('✅ Section deleted from YDB:', id);
      const allSections = await listSectionsYdb();
      return NextResponse.json({ sections: allSections });
    } catch (ydbError) {
      console.error('❌ YDB section delete failed, falling back to in-memory:', ydbError.message);
      // Fallback: работаем с in-memory данными (для разработки)
      const inMemorySections = listSections().filter(s => s.id !== id);
      console.log('🔄 Using in-memory fallback, sections count:', inMemorySections.length);
      return NextResponse.json({ sections: inMemorySections });
    }
  } catch (error) {
    console.error('Failed to delete section:', error);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function PATCH(request) {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const { name, description } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Section ID required' }, { status: 400 });
    }
    
    console.log('✏️ Updating section:', id, { name, description });
    
    // Пытаемся обновить в YDB
    try {
      await updateSectionYdb(id, { name, description });
      console.log('✅ Section updated in YDB:', id);
      const allSections = await listSectionsYdb();
      return NextResponse.json({ sections: allSections });
    } catch (ydbError) {
      console.error('❌ YDB section update failed:', ydbError.message);
      return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to update section:', error);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

