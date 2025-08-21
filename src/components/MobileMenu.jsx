'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import CartDropdown from './CartDropdown';


export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const cartButtonRef = useRef(null);
  
  const toggleMenu = () => setIsOpen(!isOpen);
  
  const handleCartClick = () => {
    // Находим кнопку корзины и кликаем на неё
    if (cartButtonRef.current) {
      const cartButton = cartButtonRef.current.querySelector('button');
      if (cartButton) {
        cartButton.click();
      }
    }
  };
  
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
          className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
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
      <div className={`mobile-menu-overlay fixed inset-0 md:hidden transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div 
          className="mobile-menu-backdrop absolute inset-0"
          onClick={toggleMenu}
        />
        
        <div 
          className={`mobile-menu-content absolute right-0 top-0 h-full w-full max-w-sm bg-gray-700 shadow-2xl border-l border-gray-600 transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-end p-4 border-b border-gray-600 bg-gray-700">
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
                        <div className={`px-6 py-4 flex items-center justify-between bg-gray-700 hover:bg-gray-600 transition-colors cursor-pointer ${!isLast ? 'border-b border-gray-600' : ''}`} onClick={handleCartClick}>
                          <span className="text-lg font-medium text-white">Корзина</span>
                          <div ref={cartButtonRef} className="cart-dropdown-wrapper">
                            <CartDropdown />
                          </div>
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
      </>
    );
  }