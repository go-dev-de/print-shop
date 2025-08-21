'use client';

import { useState, useEffect, useCallback } from 'react';

export function useCart() {
  const [cartItems, setCartItems] = useState([]);

  // Загружаем корзину при монтировании
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

  const loadCart = useCallback(() => {
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
  }, []);

  const addToCart = useCallback((product) => {
    try {
      console.log('useCart: Добавляем товар в корзину:', product);
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

      console.log('useCart: Обновленная корзина:', updatedCart);
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
  }, []);

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

  const handleCheckout = useCallback(() => {
    if (cartItems.length === 0) return;
    
    try {
      // Вычисляем общую стоимость напрямую
      const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      // Сохраняем корзину в localStorage для checkout
      localStorage.setItem('checkout_cart', JSON.stringify(cartItems));
      localStorage.setItem('checkout_total', JSON.stringify(totalPrice));
      
      // Переходим на страницу оформления заказа
      window.location.href = '/checkout';
    } catch (error) {
      console.error('Error saving checkout data:', error);
      alert('Ошибка при переходе к оформлению заказа');
    }
  }, [cartItems]);

  const saveCart = (items) => {
    try {
      localStorage.setItem('printshop_cart', JSON.stringify(items));
      setCartItems(items);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('Ошибка сохранения корзины:', error);
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return {
    cartItems,
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    handleCheckout,
    getTotalItems,
    getTotalPrice
  };
} 