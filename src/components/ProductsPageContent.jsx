'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import UserProfile from '@/components/UserProfile';
import MobileMenu from '@/components/MobileMenu';
import CartDropdown from '@/components/CartDropdown';
import CartNotification from '@/components/CartNotification';
import { ProductGridSkeleton } from '@/components/LoadingSkeletons';
import Image from 'next/image';
import { useProductsCache } from '@/components/useProductsCache';
import { useInfiniteScroll } from '@/components/useInfiniteScroll';

export default function ProductsPageContent() {
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Infinite scroll
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Кэширование
  const { getCachedData, setCachedData, hasCachedData, getCacheStats } = useProductsCache();
  
  // Infinite scroll
  const { lastElementCallback } = useInfiniteScroll(loadMoreProducts, hasMore, isLoadingMore);

  // Загрузка товаров
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Проверяем кэш для текущей страницы и раздела
        const cacheKey = `${selectedSection}:${currentPage}`;
        if (hasCachedData(cacheKey)) {
          console.log('📖 Using cached data for:', cacheKey);
          const cachedData = getCachedData(cacheKey);
          setProducts(cachedData.products || []);
          setSections(cachedData.sections || []);
          setTotalProducts(cachedData.pagination?.totalProducts || 0);
          setHasMore(cachedData.pagination?.hasNextPage || false);
          setLoading(false);
          return;
        }
        
        // Загружаем с пагинацией
        const response = await fetch(`/api/products/paginated?page=${currentPage}&limit=20&section=${selectedSection}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const data = await response.json();
        
        // Обновляем состояние
        setProducts(data.products || []);
        setSections(data.sections || []);
        setTotalProducts(data.pagination?.totalProducts || 0);
        setHasMore(data.pagination?.hasNextPage || false);
        
        // Кэшируем результат
        setCachedData(cacheKey, data);
        
        console.log(`✅ Loaded page ${currentPage} with ${data.products?.length || 0} products`);
        
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, selectedSection, hasCachedData, getCachedData, setCachedData]);

  // Функции для infinite scroll
  const loadMoreProducts = async () => {
    if (isLoadingMore || !hasMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      
      // Проверяем кэш для следующей страницы
      const cacheKey = `${selectedSection}:${nextPage}`;
      if (hasCachedData(cacheKey)) {
        console.log('📖 Using cached data for next page:', cacheKey);
        const cachedData = getCachedData(cacheKey);
        setProducts(prev => [...prev, ...(cachedData.products || [])]);
        setHasMore(cachedData.pagination?.hasNextPage || false);
        setCurrentPage(nextPage);
        return;
      }
      
      // Загружаем следующую страницу
      const response = await fetch(`/api/products/paginated?page=${nextPage}&limit=20&section=${selectedSection}`);
      if (!response.ok) throw new Error('Failed to fetch more products');
      
      const data = await response.json();
      
      // Добавляем новые товары к существующим
      setProducts(prev => [...prev, ...(data.products || [])]);
      setHasMore(data.pagination?.hasNextPage || false);
      setCurrentPage(nextPage);
      
      // Кэшируем результат
      setCachedData(cacheKey, data);
      
      console.log(`✅ Loaded page ${nextPage} with ${data.products?.length || 0} additional products`);
      
    } catch (err) {
      console.error('Error loading more products:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // Сброс на первую страницу при смене раздела
  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
    setHasMore(true);
  }, [selectedSection]);
  
  // Фильтрация товаров по разделу (теперь не нужна, так как фильтрация на сервере)
  const filteredProducts = products;

  return (
    <div className="min-h-screen bg-gray-800">
      <div className="container py-12 lg:py-16">
        <h1 className="text-hero text-white mb-6 text-center">Наши товары</h1>
        <p className="text-body text-gray-300 max-w-2xl mx-auto text-center mb-12">
          Выберите товар для персонализации. Все изделия изготавливаются под заказ с вашим уникальным дизайном.
        </p>
        
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <div className="text-center text-red-400">Ошибка: {error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id || `product-${index}`}
                ref={index === filteredProducts.length - 1 ? lastElementCallback : null}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
        
        {hasMore && (
          <div className="mt-8 text-center">
            {isLoadingMore ? (
              <div className="text-gray-400">Загружаем еще товары...</div>
            ) : (
              <button
                onClick={loadMoreProducts}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Загрузить еще товары
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 