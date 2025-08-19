import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { addReview, listReviews } from '@/lib/reviewStore';
import { createReviewYdb, listReviewsYdb } from '@/lib/ydb/reviewsRepo';
import { initSchemaIfNeeded } from '@/lib/ydb/repo';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'approved';
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;
    const isAdmin = searchParams.get('admin') === 'true';
    const offset = (page - 1) * limit;

    // Для админа показываем все отзывы, для пользователей только одобренные
    const finalStatus = isAdmin ? 'all' : status;

    let result;
    try {
      await initSchemaIfNeeded();
      result = await listReviewsYdb({ status: finalStatus, limit, offset });
    } catch (ydbError) {
      console.warn('YDB reviews query failed, using memory store:', ydbError.message);
      result = listReviews({ status: finalStatus, limit, offset });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: 'Ошибка загрузки отзывов' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getSession();
    const body = await request.json();
    
    // Валидация обязательных полей
    if (!body.content || body.content.trim().length < 10) {
      return NextResponse.json({ error: 'Отзыв должен содержать минимум 10 символов' }, { status: 400 });
    }

    if (!body.authorName || body.authorName.trim().length < 2) {
      return NextResponse.json({ error: 'Укажите ваше имя (минимум 2 символа)' }, { status: 400 });
    }

    const rating = parseInt(body.rating);
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Рейтинг должен быть от 1 до 5' }, { status: 400 });
    }

    const reviewData = {
      userId: user?.id || null,
      authorName: body.authorName.trim(),
      authorEmail: body.authorEmail?.trim() || '',
      rating: rating,
      title: body.title?.trim() || '',
      content: body.content.trim(),
      mediaUrls: Array.isArray(body.mediaUrls) ? body.mediaUrls : [],
      status: 'approved' // Автоматическое одобрение для демо (в продакшене - 'pending')
    };

    let review;
    try {
      await initSchemaIfNeeded();
      review = await createReviewYdb(reviewData);
    } catch (ydbError) {
      console.warn('YDB review creation failed, using memory store:', ydbError.message);
      review = addReview(reviewData);
    }

    return NextResponse.json({ 
      success: true, 
      review,
      message: 'Отзыв отправлен на модерацию. Спасибо за ваш отзыв!' 
    });
  } catch (error) {
    console.error('Review POST error:', error);
    return NextResponse.json({ error: 'Ошибка при создании отзыва' }, { status: 500 });
  }
}