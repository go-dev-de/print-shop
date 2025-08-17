'use client';

import { usePathname } from 'next/navigation';

export default function Breadcrumbs() {
  const pathname = usePathname();
  
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    
    const breadcrumbs = [
      { name: 'Главная', href: '/', current: pathname === '/' }
    ];
    
    if (segments.length === 0) return breadcrumbs;
    
    let currentPath = '';
    
    for (let i = 0; i < segments.length; i++) {
      currentPath += `/${segments[i]}`;
      const isLast = i === segments.length - 1;
      
      let name = segments[i];
      switch (segments[i]) {
        case 'products':
          name = 'Товары';
          break;
        case 'order':
          name = 'Оформление заказа';
          break;
        case 'admin':
          name = 'Админ панель';
          break;
        case 'login':
          name = 'Войти';
          break;
        case 'register':
          name = 'Регистрация';
          break;
        default:
          name = segments[i].charAt(0).toUpperCase() + segments[i].slice(1);
      }
      
      breadcrumbs.push({
        name,
        href: currentPath,
        current: isLast
      });
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = getBreadcrumbs();
  
  if (breadcrumbs.length <= 1) return null;
  
  return (
    <nav className="bg-gray-50 border-b border-gray-200" aria-label="Breadcrumb">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 py-4">
          <ol className="flex items-center space-x-4">
            {breadcrumbs.map((item, index) => (
              <li key={item.href || `breadcrumb-${index}`} className="flex items-center">
                {index > 0 && (
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400 mx-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                
                {item.current ? (
                  <span className="text-sm font-medium text-gray-500" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <a 
                    href={item.href}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {item.name}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </nav>
  );
}