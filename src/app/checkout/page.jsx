'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import UserProfile from '@/components/UserProfile';
import CartDropdown from '@/components/CartDropdown';
import CartNotification from '@/components/CartNotification';
import MobileMenu from '@/components/MobileMenu'; // Added MobileMenu import

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSticky, setIsSticky] = useState(false);
  const orderSummaryRef = useRef(null);
  
  // Форма клиента
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  });

  // Данные доставки
  const [deliveryMethod, setDeliveryMethod] = useState('pickup'); // pickup, delivery
  const [paymentMethod, setPaymentMethod] = useState('online'); // online, cash

  const loadCheckoutData = useCallback(() => {
    try {
      const savedCart = localStorage.getItem('checkout_cart');
      const savedTotal = localStorage.getItem('checkout_total');
      
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        setCartItems(cart);
        setTotalPrice(savedTotal ? JSON.parse(savedTotal) : 0);
      } else {
        // Если нет данных корзины, перенаправляем обратно
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      router.push('/');
    }
  }, [router]);

  useEffect(() => {
    // Загружаем данные корзины
    loadCheckoutData();
    // Загружаем данные пользователя
    loadUserData();

    // Добавляем обработчик скролла для sticky эффекта
    const handleScroll = () => {
      if (orderSummaryRef.current) {
        const rect = orderSummaryRef.current.getBoundingClientRect();
        const headerHeight = 120; // Высота header'а
        setIsSticky(rect.top <= headerHeight);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Убираем зависимости, так как эти функции должны выполниться только один раз при монтировании

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setCurrentUser(data.user);
          // Предзаполняем форму данными пользователя
          setCustomerData(prev => ({
            ...prev,
            name: data.user.name || '',
            email: data.user.email || ''
          }));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateDeliveryPrice = () => {
    return deliveryMethod === 'delivery' ? 300 : 0;
  };

  const getFinalTotal = () => {
    return totalPrice + calculateDeliveryPrice();
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Валидация
    if (!customerData.name || !customerData.phone) {
      alert('Пожалуйста, заполните обязательные поля (имя и телефон)');
      return;
    }

    if (deliveryMethod === 'delivery' && !customerData.address) {
      alert('Пожалуйста, укажите адрес доставки');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customer: customerData,
        items: cartItems,
        totalPrice: getFinalTotal(),
        deliveryMethod,
        deliveryPrice: calculateDeliveryPrice(),
        paymentMethod,
        status: 'pending'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        // Очищаем корзину
        localStorage.removeItem('checkout_cart');
        localStorage.removeItem('checkout_total');
        localStorage.removeItem('printStyle_cart');
        
        // Уведомляем об обновлении корзины
        window.dispatchEvent(new CustomEvent('cartUpdated'));

        if (paymentMethod === 'online') {
          // Перенаправляем на страницу оплаты
          router.push(`/payment?orderId=${result.orderId}&amount=${getFinalTotal()}`);
        } else {
          // Перенаправляем на страницу подтверждения
          router.push(`/order-confirmation?orderId=${result.orderId}`);
        }
      } else {
        alert(result.message || 'Ошибка при оформлении заказа');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Ошибка при оформлении заказа');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center bg-gray-700 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-white mb-4">Корзина пуста</h1>
          <p className="text-gray-300 mb-6">Добавьте товары в корзину для оформления заказа</p>
          <button 
            onClick={() => router.push('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Перейти к товарам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <header className="shadow-lg sticky top-0 z-40 border-b border-gray-200" style={{backgroundColor: '#424242'}}>
        <div className="container">
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center space-x-8">
              <h1 className="text-heading text-white h-full flex items-center">
                <Link href="/" className="hover:text-blue-600 transition-all duration-300 transform hover:scale-105 h-full flex items-center">
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
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/#main" className="btn btn-ghost btn-sm text-gray-200 hover:text-white">Главная</Link>
              <Link href="/products" className="btn btn-ghost btn-sm text-gray-200 hover:text-white">Товары</Link>
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

      {/* Main Content */}
      <main className="container py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-hero text-white mb-6">
              Оформление заказа
            </h1>
            <p className="text-body text-gray-300">
              Заполните данные для доставки и оплаты
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Форма заказа */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmitOrder} className="space-y-8">
                {/* Данные клиента */}
                <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
                  <h2 className="text-heading text-gray-900 mb-6">Контактные данные</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Имя <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={customerData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ваше имя"
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Телефон <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={customerData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>

                    <div className="mb-4 md:col-span-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={customerData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Способ получения */}
                <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
                  <h2 className="text-heading text-gray-900 mb-6">Способ получения</h2>
                  
                  <div className="space-y-4 mb-6">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        value="pickup"
                        checked={deliveryMethod === 'pickup'}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Самовывоз</div>
                        <div className="text-sm text-gray-600">Бесплатно • Ижевск, ул. Примерная, 123</div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        value="delivery"
                        checked={deliveryMethod === 'delivery'}
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Доставка курьером</div>
                        <div className="text-sm text-gray-600">300 ₽ • По городу Ижевск</div>
                      </div>
                    </label>
                  </div>

                  {deliveryMethod === 'delivery' && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-4">
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                            Город <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={customerData.city}
                            onChange={handleInputChange}
                            required={deliveryMethod === 'delivery'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ижевск"
                          />
                        </div>

                        <div className="mb-4">
                          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                            Индекс
                          </label>
                          <input
                            type="text"
                            id="postalCode"
                            name="postalCode"
                            value={customerData.postalCode}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="426000"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                          Адрес доставки <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="address"
                          name="address"
                          value={customerData.address}
                          onChange={handleInputChange}
                          required={deliveryMethod === 'delivery'}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Улица, дом, квартира"
                        ></textarea>
                      </div>
                    </div>
                  )}
                </div>

                {/* Способ оплаты */}
                <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
                  <h2 className="text-heading text-gray-900 mb-6">Способ оплаты</h2>
                  
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Онлайн оплата</div>
                        <div className="text-sm text-gray-600">Банковской картой через безопасное соединение</div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900">Наличными</div>
                        <div className="text-sm text-gray-600">
                          {deliveryMethod === 'pickup' ? 'При получении' : 'Курьеру при доставке'}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Комментарий */}
                <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
                  <h2 className="text-heading text-gray-900 mb-6">Комментарий к заказу</h2>
                  
                  <div className="mb-4">
                    <textarea
                      id="notes"
                      name="notes"
                      value={customerData.notes}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Дополнительные пожелания к заказу..."
                    ></textarea>
                  </div>
                </div>
              </form>
            </div>

            {/* Сводка заказа */}
            <div className="lg:col-span-1">
              <div 
                ref={orderSummaryRef}
                className={`bg-white rounded-lg shadow-lg p-6 sticky top-24 z-30 animate-fade-in transition-all duration-500 ${
                  isSticky 
                    ? 'bg-white/98 backdrop-blur-lg border-2 border-blue-200/60 shadow-2xl scale-[1.02] ring-1 ring-blue-500/20' 
                    : 'bg-white/95 backdrop-blur-sm border-2 border-white/80 shadow-xl hover:shadow-2xl'
                }`}
              >
                <div className={`mb-6 transition-all duration-300 ${isSticky ? 'border-b border-blue-200 pb-3' : ''}`}>
                  <h2 className={`text-heading transition-all duration-300 ${
                    isSticky 
                      ? 'text-blue-900 text-xl font-bold flex items-center' 
                      : 'text-gray-900'
                  }`}>
                    {isSticky && (
                      <svg className="w-5 h-5 mr-2 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    )}
                    Ваш заказ
                  </h2>
                </div>
                
                {/* Товары */}
                <div className="space-y-4 mb-6">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center text-gray-600 text-sm font-medium">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} width={48} height={48} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          '👕'
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.size} • {item.color}</div>
                        <div className="text-sm text-blue-600">{item.price} ₽ × {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Итого */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Товары:</span>
                    <span className="text-gray-900">{totalPrice} ₽</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Доставка:</span>
                    <span className="text-gray-900">
                      {deliveryMethod === 'delivery' ? '300 ₽' : 'Бесплатно'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span className="text-gray-900">Итого:</span>
                    <span className="text-blue-600">{getFinalTotal()} ₽</span>
                  </div>
                </div>

                {/* Кнопка оформления */}
                <button
                  onClick={handleSubmitOrder}
                  disabled={loading}
                  className={`w-full mt-6 px-6 py-4 bg-blue-600 text-white font-medium rounded-lg transition-all duration-300 ${
                    loading 
                      ? 'opacity-50 cursor-not-allowed' 
                      : isSticky 
                        ? 'bg-blue-700 ring-2 ring-blue-500/30 ring-offset-2 ring-offset-white transform scale-105 hover:bg-blue-800' 
                        : 'hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Оформляем заказ...
                    </>
                  ) : (
                    <>
                      {paymentMethod === 'online' ? 'Перейти к оплате' : 'Оформить заказ'}
                      <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Нажимая кнопку, вы соглашаетесь с условиями обслуживания
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CartNotification />
    </div>
  );
}