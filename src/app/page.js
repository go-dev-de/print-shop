'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageUploader from '../components/ImageUploader';
import TshirtPreview from '../components/TshirtPreview';
import AuthNav from '@/components/AuthNav';
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
      <section className="mt-16 mb-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Загружаем отзывы...</p>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="mt-16 mb-8">
        <div className="text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Отзывы наших клиентов</h2>
          <p className="text-gray-600 mb-8">Пока нет отзывов, но вы можете стать первым!</p>
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
    <section className="mt-16 mb-8">
      <div className="text-center mb-12">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Отзывы наших клиентов</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Узнайте, что думают о нас наши клиенты, и убедитесь в качестве наших услуг
        </p>
      </div>

      <div className="relative">
        {/* Navigation buttons */}
        {reviews.length > 1 && (
          <>
            <button 
              onClick={prevReview}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:shadow-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button 
              onClick={nextReview}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:shadow-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Review Content */}
        <div className="px-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <StarRating rating={reviews[currentReviewIndex]?.rating || 5} />
              <div className="flex items-center justify-center space-x-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {reviews[currentReviewIndex]?.authorName || 'Анонимный'}
                </h3>
                <span className="text-gray-500">
                  {formatDate(reviews[currentReviewIndex]?.createdAt)}
                </span>
              </div>
            </div>

            {reviews[currentReviewIndex]?.title && (
              <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">
                {reviews[currentReviewIndex].title}
              </h4>
            )}

            <p className="text-gray-700 text-center leading-relaxed text-lg">
              &ldquo;{reviews[currentReviewIndex]?.content || 'Отличный сервис!'}&rdquo;
            </p>

            {/* Media content if available */}
            {reviews[currentReviewIndex]?.mediaUrls && reviews[currentReviewIndex].mediaUrls.length > 0 && (
              <div className="mt-6 flex justify-center">
                <div className="w-48 h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={reviews[currentReviewIndex].mediaUrls[0]} 
                    alt="Отзыв с фото"
                    className="w-full h-full object-cover"
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
                  index === currentReviewIndex ? 'bg-blue-600' : 'bg-gray-300'
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
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('white');
  const [quantity, setQuantity] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50, scale: 1 });

  const [printSize, setPrintSize] = useState(0); // Индекс выбранного размера принта
  const [activeView, setActiveView] = useState('front');
  const [selectedProductPrice, setSelectedProductPrice] = useState(null); // Цена выбранного товара

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = [
    { name: 'white', hex: '#ffffff', label: 'Белый' },
    { name: 'black', hex: '#000000', label: 'Черный' },
    { name: 'light-gray', hex: '#d3d3d3', label: 'Светло-серый' },
    { name: 'gray', hex: '#6b7280', label: 'Серый' },
  ];

  // Размеры принта с ценами
  const printSizes = [
    { label: '10×15 см', width: 10, height: 15, price: 390, scale: 0.6 },
    { label: '15×21 см', width: 15, height: 21, price: 590, scale: 0.8 },
    { label: '21×30 см', width: 21, height: 30, price: 740, scale: 1.0 },
    { label: '30×42 см', width: 30, height: 42, price: 940, scale: 1.3 },
  ];



  const handleImageUpload = (imageData, file) => {
    setUploadedImage(imageData);
  };

  const handleImageRemove = () => {
    setUploadedImage(null);
    setImagePosition({ x: 50, y: 50, scale: 1 });
  };

  const handleImagePositionChange = (position) => {
    setImagePosition(position);
  };

  // Оценка размера dataURL в байтах
  const estimateDataUrlBytes = (dataUrl) => {
    if (!dataUrl || typeof dataUrl !== 'string') return 0;
    const commaIdx = dataUrl.indexOf(',');
    const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
    // 4 символа base64 ~ 3 байта
    return Math.floor((base64.length * 3) / 4);
  };

  // Сжатие изображения в JPEG с ограничением по максимальной стороне
  const compressDataUrlToJpeg = async (dataUrl, maxDim = 3000, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const scale = Math.min(1, maxDim / Math.max(w, h));
        const targetW = Math.max(1, Math.round(w * scale));
        const targetH = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetW, targetH);
        try {
          const jpeg = canvas.toDataURL('image/jpeg', quality);
          resolve(jpeg);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  const [discountPercent, setDiscountPercent] = useState(0);
  const [activeDiscounts, setActiveDiscounts] = useState([]);
  
  useEffect(() => {
    // Загрузка активных скидок
    const fetchDiscounts = async () => {
      try {
        const response = await fetch('/api/discounts');
        if (response.ok) {
          const data = await response.json();
          const discounts = data.discounts || [];
          setActiveDiscounts(discounts);
          
          // Вычисляем лучшую глобальную скидку для основного калькулятора
          const globalDiscounts = discounts.filter(discount => {
            const hasNoCategories = !discount.sectionIds || discount.sectionIds.length === 0;
            const hasNoProducts = !discount.productIds || discount.productIds.length === 0;
            return hasNoCategories && hasNoProducts;
          });
          
          const bestGlobal = globalDiscounts.reduce((max, discount) => 
            Math.max(max, Number(discount.percent || 0)), 0
          );
          setDiscountPercent(bestGlobal);
        }
      } catch (error) {
        console.error('Ошибка загрузки скидок:', error);
      }
    };
    
    fetchDiscounts();
  }, []);

  // Обработка выбранного товара из страницы товаров
  useEffect(() => {
    const selectedProduct = localStorage.getItem('selectedProduct');
    if (selectedProduct) {
      try {
        const productData = JSON.parse(selectedProduct);
        // Устанавливаем параметры товара
        if (productData.size) setSelectedSize(productData.size);
        if (productData.color) setSelectedColor(productData.color);
        if (productData.quantity) setQuantity(productData.quantity);
        
        // Устанавливаем цену товара (если есть)
        if (productData.basePrice) {
          setSelectedProductPrice({
            basePrice: productData.basePrice,
            originalPrice: productData.originalPrice,
            hasDiscount: productData.hasDiscount,
            discountPercent: productData.discountPercent
          });
        }
        
        // Очищаем localStorage после использования
        localStorage.removeItem('selectedProduct');
        
        // Прокручиваем к форме заказа
        setTimeout(() => {
          const orderSection = document.getElementById('order-form');
          if (orderSection) {
            orderSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } catch (error) {
        console.error('Error parsing selected product:', error);
      }
    }
  }, []);

  const calculatePrice = () => {
    // Используем цену выбранного товара, если есть, иначе базовую цену футболки
    const basePrice = selectedProductPrice ? selectedProductPrice.basePrice : 1500;
    const printPrice = uploadedImage ? printSizes[printSize].price : 0;
    const subtotal = (basePrice + printPrice) * quantity;
    
    // Если у выбранного товара уже есть скидка, не применяем дополнительную
    if (selectedProductPrice && selectedProductPrice.hasDiscount) {
      return subtotal;
    }
    
    // Применяем глобальную скидку только если нет скидки на товар
    if (!discountPercent) return subtotal;
    const discount = Math.round((subtotal * discountPercent) / 100);
    return Math.max(0, subtotal - discount);
  };

  const handleOrder = async () => {
    if (!uploadedImage) {
      alert('Пожалуйста, загрузите изображение для принта');
      return;
    }
    
    // Пытаемся сделать скриншот превью с принтом
    let previewImageDataUrl = null;
    try {
      const { toJpeg } = await import('html-to-image');
      const previewElement = document.querySelector('.tshirt-preview-root');
      if (previewElement) {
        // JPEG меньше весит, что повышает шанс успешной отправки в Telegram
        previewImageDataUrl = await toJpeg(previewElement, { cacheBust: true, pixelRatio: 1.5, quality: 0.85 });
      }
    } catch (e) {
      console.warn('Не удалось создать изображение превью:', e);
    }
    
    // Сжимать исходник, если он слишком большой для передачи на бэкенд
    const MAX_REQUEST_BYTES = 4.5 * 1024 * 1024; // приблизительный лимит на полезную нагрузку
    let imageForOrder = uploadedImage;
    try {
      if (estimateDataUrlBytes(imageForOrder) > MAX_REQUEST_BYTES) {
        imageForOrder = await compressDataUrlToJpeg(imageForOrder, 3000, 0.85);
      }
    } catch (e) {
      console.warn('Не удалось сжать изображение перед отправкой:', e);
    }

    const orderData = {
      image: imageForOrder,
      imagePosition: imagePosition,
      imageSide: activeView,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
      // Сохраняем выбор размера принта и цену за единицу для страницы заказа
      printSizeIndex: printSize,
      printSizeLabel: uploadedImage ? printSizes[printSize].label : null,
      printPricePerUnit: uploadedImage ? printSizes[printSize].price : 0,
      previewImage: previewImageDataUrl,
      discountPercent,
      totalPrice: calculatePrice(),
    };
    
    // Сохраняем данные заказа в localStorage
    localStorage.setItem('printShopOrder', JSON.stringify(orderData));
    
    // Перенаправляем на страницу оформления заказа
    window.location.href = '/order';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-x-hidden w-full main-container" style={{ touchAction: 'pan-y' }}>
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg shadow-lg sticky top-0 z-40 border-b border-gray-200">
        <div className="container">
          <div className="flex justify-between items-center py-4 lg:py-6">
            <div className="flex items-center space-x-8">
              <h1 className="text-heading text-gray-900">
                <Link href="/" className="hover:text-blue-600 transition-all duration-300 transform hover:scale-105">
                  Print<span className="text-blue-600">Style</span>
                </Link>
              </h1>
              
              <div className="hidden lg:block"><AuthNav /></div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#main" className="btn btn-ghost btn-sm text-blue-600 font-semibold">Главная</a>
              <a href="/products" className="btn btn-ghost btn-sm">Товары</a>
              <a href="/reviews" className="btn btn-ghost btn-sm">Отзывы</a>
              <a href="#about" className="btn btn-ghost btn-sm">О нас</a>
              <CartDropdown />
            </nav>
            
            {/* Mobile Menu */}
            <MobileMenu />
          </div>
        </div>
      </header>
      
      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white min-h-[90vh] flex items-center">
        {/* Subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Анимированные фоновые blob'ы */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-subtle"></div>
          <div className="absolute top-32 right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-subtle" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-20 left-32 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse-subtle" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative container py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-display mb-8 animate-fade-in">
              <span className="block">Создай свой</span>
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent animate-pulse-subtle">
                УНИКАЛЬНЫЙ
              </span>
              <span className="block">стиль</span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-xl md:text-2xl text-blue-100 mb-12 text-body animate-fade-in" style={{animationDelay: '0.2s'}}>
              Преврати свои идеи в реальность! Профессиональная печать на футболках с гарантией качества и быстрой доставкой.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <a href="#order-form" className="btn btn-xl group relative bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-bold hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300">
                <span className="relative z-10">Начать создание</span>
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-lg blur opacity-0 group-hover:opacity-50 transition-opacity"></div>
              </a>
              
              <a href="/products" className="btn btn-xl bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/20 transition-all duration-300">
                Каталог товаров
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </a>
            </div>
            

          </div>
        </div>
        
        {/* Enhanced Decorative wave - Rotated for smooth transition */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-20 text-white" preserveAspectRatio="none" viewBox="0 0 1200 120" fill="currentColor" style={{ transform: 'rotate(180deg)' }}>
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="currentColor"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="currentColor"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="currentColor"></path>
          </svg>
        </div>
      </section>

      <main className="relative bg-gradient-to-b from-white via-blue-50/30 to-indigo-100/50">
        <div className="container py-12 lg:py-20 scroll-smooth">
        <div id="order-form" className="text-center mb-12 animate-fade-in">
          <h2 className="text-heading text-gray-900 mb-4">
            Создайте свою уникальную футболку
          </h2>
          <p className="text-body text-gray-600 max-w-2xl mx-auto">
            Загрузите свой дизайн и получите качественную футболку с принтом
          </p>
        </div>

        {/* Мобильная версия - одна колонка */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
          {/* 1. Загрузка принта */}
          <div className="card card-md">
            <h3 className="text-subheading text-gray-900 mb-4">Загрузите ваш принт</h3>
            <ImageUploader 
              onImageUpload={handleImageUpload}
              onImageRemove={handleImageRemove}
            />
          </div>

          {/* 2. Выбор цвета */}
          <div className="bg-white rounded-lg shadow-lg p-2 sm:p-5">
            <h3 className="text-lg font-semibold mb-3 text-black">Выберите цвет футболки</h3>
            <div className="grid grid-cols-2 gap-4">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.name)}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors text-black ${
                    selectedColor === color.name
                      ? 'border-black bg-gray-100'
                      : 'border-gray-400 hover:border-black'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: color.hex }}
                  ></div>
                  <span className="font-medium">{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Выбор размера */}
          <div className="bg-white rounded-lg shadow-lg p-2 sm:p-5">
            <h3 className="text-lg font-semibold mb-3 text-black">Выберите размер</h3>
            <div className="grid grid-cols-3 gap-3">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors text-black ${
                    selectedSize === size
                      ? 'border-black bg-gray-100'
                      : 'border-gray-400 hover:border-black'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Размер принта */}
          {uploadedImage && (
            <div className="bg-white rounded-lg shadow-lg p-2 sm:p-5">
              <h3 className="text-lg font-semibold mb-3 text-black">Размер принта</h3>
              <div className="grid grid-cols-2 gap-3">
                {printSizes.map((size, index) => (
                  <button
                    key={index}
                    onClick={() => setPrintSize(index)}
                    className={`p-3 rounded-lg border-2 transition-colors text-black ${
                      printSize === index
                        ? 'border-black bg-gray-100'
                        : 'border-gray-400 hover:border-black'
                    }`}
                  >
                    <div className="text-sm font-medium">{size.label}</div>
                    <div className="text-xs text-gray-600">+{size.price}₽</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 5. Превью */}
          <TshirtPreview
            uploadedImage={uploadedImage}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            printSize={printSizes[printSize]}
            onImagePositionChange={handleImagePositionChange}
            onViewChange={setActiveView}
          />

          {/* 6. Информация о заказе */}
          <div className="bg-white rounded-lg shadow-lg p-2 sm:p-5">
            <h3 className="text-lg font-semibold mb-3 text-black">Информация о заказе</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-black">Размер:</span>
                <span className="font-medium text-black">{selectedSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Цвет:</span>
                <span className="font-medium text-black">
                  {colors.find(c => c.name === selectedColor)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Количество:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center border-2 border-gray-400 hover:border-black text-black font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="font-medium text-black w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center border-2 border-gray-400 hover:border-black text-black font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Принт:</span>
                <span className="font-medium text-black">
                  {uploadedImage ? 'Включен' : 'Не выбран'}
                </span>
              </div>
              {uploadedImage && (
                <div className="flex justify-between">
                  <span className="text-black">Размер принта:</span>
                  <span className="font-medium text-black">{printSizes[printSize].label}</span>
                </div>
              )}
              {uploadedImage && (
                <div className="flex justify-between">
                  <span className="text-black">Масштаб принта:</span>
                  <span className="font-medium text-black">{Math.round(imagePosition.scale * 100)}%</span>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold text-black">
                <span>Итого:</span>
                <span>{calculatePrice()} ₽</span>
              </div>
            </div>
          </div>

          {/* Кнопка заказа */}
          <button
            type="button"
            onClick={handleOrder}
            onTouchEnd={handleOrder}
            onPointerUp={handleOrder}
            aria-disabled={!uploadedImage}
            className={`group relative z-50 pointer-events-auto w-full py-4 px-6 rounded-xl text-lg font-bold transition-all duration-300 transform ${
              uploadedImage
                ? 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <span className="relative z-10 flex items-center justify-center">
              <svg className="w-6 h-6 mr-2 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Оформить заказ
              <svg className={`w-5 h-5 ml-2 transition-transform duration-300 ${uploadedImage ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            {uploadedImage && (
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            )}
          </button>
        </div>

        {/* Десктопная версия - две колонки */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-12">
          {/* Левая колонка - Загрузка и настройки */}
          <div className="space-y-8">
            {/* Загрузка изображения */}
            <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
                             <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">Загрузите ваш принт</h3>
              <ImageUploader 
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
              />
            </div>

            {/* Выбор размера */}
                         <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
                              <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">Выберите размер</h3>
              <div className="grid grid-cols-3 gap-3">
                {sizes.map((size) => (
                                     <button
                     key={size}
                     onClick={() => setSelectedSize(size)}
                     className={`py-3 px-4 rounded-lg border-2 font-medium transition-colors text-black ${
                       selectedSize === size
                         ? 'border-black bg-gray-100'
                         : 'border-gray-400 hover:border-black'
                     }`}
                   >
                     {size}
                   </button>
                ))}
              </div>
            </div>

            {/* Выбор цвета */}
                         <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
                              <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">Выберите цвет футболки</h3>
              <div className="grid grid-cols-2 gap-4">
                {colors.map((color) => (
                                     <button
                     key={color.name}
                     onClick={() => setSelectedColor(color.name)}
                     className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors text-black ${
                       selectedColor === color.name
                         ? 'border-black bg-gray-100'
                         : 'border-gray-400 hover:border-black'
                     }`}
                   >
                     <div
                       className="w-8 h-8 rounded-full border-2 border-gray-300"
                       style={{ backgroundColor: color.hex }}
                     ></div>
                     <span className="font-medium">{color.label}</span>
                   </button>
                ))}
              </div>
            </div>

            {/* Размер принта */}
            {uploadedImage && (
              <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">Размер принта</h3>
                <div className="grid grid-cols-2 gap-3">
                  {printSizes.map((size, index) => (
                    <button
                      key={index}
                      onClick={() => setPrintSize(index)}
                      className={`p-3 rounded-lg border-2 transition-colors text-black ${
                        printSize === index
                          ? 'border-black bg-gray-100'
                          : 'border-gray-400 hover:border-black'
                      }`}
                    >
                      <div className="text-sm font-medium">{size.label}</div>
                      <div className="text-xs text-gray-600">+{size.price}₽</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Количество */}
                         <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
                              <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">Количество</h3>
              <div className="flex items-center space-x-4">
                                 <button
                   onClick={() => setQuantity(Math.max(1, quantity - 1))}
                   className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center border-2 border-gray-400 hover:border-black text-black font-bold"
                 >
                   -
                 </button>
                 <span className="text-xl font-semibold w-12 text-center text-black">{quantity}</span>
                 <button
                   onClick={() => setQuantity(quantity + 1)}
                   className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center border-2 border-gray-400 hover:border-black text-black font-bold"
                 >
                   +
                 </button>
              </div>
            </div>
          </div>

          {/* Правая колонка - Превью и заказ */}
          <div className="space-y-8">
            {/* Превью футболки */}
          <TshirtPreview
              uploadedImage={uploadedImage}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              printSize={printSizes[printSize]}
              onImagePositionChange={handleImagePositionChange}
              onViewChange={setActiveView}
            />

            {/* Информация о заказе */}
            <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
                             <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 text-black">Информация о заказе</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-black">Размер:</span>
                  <span className="font-medium text-black">{selectedSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Цвет:</span>
                  <span className="font-medium text-black">
                    {colors.find(c => c.name === selectedColor)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Количество:</span>
                  <span className="font-medium text-black">{quantity} шт.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black">Принт:</span>
                  <span className="font-medium text-black">
                    {uploadedImage ? 'Включен' : 'Не выбран'}
                  </span>
                </div>
                {uploadedImage && (
                  <div className="flex justify-between">
                    <span className="text-black">Масштаб принта:</span>
                    <span className="font-medium text-black">{Math.round(imagePosition.scale * 100)}%</span>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                                 <div className="flex justify-between text-xl font-bold text-black">
                   <span>Итого:</span>
                   <span>{calculatePrice()} ₽</span>
                 </div>
              </div>
            </div>

            {/* Кнопка заказа */}
            <button
              type="button"
              onClick={handleOrder}
              onTouchEnd={handleOrder}
              onPointerUp={handleOrder}
              aria-disabled={!uploadedImage}
              className={`group relative z-50 pointer-events-auto w-full py-4 lg:py-5 px-6 lg:px-8 rounded-xl text-lg lg:text-xl font-bold transition-all duration-300 transform ${
                uploadedImage
                  ? 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <span className="relative z-10 flex items-center justify-center">
                <svg className="w-6 h-6 mr-3 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Оформить заказ
                <svg className={`w-6 h-6 ml-3 transition-transform duration-300 ${uploadedImage ? 'group-hover:translate-x-1' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              {uploadedImage && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              )}
            </button>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
                         <h3 className="text-lg font-semibold mb-2 text-black">Быстрое производство</h3>
            <p className="text-gray-800">Изготовление за 3-5 рабочих дней</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
                         <h3 className="text-lg font-semibold mb-2 text-black">Качественные материалы</h3>
            <p className="text-gray-800">100% хлопок, стойкие принты</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
                         <h3 className="text-lg font-semibold mb-2 text-black">Поддержка 24/7</h3>
            <p className="text-gray-800">Поможем с любыми вопросами</p>
          </div>
        </div>

        {/* Секция отзывов */}
        <ReviewsCarousel />

        {/* Call to Action секция */}
        <section className="mt-16 mb-8 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">
              Готовы создать свою уникальную футболку?
            </h3>
            <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
              Присоединяйтесь к тысячам довольных клиентов! Посмотрите отзывы и поделитесь своим опытом.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="#order-form" 
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Создать дизайн
              </a>
              <a 
                href="/reviews" 
                className="inline-flex items-center px-6 py-3 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Посмотреть отзывы
              </a>
            </div>
          </div>
        </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-sm mx-auto px-4 sm:max-w-7xl sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 !text-white">PrintStyle</h3>
              <p className="text-gray-300">
                Создавайте уникальные футболки <br/>
            с вашими дизайнами
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 !text-white">Услуги</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Футболки с принтом</a></li>
                <li><a href="#" className="hover:text-white">Худи с принтом</a></li>
                <li><a href="#" className="hover:text-white">Кепки с принтом</a></li>
                <li><a href="#" className="hover:text-white">Оптовые заказы</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 !text-white">Информация</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">О компании</a></li>
                <li><a href="#" className="hover:text-white">Доставка</a></li>
                <li><a href="#" className="hover:text-white">Оплата</a></li>
                <li><a href="#" className="hover:text-white">Контакты</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 !text-white">Контакты</h4>
              <div className="space-y-2 text-gray-300">
                <p>+7 (999) 123-45-67</p>
                <p>зайчикГэнг@yandex.ru</p>
                <p>Ижевск, ул. Примерная, 123</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 PrintStyle. Все права защищены.</p>
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