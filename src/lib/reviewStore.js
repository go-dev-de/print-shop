// In-memory store для отзывов (fallback если YDB недоступна)

class ReviewStore {
  constructor() {
    this.reviews = new Map();
    this.nextId = 1;
  }

  addReview(reviewData) {
    const id = `review_${this.nextId++}`;
    const now = Date.now();
    
    const review = {
      id,
      user_id: reviewData.userId || null,
      author_name: reviewData.authorName || 'Анонимный',
      author_email: reviewData.authorEmail || '',
      rating: Number(reviewData.rating) || 5,
      title: reviewData.title || '',
      content: reviewData.content || '',
      media_urls: reviewData.mediaUrls || [],
      status: reviewData.status || 'approved', // pending, approved, rejected
      created_at: now,
      updated_at: now
    };

    this.reviews.set(id, review);
    return review;
  }

  getReview(id) {
    return this.reviews.get(id) || null;
  }

  listReviews(options = {}) {
    const { status = 'approved', limit = 50, offset = 0 } = options;
    
    let allReviews = Array.from(this.reviews.values());
    
    // Фильтрация по статусу
    if (status && status !== 'all') {
      allReviews = allReviews.filter(review => review.status === status);
    }
    
    // Сортировка по дате создания (новые первые)
    allReviews.sort((a, b) => b.created_at - a.created_at);
    
    // Пагинация
    const paginatedReviews = allReviews.slice(offset, offset + limit);
    
    return {
      reviews: paginatedReviews,
      total: allReviews.length,
      hasMore: offset + limit < allReviews.length
    };
  }

  updateReview(id, updateData) {
    const review = this.reviews.get(id);
    if (!review) return null;

    const updatedReview = {
      ...review,
      ...updateData,
      updated_at: Date.now()
    };

    this.reviews.set(id, updatedReview);
    return updatedReview;
  }

  deleteReview(id) {
    const review = this.reviews.get(id);
    if (!review) return false;
    
    this.reviews.delete(id);
    return true;
  }

  // Статистика отзывов
  getStats() {
    const allReviews = Array.from(this.reviews.values());
    const approvedReviews = allReviews.filter(r => r.status === 'approved');
    
    if (approvedReviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / approvedReviews.length;
    
    const ratingDistribution = approvedReviews.reduce((dist, review) => {
      dist[review.rating] = (dist[review.rating] || 0) + 1;
      return dist;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

    return {
      totalReviews: approvedReviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution
    };
  }
}

// Глобальный экземпляр
let globalReviewStore = null;

function getGlobalReviewStore() {
  if (!globalReviewStore) {
    globalReviewStore = new ReviewStore();
    
    // Добавляем несколько демо отзывов
    globalReviewStore.addReview({
      authorName: "Анна Петрова",
      authorEmail: "anna@example.com", 
      rating: 5,
      title: "Отличная работа!",
      content: "Заказывала футболки для команды. Качество печати превосходное, доставили точно в срок. Всем очень довольны!",
      mediaUrls: [],
      status: "approved"
    });

    globalReviewStore.addReview({
      authorName: "Михаил Волков",
      authorEmail: "mikhail@example.com",
      rating: 5, 
      title: "Быстро и качественно",
      content: "Нужна была срочная печать на футболках. Сделали за день! Принт яркий, не линяет после стирки.",
      mediaUrls: [],
      status: "approved"
    });

    globalReviewStore.addReview({
      authorName: "Елена Смирнова", 
      authorEmail: "elena@example.com",
      rating: 4,
      title: "Хорошее качество",
      content: "Заказывала подарок другу - футболку с фото. Получилось очень классно! Единственное - доставка была чуть дольше обещанного.",
      mediaUrls: [],
      status: "approved"
    });
  }
  return globalReviewStore;
}

export function addReview(reviewData) {
  return getGlobalReviewStore().addReview(reviewData);
}

export function getReview(id) {
  return getGlobalReviewStore().getReview(id);
}

export function listReviews(options) {
  return getGlobalReviewStore().listReviews(options);
}

export function updateReview(id, updateData) {
  return getGlobalReviewStore().updateReview(id, updateData);
}

export function deleteReview(id) {
  return getGlobalReviewStore().deleteReview(id);
}

export function getReviewStats() {
  return getGlobalReviewStore().getStats();
}