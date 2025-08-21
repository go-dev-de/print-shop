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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка товаров
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const data = await response.json();
        setProducts(data.products || []);
        setSections(data.sections || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Фильтрация товаров по разделу
  const filteredProducts = selectedSection === 'all' 
    ? products 
    : products.filter(product => 
        product.sectionId === selectedSection || 
        product.section?.id === selectedSection ||
        product.section === selectedSection
      );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-800">
        <header className="shadow-lg sticky top-0 z-40" style={{backgroundColor: '#424242'}}>
          <div className="max-w-sm mx-auto px-4 sm:max-w-7xl sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-3xl logo-print-shop h-full flex items-center">
                  <Link href="/" className="text-white hover:text-gray-200 transition-colors duration-200 h-full flex items-center">
                    <div className="hidden md:block">print style</div>
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
                
                <div className="ml-6 hidden md:block"><UserProfile /></div>
              </div>
              <nav className="hidden md:flex space-x-8">
                <Link href="/#main" className="text-gray-200 hover:text-blue-400">Главная</Link>
                <Link href="/products" className="text-blue-400 font-medium">Товары</Link>
                <Link href="/#reviews" className="text-gray-200 hover:text-blue-400">Отзывы</Link>
                <Link href="/#about" className="text-gray-200 hover:text-blue-400">О нас</Link>
                <Link href="/#contacts" className="text-gray-200 hover:text-blue-400">Контакты</Link>
              </nav>
            </div>
          </div>
        </header>
        
        {/* Основной контент */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Заголовок страницы */}
          <div className="text-center mb-8">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
          </div>
          
          {/* Skeleton для товаров */}
          <ProductGridSkeleton count={8} />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-800">
        <header className="shadow-lg sticky top-0 z-40" style={{backgroundColor: '#424242'}}>
          <div className="max-w-sm mx-auto px-4 sm:max-w-7xl sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-3xl logo-print-shop h-full flex items-center">
                  <Link href="/" className="text-white hover:text-gray-200 transition-colors duration-200 h-full flex items-center">
                    <div className="hidden md:block">print style</div>
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
                
                <div className="ml-6 hidden md:block"><UserProfile /></div>
              </div>
              <nav className="hidden md:flex space-x-8">
                <Link href="/#main" className="text-gray-200 hover:text-blue-400">Главная</Link>
                <Link href="/products" className="text-blue-400 font-medium">Товары</Link>
                <Link href="/#reviews" className="text-gray-200 hover:text-blue-400">Отзывы</Link>
                <Link href="/#about" className="text-gray-200 hover:text-blue-400">О нас</Link>
                <Link href="/#contacts" className="text-gray-200 hover:text-blue-400">Контакты</Link>
              </nav>
            </div>
          </div>
        </header>
        
        {/* Основной контент */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center bg-gray-700 rounded-lg shadow-lg p-8">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-white mb-2">Ошибка загрузки</h3>
              <p className="text-gray-300 mb-4">Не удалось загрузить товары: {error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <header className="shadow-lg sticky top-0 z-40" style={{backgroundColor: '#424242'}}>
        <div className="container">
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl logo-print-shop h-full flex items-center">
                <Link href="/" className="text-white hover:text-gray-200 transition-colors duration-200 h-full flex items-center">
                  <div className="hidden md:block">print style</div>
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
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/#main" className="btn btn-ghost btn-sm text-gray-200 hover:text-white">Главная</Link>
              <Link href="/products" className="btn btn-ghost btn-sm text-white font-semibold">Товары</Link>
              <Link href="/reviews" className="btn btn-ghost btn-sm text-gray-200 hover:text-white">Отзывы</Link>
              <Link href="/#about" className="btn btn-ghost btn-sm text-gray-200 hover:text-white">О нас</Link>
              <div className="flex items-center space-x-3">
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
      <main className="container py-12 lg:py-16">
        {/* Заголовок страницы */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-hero text-white mb-6">Наши товары</h1>
          <p className="text-body text-gray-300 max-w-2xl mx-auto">
            Выберите товар для персонализации. Все изделия изготавливаются под заказ с вашим уникальным дизайном.
          </p>
        </div>

        {/* Фильтр по разделам */}
        {sections.length > 0 && (
          <div className="mb-12 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setSelectedSection('all')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  selectedSection === 'all'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-800 hover:bg-blue-600 hover:text-white hover:scale-105'
                }`}
              >
                Все товары ({products.length})
              </button>
              {sections.map((section, index) => {
                const count = products.filter(p => 
                  p.sectionId === section.id || 
                  p.section?.id === section.id ||
                  p.section === section.id
                ).length;
                return (
                  <button
                    key={section.id || `section-${index}`}
                    onClick={() => setSelectedSection(section.id)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 animate-fade-in ${
                      selectedSection === section.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-800 hover:bg-blue-600 hover:text-white hover:scale-105'
                    }`}
                    style={{animationDelay: `${0.3 + index * 0.1}s`}}
                  >
                    {section.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Сетка товаров */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id || `product-${index}`} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-white mb-2">
              {selectedSection === 'all' ? 'Товары не найдены' : 'В этом разделе пока нет товаров'}
            </h3>
            <p className="text-gray-300 mb-6">
              {selectedSection === 'all' 
                ? 'Администратор пока не добавил товары в каталог.'
                : 'Попробуйте выбрать другой раздел или вернитесь позже.'
              }
            </p>
            {selectedSection !== 'all' && (
              <button
                onClick={() => setSelectedSection('all')}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Показать все товары
              </button>
            )}
          </div>
        )}

        {/* Призыв к действию */}
        {filteredProducts.length > 0 && (
          <div className="mt-16 text-center bg-gray-700 rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-white mb-4">
              Не нашли подходящий товар?
            </h2>
            <p className="text-gray-300 mb-6">
              Мы можем изготовить принт на любом изделии. Свяжитесь с нами для индивидуального заказа.
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Создать свой дизайн
            </Link>
          </div>
        )}
      </main>
      
      {/* Уведомления о добавлении в корзину */}
      <CartNotification />
    </div>
  );
}