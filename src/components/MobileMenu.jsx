'use client';

import { useState } from 'react';
import CartDropdown from './CartDropdown';


export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  
  const menuItems = [
    { name: 'Главная', href: '/#main' },
    { name: 'Товары', href: '/products' },
    { name: 'Дизайнер', href: '/designer' },
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
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={toggleMenu}></div>
          
          <div className="relative bg-gray-700 w-full max-w-sm h-full shadow-xl border-r border-gray-600 opacity-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-600 bg-gray-700">
              <h2 className="text-xl font-bold text-white">PrintStyle</h2>
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="bg-gray-700 h-full">
              <ul className="space-y-0">
                {menuItems.map((item, index) => {
                  const isLast = index === menuItems.length - 1;
                  return (
                  <li key={item.name}>
                    {item.special === 'cart' ? (
                      <div className={`px-6 py-4 flex items-center justify-between bg-gray-700 ${!isLast ? 'border-b border-gray-600' : ''}`}>
                        <span className="text-lg font-medium text-white">Корзина</span>
                        <CartDropdown />
                      </div>
                    ) : (
                      <a 
                        href={item.href}
                        className={`block px-6 py-4 text-lg font-medium text-white hover:bg-gray-600 hover:text-blue-300 transition-colors bg-gray-700 ${!isLast ? 'border-b border-gray-600' : ''}`}
                        onClick={toggleMenu}
                      >
                        {item.name}
                      </a>
                    )}
                  </li>
                  );
                })}
              </ul>
              

            </nav>
          </div>
        </div>
      )}
    </>
  );
}