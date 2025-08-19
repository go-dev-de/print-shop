import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { listSectionsYdb, createSectionYdb, deleteSectionYdb, updateSectionYdb } from '@/lib/ydb/catalogRepo';
import { ensureTablesExist } from '@/lib/ydb/autoInit';

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    await ensureTablesExist();
    
    console.log('🔍 Admin fetching sections from YDB...');
    const allSections = await listSectionsYdb();
    console.log(`✅ YDB sections found: ${allSections.length}`);
    
    return NextResponse.json({ sections: allSections });
  } catch (error) {
    console.error('Failed to fetch sections from YDB:', error);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
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
      return NextResponse.json({ error: 'Failed to save section to YDB: ' + ydbError.message }, { status: 500 });
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
      console.error('❌ YDB section delete failed:', ydbError.message);
      return NextResponse.json({ error: 'Failed to delete section: ' + ydbError.message }, { status: 500 });
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

