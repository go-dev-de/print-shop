'use client';

import { useState, useEffect, useRef } from 'react';

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
      if (e.key === 'printStyle_cart') {
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

  const loadCart = () => {
    try {
      const savedCart = localStorage.getItem('printStyle_cart');
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

  const saveCart = (items) => {
    try {
      localStorage.setItem('printStyle_cart', JSON.stringify(items));
      setCartItems(items);
      
      // Уведомляем об обновлении корзины
      window.dispatchEvent(new CustomEvent('cartUpdated'));
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
        className="btn btn-ghost btn-sm relative p-2 hover:bg-gray-100 transition-all duration-200"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-fade-in">
          <div className="p-4">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-subheading text-gray-900">Корзина</h3>
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="btn btn-ghost btn-sm text-red-500 hover:text-red-700"
                >
                  Очистить
                </button>
              )}
            </div>

            {/* Товары в корзине */}
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-3">🛒</div>
                <p className="text-body text-gray-500 mb-4">Корзина пуста</p>
                <a 
                  href="/products" 
                  className="btn btn-primary btn-sm"
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
                    <div key={`cart-item-${index}-${item.id || 'no-id'}-${item.size || 'no-size'}-${item.color || 'no-color'}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      {/* Изображение товара */}
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center text-gray-600 text-sm font-medium overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          '👕'
                        )}
                      </div>

                      {/* Информация о товаре */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                        <div className="text-xs text-gray-500">
                          {item.size} • {item.color}
                        </div>
                        <div className="text-sm font-bold text-blue-600">
                          {item.price} ₽ × {item.quantity}
                        </div>
                      </div>

                      {/* Управление количеством */}
                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
                          >
                            −
                          </button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id, item.size, item.color)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Итого */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-body font-medium text-gray-900">Итого:</span>
                    <span className="text-heading text-blue-600">{getTotalPrice()} ₽</span>
                  </div>

                  {/* Кнопки */}
                  <div className="space-y-2">
                    <button
                      onClick={handleCheckout}
                      className="btn btn-primary btn-md w-full"
                    >
                      Оформить заказ
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="btn btn-outline btn-md w-full"
                    >
                      Продолжить покупки
                    </button>
                  </div>
                </div>
              </>
            )}
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
      const savedCart = localStorage.getItem('printStyle_cart');
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
      const savedCart = localStorage.getItem('printStyle_cart');
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

      localStorage.setItem('printStyle_cart', JSON.stringify(updatedCart));
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