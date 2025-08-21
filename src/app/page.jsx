'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UserProfile from '@/components/UserProfile';
import DiscountPopup from '@/components/DiscountPopup';
import Breadcrumbs from '@/components/Breadcrumbs';
import MobileMenu from '@/components/MobileMenu';
import CartDropdown from '@/components/CartDropdown';
import CartNotification from '@/components/CartNotification';


// Компонент карусели отзывов для главной страницы
function ReviewsCarousel() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const response = await fetch('/api/reviews?status=approved&limit=6');
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      month: 'long',
      day: 'numeric'
    });
  };

  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Загружаем отзывы...</p>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="py-16">
        <div className="text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">Отзывы наших клиентов</h2>
          <p className="text-gray-300 mb-8">Пока нет отзывов, но вы можете стать первым!</p>
          <a 
            href="/reviews" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Оставить отзыв
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">Отзывы наших клиентов</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Узнайте, что думают о нас наши клиенты, и убедитесь в качестве наших услуг
        </p>
      </div>

      <div className="relative">
        {/* Navigation buttons */}
        {reviews.length > 1 && (
          <>
            <button 
              onClick={prevReview}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-gray-700 shadow-lg rounded-full flex items-center justify-center text-gray-300 hover:text-blue-400 hover:shadow-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button 
              onClick={nextReview}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-gray-700 shadow-lg rounded-full flex items-center justify-center text-gray-300 hover:text-blue-400 hover:shadow-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Review Content */}
        <div className="px-12">
          <div className="bg-gray-700 rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <StarRating rating={reviews[currentReviewIndex]?.rating || 5} />
              <div className="flex items-center justify-center space-x-4 mt-4">
                <h3 className="text-lg font-semibold text-white">
                  {reviews[currentReviewIndex]?.authorName || 'Анонимный'}
                </h3>
                <span className="text-gray-400">
                  {formatDate(reviews[currentReviewIndex]?.createdAt)}
                </span>
              </div>
            </div>

            {reviews[currentReviewIndex]?.title && (
              <h4 className="text-xl font-bold text-white mb-4 text-center">
                {reviews[currentReviewIndex].title}
              </h4>
            )}

            <p className="text-gray-300 text-center leading-relaxed text-lg">
              &ldquo;{reviews[currentReviewIndex]?.content || 'Отличный сервис!'}&rdquo;
            </p>

            {/* Media content if available */}
            {reviews[currentReviewIndex]?.mediaUrls && reviews[currentReviewIndex].mediaUrls.length > 0 && (
              <div className="mt-6 flex justify-center">
                <div className="w-48 h-32 bg-gray-600 rounded-lg overflow-hidden">
                  <Image 
                    src={reviews[currentReviewIndex].mediaUrls[0]} 
                    alt="Отзыв с фото"
                    className="w-full h-full object-cover"
                    width={192}
                    height={128}
                  />
                </div>
              </div>
            )}
          </div>
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

      {/* Link to all reviews */}
      <div className="text-center mt-8">
        <a 
          href="/reviews" 
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Все отзывы
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </section>
  );
}

export default function Home() {
  // Проверяем URL параметр для выхода
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
      console.log('🚪 Logout via URL parameter');
      
      // Очищаем все storage включая корзину
      localStorage.clear();
      sessionStorage.clear();
      
      // Дополнительно очищаем корзину для уверенности
      localStorage.removeItem('printshop_cart');
      
      // Уведомляем компоненты об очистке корзины
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Агрессивно очищаем ВСЕ куки и данные браузера
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Очищаем кэш браузера если возможно
      try {
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
      } catch (e) {
        console.log('Cache clear failed:', e);
      }
      
      // Очищаем IndexedDB если есть
      try {
        if ('indexedDB' in window) {
          indexedDB.deleteDatabase('printshop');
        }
      } catch (e) {
        console.log('IndexedDB clear failed:', e);
      }
      
      // Вызываем API logout без перезагрузки
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        .then(() => {
          console.log('✅ Logout API called');
          
          // Устанавливаем флаг что пользователь вышел
          sessionStorage.setItem('user_logged_out', 'true');
          
          // Просто убираем параметр из URL без перезагрузки
          window.history.replaceState({}, document.title, '/');
          
          // Форсируем обновление компонентов
          window.dispatchEvent(new Event('user-logged-out'));
        })
        .catch(e => {
          console.error('❌ Logout API error:', e);
          // Все равно убираем параметр
          window.history.replaceState({}, document.title, '/');
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden w-full main-container" style={{ touchAction: 'pan-y' }}>
      {/* Premium Header */}
      <header className="border-b border-gray-700 sticky top-0 z-50 transition-all duration-300" style={{backgroundColor: '#424242'}}>
        <div className="container">
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl logo-print-shop h-full flex items-center">
                <Link href="/" className="text-white hover:text-gray-200 transition-colors duration-200 h-full flex items-center">
                  <div className="hidden md:block">
                    <Image 
                      src="/print-style-logo.png" 
                      alt="Print Style Logo" 
                      width={120} 
                      height={40}
                      className="h-full w-auto"
                    />
                  </div>
                  <div className="md:hidden">
                    <Image 
                      src="/print-style-logo.png" 
                      alt="Print Style Logo" 
                      width={120} 
                      height={40}
                      className="h-full w-auto"
                    />
                  </div>
                </Link>
              </h1>
              
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="#main" className="px-4 py-2 text-sm font-medium text-gray-100 hover:text-white transition-colors rounded-lg">
                Главная
              </Link>
              <Link href="/products" className="px-4 py-2 text-sm font-medium text-gray-100 hover:text-white hover:bg-gray-600 transition-all rounded-lg">
                Товары
              </Link>
              <Link href="/reviews" className="px-4 py-2 text-sm font-medium text-gray-100 hover:text-white hover:bg-gray-600 transition-all rounded-lg">
                Отзывы
              </Link>
              <Link href="#about" className="px-4 py-2 text-sm font-medium text-gray-100 hover:text-white hover:bg-gray-600 transition-all rounded-lg">
                О нас
              </Link>
              <div className="flex items-center space-x-3 ml-4">
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

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        {/* Floating geometric elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Основные фигуры с плавным перемещением по секции и мерцанием */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-white/80 rounded-xl rotate-12 animate-float-across-1"></div>
          <div className="absolute top-1/3 right-1/4 w-24 h-24 border-2 border-white/70 rounded-full animate-float-across-2"></div>
          <div className="absolute bottom-1/3 left-1/3 w-20 h-20 border-2 border-white/70 rotate-45 animate-float-across-3"></div>

          {/* Дополнительные фигуры для богатства */}
          <div className="absolute top-1/2 left-10 w-16 h-16 border-2 border-white/60 rounded-lg rotate-45 animate-float-across-2"></div>
          <div className="absolute top-2/3 right-10 w-12 h-12 border-2 border-white/60 rounded-full animate-float-across-3"></div>
          <div className="absolute bottom-1/4 right-1/3 w-28 h-28 border-2 border-white/50 rounded-xl rotate-12 animate-float-across-4"></div>
        </div>
        
        <div className="relative container text-center">
          <div className="max-w-4xl mx-auto">

            
            {/* Main Heading */}
            <h1 className="text-4xl lg:text-6xl font-light text-white mb-8 animate-fade-in leading-tight" style={{animationDelay: '0.1s'}}>
              Носи эмоции.<br/>
              создавай стиль.<br/>
              <span className="font-medium">твоя уникальность уже здесь</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-300 font-light leading-relaxed mb-12 max-w-3xl mx-auto animate-fade-in" style={{animationDelay: '0.2s'}}>
              Профессиональная печать на премиальных материалах.<br/>
              Воплотите свои идеи с исключительным качеством.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 animate-fade-in" style={{animationDelay: '0.3s'}}>
              <Link href="/designer" className="group inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                <span>Начать создание</span>
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              
              <Link href="/products" className="group inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-gray-700 border border-gray-600 text-gray-200 font-medium rounded-lg hover:bg-gray-600 hover:border-gray-500 transition-all duration-300">
                <span>Посмотреть каталог</span>
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </Link>
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <div className="text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white mb-2">Быстрое производство</h3>
                <p className="text-gray-300 text-sm">Изготовление за 2-3 дня</p>
              </div>
              
              <div className="text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white mb-2">Премиум качество</h3>
                <p className="text-gray-300 text-sm">100% хлопок, стойкие краски</p>
              </div>
              
              <div className="text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white mb-2">Индивидуальный подход</h3>
                <p className="text-gray-300 text-sm">Персональная консультация</p>
              </div>
            </div>
          </div>
        </div>
        

      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-sm mx-auto px-4 sm:max-w-7xl sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg logo-print-shop mb-4 text-white">
                
              </h3>
              <p className="text-gray-300">
                Создавайте уникальные футболки <br/>
            с вашими дизайнами
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Услуги</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Футболки с принтом</a></li>
                <li><a href="#" className="hover:text-white">Худи с принтом</a></li>
                <li><a href="#" className="hover:text-white">Кепки с принтом</a></li>
                <li><a href="#" className="hover:text-white">Оптовые заказы</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Информация</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">О компании</a></li>
                <li><a href="#" className="hover:text-white">Доставка</a></li>
                <li><a href="#" className="hover:text-white">Оплата</a></li>
                <li><a href="#" className="hover:text-white">Контакты</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Контакты</h4>
              <div className="space-y-2 text-gray-300">
                <p>+7 (999) 123-45-67</p>
                <p>зайчикГэнг@yandex.ru</p>
                <p>Ижевск, ул. Примерная, 123</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 print style. Все права защищены.</p>
          </div>
        </div>
      </footer>
      
      {/* Попап с уведомлениями о скидках */}
      <DiscountPopup />
      
      {/* Уведомления о добавлении в корзину */}
      <CartNotification />
      
    </div>
  );
}