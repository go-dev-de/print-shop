'use client';

import dynamic from 'next/dynamic';

// Динамический импорт с отключением SSR
const ProductsPageContent = dynamic(() => import('@/components/ProductsPageContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Загружаем страницу товаров...</p>
      </div>
    </div>
  )
});

export default function ProductsPage() {
  return <ProductsPageContent />;
}