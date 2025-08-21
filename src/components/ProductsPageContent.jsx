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
  
  // Infinite scroll (после объявления loadMoreProducts)
  const { lastElementCallback } = useInfiniteScroll(loadMoreProducts, hasMore, isLoadingMore);
  
  // Фильтрация товаров по разделу (теперь не нужна, так как фильтрация на сервере)
  const filteredProducts = products;

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <header className="shadow-lg sticky top-0 z-40" style={{backgroundColor: '#424242'}}>
        <div className="container">
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl logo-print-shop h-full flex items-center">
                <Link href="/" className="text-white hover:text-gray-200 transition-colors duration-200 h-full flex items-center">
                  <div className="hidden md:block">
                    <Image 
                      src="/print-style-logo.png" 
                      alt="Print Style Logo" 
                      width={120} 
                      height={40}
                      className="h-full w-auto"
                    />
                  </div>
                  <div className="md:hidden">
                    <Image 
                      src="/print-style-logo.png" 
                      alt="Print Style Logo" 
                      width={120} 
                      height={40}
                      className="h-full w-auto"
                    />
                  </div>
                </Link>
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/#main" className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white transition-colors rounded-lg">Главная</Link>
              <Link href="/products" className="px-4 py-2 text-sm font-medium text-white hover:text-gray-200 transition-colors rounded-lg">Товары</Link>
              <Link href="/reviews" className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-600 transition-all rounded-lg">Отзывы</Link>
              <Link href="/#about" className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-gray-600 transition-all rounded-lg">О нас</Link>
              <div className="flex items-center space-x-3 ml-4">
                <CartDropdown />
                <UserProfile />
              </div>
            </nav>
            
            {/* Mobile Menu */}
            <MobileMenu />
          </div>
        </div>
      </header>
      
      {/* Основной контент */}
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
      
      {/* Уведомления о добавлении в корзину */}
      <CartNotification />
    </div>
  );
} 