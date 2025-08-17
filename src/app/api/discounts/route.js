import { NextResponse } from 'next/server';
import { listDiscounts, getActiveDiscounts } from '@/lib/discountStore';
import { listDiscountsYdb } from '@/lib/ydb/catalogRepo';

export async function GET() {
  try {
    // Получаем активные скидки из YDB и in-memory
    const ydbDiscounts = await listDiscountsYdb().catch(error => {
      console.warn('Failed to fetch discounts from YDB:', error);
      return [];
    });
    
    const inMemoryDiscounts = getActiveDiscounts();
    
    // Фильтруем только активные скидки из YDB
    const activeYdbDiscounts = ydbDiscounts.filter(discount => discount.isActive);
    
    // Объединяем все активные скидки
    const allActiveDiscounts = [...activeYdbDiscounts, ...inMemoryDiscounts];
    
    return NextResponse.json({ discounts: allActiveDiscounts });
  } catch (error) {
    console.error('Error fetching active discounts:', error);
    return NextResponse.json({ discounts: getActiveDiscounts() });
  }
}

