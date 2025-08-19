'use client';

import { useEffect } from 'react';

export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('🚪 Logout page: Starting logout...');
        
        // Очищаем все storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Вызываем API
        const response = await fetch('/api/auth/logout', { 
          method: 'POST',
          credentials: 'include'
        });
        
        console.log('📡 Logout response:', await response.text());
        
        // Принудительно очищаем все куки на клиенте
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        console.log('🍪 All cookies cleared');
        
      } catch (error) {
        console.error('❌ Logout error:', error);
      }
      
      // Перенаправляем на главную с полной перезагрузкой
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    };
    
    performLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Выходим из аккаунта...</h1>
        <p className="text-gray-600">Пожалуйста, подождите</p>
      </div>
    </div>
  );
}