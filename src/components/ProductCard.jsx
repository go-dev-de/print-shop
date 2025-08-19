'use client';

import { useState, useEffect } from 'react';
import { useCart } from './CartDropdown';

export default function ProductCard({ product }) {
  const { name, basePrice, description, section, image, images } = product;
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  
  // Объединяем все изображения (для обратной совместимости)
  const allImages = images && images.length > 0 ? images : (image ? [image] : []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M'); // Размер по умолчанию
  
  // Доступные размеры
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Загрузка активных скидок
  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await fetch('/api/discounts');
        if (response.ok) {
          const data = await response.json();
          setDiscounts(data.discounts || []);
        }
      } catch (error) {
        console.error('Ошибка загрузки скидок:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  // Вычисление цены с учетом скидок
  const calculateFinalPrice = () => {
    if (!discounts.length) return { finalPrice: basePrice, hasDiscount: false, discountPercent: 0 };

    // Находим лучшую скидку для этого товара
    let bestDiscount = 0;
    
    for (const discount of discounts) {
      const discountPercent = Number(discount.percent || 0);
      if (discountPercent <= 0) continue;

      // Глобальная скидка (без категорий и товаров)
      const hasNoCategories = !discount.sectionIds || discount.sectionIds.length === 0;
      const hasNoProducts = !discount.productIds || discount.productIds.length === 0;
      
      if (hasNoCategories && hasNoProducts) {
        bestDiscount = Math.max(bestDiscount, discountPercent);
      }
      // Скидка на раздел
      else if (discount.sectionIds && discount.sectionIds.includes(product.sectionId)) {
        bestDiscount = Math.max(bestDiscount, discountPercent);
      }
      // Скидка на конкретный товар
      else if (discount.productIds && discount.productIds.includes(product.id)) {
        bestDiscount = Math.max(bestDiscount, discountPercent);
      }
    }

    if (bestDiscount > 0) {
      const discountAmount = Math.round((basePrice * bestDiscount) / 100);
      const finalPrice = Math.max(0, basePrice - discountAmount);
      return { finalPrice, hasDiscount: true, discountPercent: bestDiscount };
    }

    return { finalPrice: basePrice, hasDiscount: false, discountPercent: 0 };
  };

  const { finalPrice, hasDiscount, discountPercent } = calculateFinalPrice();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };



  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-xl hover:border-gray-200 hover:-translate-y-2 flex flex-col h-full animate-fade-in">
      {/* Изображения товара */}
      <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {allImages.length > 0 ? (
          <>
            <img 
              src={allImages[currentImageIndex]} 
              alt={`${name} - изображение ${currentImageIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Навигация по изображениям */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full flex items-center justify-center hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Индикаторы изображений */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex 
                          ? 'bg-white scale-125' 
                          : 'bg-white/60 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Счетчик изображений */}
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur text-white text-xs px-2.5 py-1 rounded-full font-medium">
                  {currentImageIndex + 1}/{allImages.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-5xl mb-3 opacity-40">👕</div>
              <div className="text-gray-500 text-sm font-medium">{name}</div>
            </div>
          </div>
        )}
        
        {/* Бейдж скидки */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-lg">
            -{discountPercent}%
          </div>
        )}
      </div>
      
      {/* Информация о товаре */}
      <div className="p-6 flex flex-col flex-grow">
        {/* Заголовок и цена */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-snug">{name}</h3>
          
          <div className="flex items-center gap-3">
            {hasDiscount ? (
              <>
                <span className="text-2xl font-bold text-gray-900">{finalPrice} ₽</span>
                <span className="text-lg text-gray-400 line-through">{basePrice} ₽</span>
              </>
            ) : loading ? (
              <div className="text-2xl font-bold text-gray-400 animate-pulse">...</div>
            ) : (
              <span className="text-2xl font-bold text-gray-900">{finalPrice} ₽</span>
            )}
          </div>
        </div>
        
        {/* Категория */}
        {section && (
          <div className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-full mb-4 w-fit">
            {section.name}
          </div>
        )}
        
        {/* Описание */}
        <div className="flex-grow mb-6">
          {description && (
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{description}</p>
          )}
        </div>
        
        {/* Выбор размера */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Размер</span>
            <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-full">{selectedSize}</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                  selectedSize === size
                    ? 'bg-black text-white shadow-md scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        
        {/* Кнопка добавления в корзину */}
        <button 
          onClick={() => addToCart({
            id: product.id || Date.now(),
            name: name,
            price: finalPrice,
            image: allImages[0],
            size: selectedSize,
            color: 'белый',
            quantity: 1
          })}
          className="w-full bg-black text-white font-medium py-3.5 rounded-xl hover:bg-gray-800 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center">
            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13M7 13l-2.293 2.293A1 1 0 004 17h16M9 19a2 2 0 100 4 2 2 0 000-4zM20 19a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            Добавить в корзину
          </span>
          
          {/* Эффект при наведении */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
        </button>
      </div>
    </div>
  );
}