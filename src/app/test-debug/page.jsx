'use client';

import { useState, useEffect } from 'react';

export default function TestDebugPage() {
  const [localStorageData, setLocalStorageData] = useState({});

  useEffect(() => {
    // Проверяем все данные в localStorage
    const data = {
      designer_order: localStorage.getItem('designer_order'),
      checkout_cart: localStorage.getItem('checkout_cart'),
      checkout_total: localStorage.getItem('checkout_total'),
      printStyle_cart: localStorage.getItem('printStyle_cart')
    };
    
    setLocalStorageData(data);
  }, []);

  const clearAll = () => {
    localStorage.clear();
    setLocalStorageData({});
  };

  const parseJson = (jsonString) => {
    try {
      return jsonString ? JSON.parse(jsonString) : null;
    } catch (e) {
      return `Ошибка парсинга: ${e.message}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🔍 Отладка localStorage</h1>
        
        <div className="space-y-6">
          {/* Designer Order */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">designer_order</h2>
            <div className="bg-gray-800 rounded p-4">
              <pre className="text-green-400 text-sm overflow-auto">
                {localStorageData.designer_order ? 
                  JSON.stringify(parseJson(localStorageData.designer_order), null, 2) : 
                  'Нет данных'
                }
              </pre>
            </div>
          </div>

          {/* Checkout Cart */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">checkout_cart</h2>
            <div className="bg-gray-800 rounded p-4">
              <pre className="text-green-400 text-sm overflow-auto">
                {localStorageData.checkout_cart ? 
                  JSON.stringify(parseJson(localStorageData.checkout_cart), null, 2) : 
                  'Нет данных'
                }
              </pre>
            </div>
          </div>

          {/* Checkout Total */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">checkout_total</h2>
            <div className="bg-gray-800 rounded p-4">
              <pre className="text-green-400 text-sm overflow-auto">
                {localStorageData.checkout_total || 'Нет данных'}
              </pre>
            </div>
          </div>

          {/* Print Style Cart */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">printStyle_cart</h2>
            <div className="bg-gray-800 rounded p-4">
              <pre className="text-green-400 text-sm overflow-auto">
                {localStorageData.printStyle_cart ? 
                  JSON.stringify(parseJson(localStorageData.printStyle_cart), null, 2) : 
                  'Нет данных'
                }
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Действия</h2>
            <div className="flex gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Обновить
              </button>
              <button 
                onClick={clearAll}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Очистить все
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 