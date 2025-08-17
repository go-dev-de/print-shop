'use client';

import { useState, useEffect } from 'react';

export default function DiscountPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [globalDiscounts, setGlobalDiscounts] = useState([]);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await fetch('/api/discounts');
        if (response.ok) {
          const data = await response.json();
          const discounts = data.discounts || [];
          
          // Находим глобальные скидки (без привязки к разделам и товарам)
          const global = discounts.filter(discount => {
            const hasNoCategories = !discount.sectionIds || discount.sectionIds.length === 0;
            const hasNoProducts = !discount.productIds || discount.productIds.length === 0;
            return hasNoCategories && hasNoProducts && discount.percent > 0;
          });
          
          if (global.length > 0) {
            setGlobalDiscounts(global);
            
            // Проверяем, показывали ли уже попап в этой сессии
            const hasShownPopup = sessionStorage.getItem('discountPopupShown');
            if (!hasShownPopup) {
              setTimeout(() => setIsVisible(true), 1000); // Показываем через секунду
            }
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки скидок:', error);
      }
    };

    fetchDiscounts();
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      sessionStorage.setItem('discountPopupShown', 'true');
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isVisible || globalDiscounts.length === 0) return null;

  const bestDiscount = globalDiscounts.reduce((max, discount) => 
    Math.max(max, Number(discount.percent || 0)), 0
  );

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-white rounded-lg p-6 mx-4 max-w-md w-full shadow-2xl transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок с кнопкой закрытия */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🎉</div>
            <h3 className="text-xl font-bold text-gray-900">Акция!</h3>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Содержимое попапа */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg p-4 mb-4">
            <div className="text-3xl font-bold mb-1">СКИДКА {bestDiscount}%</div>
            <div className="text-lg">на все товары!</div>
          </div>
          
          <p className="text-gray-700 mb-4">
            Успейте воспользоваться специальным предложением на все товары в нашем магазине!
          </p>
          
          {globalDiscounts.map((discount, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 mb-3 text-left">
              <div className="font-semibold text-gray-900">{discount.name}</div>
              {discount.description && (
                <div className="text-sm text-gray-600 mt-1">{discount.description}</div>
              )}
            </div>
          ))}
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Отлично!
            </button>
            <button
              onClick={() => window.location.href = '/products'}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors font-medium"
            >
              К товарам
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}