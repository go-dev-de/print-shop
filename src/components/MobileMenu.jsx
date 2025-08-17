'use client';

import { useState } from 'react';
import CartDropdown from './CartDropdown';
import AuthNav from './AuthNav';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  
  const menuItems = [
    { name: 'Главная', href: '/#main' },
    { name: 'Товары', href: '/products' },
    { name: 'Отзывы', href: '/reviews' },
    { name: 'О нас', href: '/#about' },
    { name: 'Корзина', href: '#', special: 'cart' }
  ];
  
  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden">
        <button
          onClick={toggleMenu}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-expanded={isOpen}
          aria-label="Открыть меню"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      
      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-25" onClick={toggleMenu}></div>
          
          <div className="relative bg-white w-full max-w-sm h-full shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">PrintStyle</h2>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="px-4 py-6">
              <ul className="space-y-4">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    {item.special === 'cart' ? (
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-lg font-medium text-gray-700">Корзина</span>
                        <CartDropdown />
                      </div>
                    ) : (
                      <a 
                        href={item.href}
                        className="block px-4 py-3 text-lg font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                        onClick={toggleMenu}
                      >
                        {item.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <AuthNav />
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}