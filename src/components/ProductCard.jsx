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
    <div className="card card-md group overflow-hidden animate-fade-in hover:scale-105 transition-all duration-300 flex flex-col h-full">
      {/* Изображения товара */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden rounded-t-xl flex-shrink-0">
        {allImages.length > 0 ? (
          <>
            <img 
              src={allImages[currentImageIndex]} 
              alt={`${name} - изображение ${currentImageIndex + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            
            {/* Навигация по изображениям */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
                >
                  ‹
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
                >
                  ›
                </button>
                
                {/* Индикаторы изображений */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex 
                          ? 'bg-white' 
                          : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Счетчик изображений */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {currentImageIndex + 1}/{allImages.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-2">👕</div>
            <div className="text-gray-600 text-sm font-medium">{name}</div>
          </div>
        )}
      </div>
      
      {/* Информация о товаре */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-subheading text-gray-900 line-clamp-2">{name}</h3>
          <div className="ml-3 text-right">
            {hasDiscount ? (
              <div>
                <div className="text-xl font-bold text-blue-600">{finalPrice} ₽</div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500 line-through">{basePrice} ₽</span>
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-semibold">-{discountPercent}%</span>
                </div>
              </div>
            ) : loading ? (
              <div className="text-xl font-bold text-gray-400 animate-pulse">...</div>
            ) : (
              <span className="text-xl font-bold text-blue-600">{finalPrice} ₽</span>
            )}
          </div>
        </div>
        
        {section && (
          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-caption rounded-full mb-3 font-medium">
            {section.name}
          </div>
        )}
        
        {/* Описание - растягивается на доступное пространство */}
        <div className="flex-grow">
          {description && (
            <p className="text-body text-gray-600 mb-4 line-clamp-3">{description}</p>
          )}
        </div>
        
        {/* Выбор размера */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Размер:</span>
            <span className="text-sm font-bold text-gray-900">{selectedSize}</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                  selectedSize === size
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        
        {/* Кнопка - всегда внизу карточки */}
        <div className="mt-auto">
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
            className="btn btn-primary btn-compact w-full group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center">
              <svg className="w-4 h-4 mr-1 group-active:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13M7 13l-2.293 2.293A1 1 0 004 17h16M9 19a2 2 0 100 4 2 2 0 000-4zM20 19a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              В корзину
            </span>
            {/* Градиентная волна при наведении */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            {/* Анимационная волна при нажатии */}
            <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-20 group-active:animate-ping rounded-lg"></div>
          </button>
        </div>
      </div>
    </div>
  );
}