'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import UserProfile from '@/components/UserProfile';
import CartDropdown from '@/components/CartDropdown';
import MobileMenu from '@/components/MobileMenu';

export default function Header() {
  const pathname = usePathname();
  
  // Определяем текущую страницу для подсветки в навигации
  const getCurrentPage = () => {
    if (pathname === '/') return 'home';
    if (pathname === '/products') return 'products';
    if (pathname === '/designer') return 'designer';
    if (pathname === '/reviews') return 'reviews';
    if (pathname === '/checkout') return 'checkout';
    if (pathname === '/order') return 'order';
    if (pathname === '/payment') return 'payment';
    if (pathname === '/order-confirmation') return 'order-confirmation';
    return 'home';
  };

  const currentPage = getCurrentPage();
  const isActivePage = (page) => currentPage === page;

  return (
    <>
      {/* Header */}
      <header className={`shadow-lg sticky top-0 border-b border-gray-700 w-full max-w-full overflow-hidden ${
        currentPage === 'home' ? 'z-[9996] transition-all duration-300' : 'z-40'
      }`} style={{backgroundColor: '#424242'}}>
        <div className="container w-full max-w-full overflow-hidden">
          <div className="flex justify-between items-center py-1 w-full max-w-full">
            <div className="flex items-center space-x-8 w-full max-w-full">
              <h1 className="text-2xl logo-print-shop h-full flex items-center flex-shrink-0">
                <Link href="/" className="text-white hover:text-gray-200 transition-all duration-300 h-full flex items-center">
                  <div className="hidden md:block">
                    <Image 
                      src="/print-style-logo.png" 
                      alt="Print Style Logo" 
                      width={120} 
                      height={40}
                      className="h-full w-auto"
                      priority
                    />
                  </div>
                  <div className="md:hidden">
                    <Image 
                      src="/print-style-logo.png" 
                      alt="Print Style Logo" 
                      width={120} 
                      height={40}
                      className="h-full w-auto"
                      priority
                    />
                  </div>
                </Link>
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 flex-shrink-0">
              <Link 
                href="/#main" 
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  isActivePage('home') 
                    ? 'text-white' 
                    : 'text-gray-100 hover:text-white hover:bg-gray-600'
                }`}
              >
                Главная
              </Link>
              <Link 
                href="/products" 
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  isActivePage('products') 
                    ? 'text-white' 
                    : 'text-gray-100 hover:text-white hover:bg-gray-600'
                }`}
              >
                Товары
              </Link>
              <Link 
                href="/designer" 
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  isActivePage('designer') 
                    ? 'text-white' 
                    : 'text-gray-100 hover:text-white hover:bg-gray-600'
                }`}
              >
                Конструктор
              </Link>
              <Link 
                href="/reviews" 
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  isActivePage('reviews') 
                    ? 'text-white' 
                    : 'text-gray-100 hover:text-white hover:bg-gray-600'
                }`}
              >
                Отзывы
              </Link>
              <Link 
                href="/#about" 
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  isActivePage('home') 
                    ? 'text-white' 
                    : 'text-gray-100 hover:text-white hover:bg-gray-600'
                }`}
              >
                О нас
              </Link>
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
    </>
  );
} 