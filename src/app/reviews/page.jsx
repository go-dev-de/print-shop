'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserProfile from '@/components/UserProfile';
import Breadcrumbs from '@/components/Breadcrumbs';
import MobileMenu from '@/components/MobileMenu';
import CartDropdown from '@/components/CartDropdown';

// Компонент звездочек для рейтинга
function StarRating({ rating, interactive = false, onRatingChange = null, size = 'md' }) {
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const handleStarClick = (starRating) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating) => {
    if (interactive) {
      setHoveredRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoveredRating(0);
    }
  };

  const displayRating = interactive && hoveredRating > 0 ? hoveredRating : rating;

  return (
    <div className="flex items-center space-x-1" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleStarClick(star)}
          onMouseEnter={() => handleStarHover(star)}
          className={`${sizeClasses[size]} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          disabled={!interactive}
        >
          <svg
            fill={star <= displayRating ? '#fbbf24' : '#e5e7eb'}
            stroke={star <= displayRating ? '#fbbf24' : '#d1d5db'}
            strokeWidth={1}
            viewBox="0 0 24 24"
            className="transition-colors duration-150"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

// Компонент одного отзыва
function ReviewCard({ review }) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  const nextMedia = () => {
    if (review.mediaUrls && review.mediaUrls.length > 1) {
      setCurrentMediaIndex((prev) => (prev + 1) % review.mediaUrls.length);
    }
  };

  const prevMedia = () => {
    if (review.mediaUrls && review.mediaUrls.length > 1) {
      setCurrentMediaIndex((prev) => (prev - 1 + review.mediaUrls.length) % review.mediaUrls.length);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="card card-lg max-w-2xl mx-auto animate-scale-in bg-gray-700">
      {/* Заголовок отзыва */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-subheading text-white mb-2">{review.authorName}</h3>
          <StarRating rating={review.rating} size="md" />
        </div>
        <div className="text-caption text-gray-400">
          {formatDate(review.createdAt)}
        </div>
      </div>

      {/* Заголовок отзыва */}
      {review.title && (
        <h4 className="text-heading text-white mb-4">{review.title}</h4>
      )}

      {/* Медиа контент */}
      {review.mediaUrls && review.mediaUrls.length > 0 && (
        <div className="relative mb-4">
          <div className="relative h-64 bg-gray-600 rounded-lg overflow-hidden">
            {review.mediaUrls[currentMediaIndex].includes('.mp4') || 
             review.mediaUrls[currentMediaIndex].includes('.webm') || 
             review.mediaUrls[currentMediaIndex].includes('.mov') ? (
              <video 
                src={review.mediaUrls[currentMediaIndex]} 
                controls 
                className="w-full h-full object-cover"
              >
                Ваш браузер не поддерживает видео.
              </video>
            ) : (
              <img 
                src={review.mediaUrls[currentMediaIndex]} 
                alt={`Медиа ${currentMediaIndex + 1}`}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Навигация по медиа */}
          {review.mediaUrls.length > 1 && (
            <>
              <button
                onClick={prevMedia}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-all"
              >
                ‹
              </button>
              <button
                onClick={nextMedia}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-all"
              >
                ›
              </button>
              
              {/* Индикаторы */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {review.mediaUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentMediaIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
              
              {/* Счетчик */}
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {currentMediaIndex + 1}/{review.mediaUrls.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* Текст отзыва */}
      <p className="text-body text-gray-300 leading-relaxed">{review.content}</p>
    </div>
  );
}

// Компонент формы добавления отзыва
function ReviewForm({ onReviewSubmit }) {
  const [formData, setFormData] = useState({
    authorName: '',
    authorEmail: '',
    rating: 5,
    title: '',
    content: '',
    mediaUrls: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Простая валидация файлов
    const validFiles = files.filter(file => {
      const isValidImage = file.type.startsWith('image/');
      const isValidVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return (isValidImage || isValidVideo) && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setMessage('Некоторые файлы не были добавлены. Поддерживаются только изображения и видео до 10MB.');
    }

    // Конвертируем в base64 для демонстрации
    const mediaUrls = [];
    for (const file of validFiles) {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      mediaUrls.push(dataUrl);
    }

    setFormData(prev => ({
      ...prev,
      mediaUrls: [...prev.mediaUrls, ...mediaUrls]
    }));
  };

  const removeMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || 'Отзыв успешно отправлен!');
        setFormData({
          authorName: '',
          authorEmail: '',
          rating: 5,
          title: '',
          content: '',
          mediaUrls: []
        });
        if (onReviewSubmit) {
          onReviewSubmit(result.review);
        }
      } else {
        setMessage(result.error || 'Ошибка при отправке отзыва');
      }
    } catch (error) {
      setMessage('Ошибка при отправке отзыва');
      console.error('Review submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card card-lg max-w-2xl mx-auto animate-fade-in bg-gray-700">
      <h3 className="text-heading text-white mb-8">Оставить отзыв</h3>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Имя и email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="authorName" className="form-label text-white">
              Ваше имя <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="authorName"
              name="authorName"
              value={formData.authorName}
              onChange={handleInputChange}
              required
              className="form-input bg-gray-600 border-gray-500 text-white placeholder-gray-400"
              placeholder="Введите ваше имя"
            />
          </div>
          
          <div>
            <label htmlFor="authorEmail" className="block text-sm font-medium text-white mb-2">
              Email (необязательно)
            </label>
            <input
              type="email"
              id="authorEmail"
              name="authorEmail"
              value={formData.authorEmail}
              onChange={handleInputChange}
              className="w-full border-2 border-gray-500 rounded-lg px-4 py-3 bg-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="your@email.com"
            />
          </div>
        </div>

        {/* Рейтинг */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Ваша оценка <span className="text-red-500">*</span>
          </label>
          <StarRating 
            rating={formData.rating} 
            interactive={true} 
            onRatingChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
            size="lg"
          />
        </div>

        {/* Заголовок */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
            Заголовок (необязательно)
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full border-2 border-gray-500 rounded-lg px-4 py-3 bg-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="Краткое описание вашего опыта"
          />
        </div>

        {/* Текст отзыва */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-white mb-2">
            Ваш отзыв <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full border-2 border-gray-500 rounded-lg px-4 py-3 bg-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors resize-none"
            placeholder="Расскажите о вашем опыте использования наших услуг..."
          />
        </div>

        {/* Загрузка медиа */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Фото или видео (необязательно)
          </label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleMediaUpload}
            className="w-full border-2 border-gray-500 rounded-lg px-4 py-3 bg-gray-600 text-white focus:border-blue-500 focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer"
          />
          <p className="text-xs text-gray-400 mt-1">
            Поддерживаются изображения и видео до 10MB
          </p>
          
          {/* Превью загруженных медиа */}
          {formData.mediaUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {formData.mediaUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="h-24 bg-gray-600 rounded-lg overflow-hidden">
                    {url.includes('data:video') ? (
                      <video src={url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={url} alt={`Медиа ${index + 1}`} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Сообщение */}
        {message && (
          <div className={`p-4 rounded-lg ${message.includes('успешно') || message.includes('Спасибо') ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
            {message}
          </div>
        )}

        {/* Кнопка отправки */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn btn-xl w-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'btn-primary'}`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Отправляем...
            </>
          ) : (
            <>
              Отправить отзыв
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviews?status=approved&limit=100');
      
      if (!response.ok) {
        throw new Error('Failed to load reviews');
      }
      
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleReviewSubmit = (newReview) => {
    // Обновляем список отзывов после добавления нового
    loadReviews();
  };

  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <header className="bg-gray-900 shadow-lg sticky top-0 z-40 border-b border-gray-700">
        <div className="container">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl logo-print-shop text-white">
                <Link href="/" className="hover:text-gray-200 transition-all duration-300">
                  print style
                </Link>
              </h1>
              
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/#main" className="btn btn-ghost btn-sm text-gray-200 hover:text-white">Главная</Link>
              <Link href="/products" className="btn btn-ghost btn-sm text-gray-200 hover:text-white">Товары</Link>
              <Link href="/reviews" className="btn btn-ghost btn-sm text-white font-semibold">Отзывы</Link>
              <Link href="/#about" className="btn btn-ghost btn-sm text-gray-200 hover:text-white">О нас</Link>
              <div className="flex items-center space-x-3">
                <CartDropdown />
                <UserProfile />
              </div>
            </nav>
            
            {/* Mobile Menu */}
            <MobileMenu />
          </div>
        </div>
      </header>
      
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Main Content */}
      <main className="container py-12 lg:py-16 bg-gray-800">
        {/* Page Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-hero text-white mb-6">
            Отзывы наших клиентов
          </h1>
          <p className="text-body text-gray-300 max-w-3xl mx-auto">
            Узнайте, что думают о нас наши клиенты, и поделитесь своим опытом
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Загружаем отзывы...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-gray-300">Ошибка загрузки отзывов: {error}</p>
          </div>
        ) : (
          <>
            {/* Reviews Carousel */}
            {reviews.length > 0 ? (
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-center mb-8 text-white">Отзывы клиентов</h2>
                
                <div className="relative">
                  {/* Navigation buttons */}
                  {reviews.length > 1 && (
                    <>
                      <button 
                        onClick={prevReview}
                        className="absolute left-2 lg:left-0 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-gray-700 shadow-lg rounded-full flex items-center justify-center text-gray-300 hover:text-blue-400 hover:shadow-xl transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <button 
                        onClick={nextReview}
                        className="absolute right-2 lg:right-0 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-gray-700 shadow-lg rounded-full flex items-center justify-center text-gray-300 hover:text-blue-400 hover:shadow-xl transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Review Content */}
                  <div className="px-4 sm:px-4 lg:px-16">
                    <ReviewCard review={reviews[currentReviewIndex]} />
                  </div>

                  {/* Dots Navigation */}
                  {reviews.length > 1 && (
                    <div className="flex justify-center mt-8 space-x-2">
                      {reviews.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentReviewIndex(index)}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentReviewIndex ? 'bg-blue-500' : 'bg-gray-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 mb-16">
                <div className="text-gray-400 text-6xl mb-4">💬</div>
                <h3 className="text-xl font-medium text-white mb-2">Пока нет отзывов</h3>
                <p className="text-gray-300">Станьте первым, кто оставит отзыв о наших услугах!</p>
              </div>
            )}

            {/* Review Form */}
            <div>
              <ReviewForm onReviewSubmit={handleReviewSubmit} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}