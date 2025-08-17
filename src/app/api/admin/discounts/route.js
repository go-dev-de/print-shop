import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { addDiscount, listDiscounts } from '@/lib/discountStore';
import { listDiscountsYdb, createDiscountYdb, deleteDiscountYdb } from '@/lib/ydb/catalogRepo';

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    // Пытаемся получить из YDB
    const ydbDiscounts = await listDiscountsYdb();
    const inMemoryDiscounts = listDiscounts();
    
    // Убираем дубликаты: приоритет YDB данным
    const ydbIds = new Set(ydbDiscounts.map(d => d.id));
    const uniqueInMemoryDiscounts = inMemoryDiscounts.filter(d => !ydbIds.has(d.id));
    
    const allDiscounts = [...ydbDiscounts, ...uniqueInMemoryDiscounts];
    
    return NextResponse.json({ discounts: allDiscounts });
  } catch (error) {
    console.error('Failed to fetch discounts from YDB, falling back to in-memory:', error);
    return NextResponse.json({ discounts: listDiscounts() });
  }
}

export async function POST(request) {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    const payload = await request.json();
    
    // Пытаемся сохранить в YDB
    try {
      const newDiscount = await createDiscountYdb(payload || {});
      const allDiscounts = await listDiscountsYdb();
      return NextResponse.json({ discount: newDiscount, discounts: allDiscounts });
    } catch (ydbError) {
      console.warn('Failed to save discount to YDB, falling back to in-memory:', ydbError);
      const d = addDiscount(payload || {});
      return NextResponse.json({ discount: d, discounts: listDiscounts() });
    }
  } catch (error) {
    console.error('Failed to create discount:', error);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(request) {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Discount ID required' }, { status: 400 });
    }
    
    console.log('🗑️ Deleting discount:', id);
    
    // Пытаемся удалить из YDB
    try {
      await deleteDiscountYdb(id);
      console.log('✅ Discount deleted from YDB:', id);
      const allDiscounts = await listDiscountsYdb();
      return NextResponse.json({ discounts: allDiscounts });
    } catch (ydbError) {
      console.error('❌ YDB discount delete failed:', ydbError.message);
      return NextResponse.json({ error: 'Failed to delete discount' }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to delete discount:', error);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

