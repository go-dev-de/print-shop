'use client';

import { useState, useEffect } from 'react';

export default function CartNotification() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Регистрируем глобальную функцию для показа уведомлений
    window.showCartNotification = (message) => {
      const id = Date.now();
      const notification = { id, message };
      
      setNotifications(prev => [...prev, notification]);
      
      // Автоматически убираем уведомление через 3 секунды
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 3000);
    };

    return () => {
      delete window.showCartNotification;
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-2 sm:right-4 z-50 space-y-2 max-w-sm cart-notification">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-up flex items-center space-x-3 w-full sm:max-w-sm"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="flex-1 text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => removeNotification(notification.id)}
            className="text-white hover:text-green-200 transition-colors p-1 rounded hover:bg-green-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}