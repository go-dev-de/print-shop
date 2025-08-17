'use client';

// Общий скелетон-элемент
function SkeletonElement({ className = "", animate = true }) {
  return (
    <div 
      className={`bg-gray-200 rounded-md ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  );
}

// Скелетон для карточки товара
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Изображение */}
      <SkeletonElement className="h-48 w-full" />
      
      {/* Контент карточки */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          {/* Название товара */}
          <SkeletonElement className="h-6 w-2/3" />
          {/* Цена */}
          <SkeletonElement className="h-6 w-16" />
        </div>
        
        {/* Категория */}
        <SkeletonElement className="h-4 w-20 mb-2" />
        
        {/* Описание */}
        <SkeletonElement className="h-4 w-full mb-1" />
        <SkeletonElement className="h-4 w-3/4 mb-4" />
        
        {/* Кнопка */}
        <SkeletonElement className="h-10 w-full" />
      </div>
    </div>
  );
}

// Скелетон сетки товаров
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Скелетон для админ панели
export function AdminTableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Заголовок таблицы */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <SkeletonElement className="h-6 w-32" />
          <SkeletonElement className="h-8 w-24" />
        </div>
      </div>
      
      {/* Строки таблицы */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex items-center space-x-4">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <SkeletonElement 
                  key={colIndex} 
                  className={`h-4 ${colIndex === 0 ? 'w-16' : colIndex === cols - 1 ? 'w-20' : 'w-24'}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Скелетон для формы
export function FormSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <SkeletonElement className="h-6 w-48 mb-6" />
      
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <SkeletonElement className="h-4 w-20 mb-2" />
            <SkeletonElement className="h-10 w-full" />
          </div>
        ))}
      </div>
      
      <SkeletonElement className="h-12 w-full mt-6" />
    </div>
  );
}

// Скелетон для превью
export function PreviewSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <SkeletonElement className="h-6 w-32 mb-4" />
      
      {/* Область превью */}
      <div className="relative">
        <SkeletonElement className="h-96 w-full mb-4" />
        
        {/* Контролы */}
        <div className="flex justify-center space-x-4">
          <SkeletonElement className="h-10 w-20" />
          <SkeletonElement className="h-10 w-20" />
        </div>
      </div>
    </div>
  );
}

// Скелетон для страницы
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <SkeletonElement className="h-8 w-32" />
            <div className="hidden md:flex space-x-8">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonElement key={index} className="h-6 w-16" />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <SkeletonElement className="h-10 w-64 mx-auto mb-4" />
          <SkeletonElement className="h-6 w-96 mx-auto" />
        </div>
        
        <ProductGridSkeleton />
      </div>
    </div>
  );
}