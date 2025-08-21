'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function CartDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Загрузка корзины из localStorage при монтировании
  useEffect(() => {
    loadCart();
    
    // Слушаем изменения в localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'printshop_cart') {
        loadCart();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Слушаем кастомное событие обновления корзины
    const handleCartUpdate = () => {
      loadCart();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadCart = async () => {
    try {
      // Сначала пытаемся загрузить из API (для авторизованных пользователей)
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          if (data.cart && Array.isArray(data.cart.items)) {
            console.log('Загружаем корзину из YDB:', data.cart.items);
            setCartItems(data.cart.items);
            // Синхронизируем с localStorage
            localStorage.setItem('printStyle_cart', JSON.stringify(data.cart.items));
            return;
          }
        }
      } catch (apiError) {
        console.warn('API корзины недоступен, используем localStorage:', apiError);
      }

      // Fallback к localStorage для неавторизованных пользователей
      const savedCart = localStorage.getItem('printshop_cart');
      console.log('Загружаем корзину из localStorage:', savedCart);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log('Распарсенная корзина:', parsedCart);
        setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
      setCartItems([]);
    }
  };

  const saveCart = async (items) => {
    try {
      // Сохраняем в localStorage сразу для быстрого отклика UI
      localStorage.setItem('printshop_cart', JSON.stringify(items));
      setCartItems(items);
      
      // Уведомляем об обновлении корзины
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      // Пытаемся синхронизировать с API (для авторизованных пользователей)
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items }),
        });
        
        if (response.ok) {
          console.log('Корзина синхронизирована с YDB');
        } else {
          console.warn('Не удалось синхронизировать корзину с YDB:', response.status);
        }
      } catch (apiError) {
        console.warn('API недоступен, корзина сохранена только в localStorage:', apiError);
      }
    } catch (error) {
      console.error('Ошибка сохранения корзины:', error);
    }
  };

  const addToCart = (product) => {
    console.log('Добавляем товар в корзину:', product);
    const existingItem = cartItems.find(item => 
      item.id === product.id && 
      item.size === product.size && 
      item.color === product.color
    );

    if (existingItem) {
      // Увеличиваем количество
      const updatedItems = cartItems.map(item =>
        item.id === existingItem.id && 
        item.size === existingItem.size && 
        item.color === existingItem.color
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      saveCart(updatedItems);
    } else {
      // Добавляем новый товар
      const newItem = {
        id: product.id || Date.now(),
        name: product.name,
        price: product.price,
        image: product.image,
        size: product.size || 'M',
        color: product.color || 'белый',
        quantity: product.quantity || 1,
        addedAt: new Date().toISOString()
      };
      console.log('Сохраняем корзину с новым товаром:', [...cartItems, newItem]);
      saveCart([...cartItems, newItem]);
    }
  };

  const updateQuantity = (itemId, size, color, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId, size, color);
      return;
    }

    const updatedItems = cartItems.map(item =>
      item.id === itemId && item.size === size && item.color === color
        ? { ...item, quantity: newQuantity }
        : item
    );
    saveCart(updatedItems);
  };

  const removeFromCart = (itemId, size, color) => {
    const updatedItems = cartItems.filter(item => 
      !(item.id === itemId && item.size === size && item.color === color)
    );
    saveCart(updatedItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    // Сохраняем корзину в localStorage для checkout
    try {
      localStorage.setItem('checkout_cart', JSON.stringify(cartItems));
      localStorage.setItem('checkout_total', JSON.stringify(getTotalPrice()));
      
      // Переходим на страницу оформления заказа
      window.location.href = '/checkout';
    } catch (error) {
      console.error('Error saving checkout data:', error);
      alert('Ошибка при переходе к оформлению заказа');
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Кнопка корзины */}
      <button
        onClick={toggleDropdown}
        className="btn btn-ghost btn-sm relative p-2 hover:bg-gray-600 transition-all duration-200 text-gray-200 hover:text-white cart-button"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L6 11H4m3 2v6a1 1 0 001 1h10a1 1 0 001-1v-6M9 21v-2a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
        
        {/* Badge с количеством товаров */}
        {getTotalItems() > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-scale-in">
            {getTotalItems() > 99 ? '99+' : getTotalItems()}
          </span>
        )}
      </button>

      {/* Dropdown меню */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:w-96 sm:bg-gray-700 sm:rounded-xl sm:shadow-2xl sm:border sm:border-gray-600 sm:animate-fade-in sm:max-h-[80vh] sm:overflow-hidden sm:transform sm:-translate-x-1/2 sm:translate-x-0 cart-dropdown"
          onClick={(e) => {
            // Закрываем корзину при клике на фон (только на мобильных)
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          {/* Мобильная версия - полноэкранная */}
          <div className="w-full max-w-md bg-gray-700 rounded-xl shadow-2xl border border-gray-600 max-h-[90vh] overflow-hidden sm:hidden">
            <div className="p-4">
              {/* Заголовок */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Корзина</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white text-2xl font-bold p-1 rounded hover:bg-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Товары в корзине */}
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-3">🛒</div>
                  <p className="text-gray-300 mb-4">Корзина пуста</p>
                  <a 
                    href="/products" 
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Перейти к товарам
                  </a>
                </div>
              ) : (
                <>
                  {/* Список товаров */}
                  <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
                    {cartItems.map((item, index) => (
                      <div key={`cart-item-${index}-${item.id || 'no-id'}-${item.size || 'no-size'}-${item.color || 'no-color'}`} className="flex items-center space-x-3 p-3 bg-gray-600 rounded-lg">
                        {/* Изображение товара */}
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-400 rounded-lg flex items-center justify-center text-gray-200 text-sm font-medium overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} className="w-full h-full object-cover" width={48} height={48} />
                          ) : (
                            '👕'
                          )}
                        </div>

                        {/* Информация о товаре */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                          <div className="text-xs text-gray-300">
                            {item.size} • {item.color}
                          </div>
                          <div className="text-sm font-bold text-blue-400">
                            {item.price} ₽ × {item.quantity}
                          </div>
                        </div>

                        {/* Управление количеством */}
                        <div className="flex flex-col items-end space-y-2">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-500 hover:bg-gray-400 flex items-center justify-center text-white transition-colors touch-manipulation cart-quantity-button"
                            >
                              −
                            </button>
                            <span className="text-sm font-medium w-8 text-center text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-500 hover:bg-gray-400 flex items-center justify-center text-white transition-colors touch-manipulation cart-quantity-button"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, item.size, item.color)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-gray-500"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Итого */}
                  <div className="border-t border-gray-600 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-base font-medium text-white">Итого:</span>
                      <span className="text-lg font-bold text-blue-400">{getTotalPrice()} ₽</span>
                    </div>

                    {/* Кнопки */}
                    <div className="space-y-3">
                      <button
                        onClick={handleCheckout}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center touch-manipulation"
                      >
                        Оформить заказ
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-500 transition-colors font-medium touch-manipulation"
                      >
                        Продолжить покупки
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Десктопная версия */}
          <div className="hidden sm:block w-80 sm:w-96 bg-gray-700 rounded-xl shadow-2xl border border-gray-600 animate-fade-in max-h-[80vh] overflow-hidden transform -translate-x-1/2 sm:translate-x-0">
            <div className="p-4">
              {/* Заголовок */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Корзина</h3>
                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-400 hover:text-red-300 text-sm font-medium px-2 py-1 rounded hover:bg-gray-600 transition-colors cart-button touch-manipulation"
                  >
                    Очистить
                  </button>
                )}
              </div>

              {/* Товары в корзине */}
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-3">🛒</div>
                  <p className="text-gray-300 mb-4">Корзина пуста</p>
                  <a 
                    href="/products" 
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    Перейти к товарам
                  </a>
                </div>
              ) : (
                <>
                  {/* Список товаров */}
                  <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
                    {cartItems.map((item, index) => (
                      <div key={`cart-item-${index}-${item.id || 'no-id'}-${item.size || 'no-size'}-${item.color || 'no-color'}`} className="flex items-center space-x-3 p-3 bg-gray-600 rounded-lg">
                        {/* Изображение товара */}
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-400 rounded-lg flex items-center justify-center text-gray-200 text-sm font-medium overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} className="w-full h-full object-cover" width={48} height={48} />
                          ) : (
                            '👕'
                          )}
                        </div>

                        {/* Информация о товаре */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                          <div className="text-xs text-gray-300">
                            {item.size} • {item.color}
                          </div>
                          <div className="text-sm font-bold text-blue-400">
                            {item.price} ₽ × {item.quantity}
                          </div>
                        </div>

                        {/* Управление количеством */}
                        <div className="flex flex-col items-end space-y-2">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-500 hover:bg-gray-400 flex items-center justify-center text-white transition-colors touch-manipulation cart-quantity-button"
                            >
                              −
                            </button>
                            <span className="text-sm font-medium w-8 text-center text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-500 hover:bg-gray-400 flex items-center justify-center text-white transition-colors touch-manipulation cart-quantity-button"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, item.size, item.color)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-gray-500"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Итого */}
                  <div className="border-t border-gray-600 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-base font-medium text-white">Итого:</span>
                      <span className="text-lg font-bold text-blue-400">{getTotalPrice()} ₽</span>
                    </div>

                    {/* Кнопки */}
                    <div className="space-y-3">
                      <button
                        onClick={handleCheckout}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center touch-manipulation"
                      >
                        Оформить заказ
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-500 transition-colors font-medium touch-manipulation"
                      >
                        Продолжить покупки
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Хук для работы с корзиной (для использования в других компонентах)
export function useCart() {
  const [cartItems, setCartItems] = useState([]);

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('printshop_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
      setCartItems([]);
    }
  };

  const addToCart = (product) => {
    try {
      const savedCart = localStorage.getItem('printshop_cart');
      const currentCart = savedCart ? JSON.parse(savedCart) : [];
      
      const existingItem = currentCart.find(item => 
        item.id === product.id && 
        item.size === product.size && 
        item.color === product.color
      );

      let updatedCart;
      if (existingItem) {
        updatedCart = currentCart.map(item =>
          item.id === existingItem.id && 
          item.size === existingItem.size && 
          item.color === existingItem.color
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const newItem = {
          id: product.id || Date.now(),
          name: product.name,
          price: product.price,
          image: product.image,
          size: product.size || 'M',
          color: product.color || 'белый',
          quantity: product.quantity || 1,
          addedAt: new Date().toISOString()
        };
        updatedCart = [...currentCart, newItem];
      }

      localStorage.setItem('printshop_cart', JSON.stringify(updatedCart));
      setCartItems(updatedCart);
      
      // Уведомляем об обновлении корзины
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      // Показываем уведомление
      if (window.showCartNotification) {
        window.showCartNotification(`${product.name} добавлен в корзину`);
      }
    } catch (error) {
      console.error('Ошибка добавления в корзину:', error);
    }
  };

  return {
    cartItems,
    loadCart,
    addToCart
  };
}