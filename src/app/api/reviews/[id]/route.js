import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { deleteReview } from '@/lib/reviewStore';
import { deleteReviewYdb } from '@/lib/ydb/reviewsRepo';
import { initSchemaIfNeeded } from '@/lib/ydb/repo';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await getSession();
    
    // Проверяем, что пользователь админ
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    let success = false;
    
    // Пытаемся удалить из YDB
    try {
      await initSchemaIfNeeded();
      success = await deleteReviewYdb(id);
    } catch (ydbError) {
      console.warn('YDB review deletion failed, trying memory store:', ydbError.message);
      // Fallback к in-memory
      success = deleteReview(id);
    }

    if (!success) {
      return NextResponse.json({ error: 'Отзыв не найден' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Отзыв удален' });
  } catch (error) {
    console.error('Review DELETE error:', error);
    return NextResponse.json({ error: 'Ошибка удаления отзыва' }, { status: 500 });
  }
}