'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';

function OrderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  });
  const [orderData, setOrderData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Константы цен
  const BASE_TSHIRT_PRICE = 700
  const PRINT_SIZES = [
    { label: '10×15 см', price: 390 },
    { label: '15×21 см', price: 590 },
    { label: '21×30 см', price: 740 },
    { label: '30×42 см', price: 940 },
  ];

  useEffect(() => {
    // Получаем данные заказа из localStorage или URL параметров
    const savedOrder = localStorage.getItem('printShopOrder');
    if (savedOrder) {
      setOrderData(JSON.parse(savedOrder));
    } else {
      // Если нет данных заказа, перенаправляем на главную
      router.push('/');
    }
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const merchandiseSubtotal = calculateMerchSubtotal();
      const shippingCost = calculateShipping(merchandiseSubtotal);
      const orderTotal = merchandiseSubtotal + shippingCost;

      const completeOrder = {
        ...orderData,
        customerInfo: formData,
        orderDate: new Date().toISOString(),
        pricing: {
          baseTshirtPrice: BASE_TSHIRT_PRICE,
          printPricePerUnit: getPrintPricePerUnit(),
          quantity: orderData.quantity,
          merchandiseSubtotal,
          shippingCost,
          orderTotal,
        },
      };

      // Отправляем заказ на сервер
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeOrder),
      });

      const result = await response.json();

      if (result.success) {
        // Очищаем данные заказа
        localStorage.removeItem('printShopOrder');

        // Показываем успешное сообщение
        alert(`Заказ успешно оформлен! Номер заказа: ${result.orderId}. Мы свяжемся с вами в ближайшее время.`);
        
        // Перенаправляем на главную страницу
        router.push('/');
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Ошибка при оформлении заказа:', error);
      alert('Произошла ошибка при оформлении заказа. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrintPricePerUnit = () => {
    if (!orderData?.image) return 0;
    if (orderData?.printSizeIndex != null && PRINT_SIZES[orderData.printSizeIndex]) {
      return PRINT_SIZES[orderData.printSizeIndex].price;
    }
    if (typeof orderData?.printPricePerUnit === 'number') {
      return orderData.printPricePerUnit;
    }
    return 0;
  };

  const calculateMerchSubtotal = () => {
    if (!orderData) return 0;
    const printPrice = getPrintPricePerUnit();
    return (BASE_TSHIRT_PRICE + printPrice) * orderData.quantity;
  };

  const calculateShipping = (subtotal) => {
    return subtotal >= 3000 ? 0 : 500;
  };

  const calculateTotal = () => {
    const subtotal = calculateMerchSubtotal();
    return subtotal + calculateShipping(subtotal);
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800">Загрузка данных заказа...</p>
        </div>
      </div>
    );
  }

  // Предварительные вычисления для отображения
  const merchandiseSubtotal = calculateMerchSubtotal();
  const shippingCost = calculateShipping(merchandiseSubtotal);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <main className="max-w-sm mx-auto px-4 sm:max-w-7xl sm:px-6 lg:px-8 py-6 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Левая колонка - Форма заказа */}
          <div>
                        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5">
              <h2 className="text-lg font-semibold mb-3 text-black">Контактная информация</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Имя *
                    </label>
                    <input
                      type="text"
                      id="customer-name"
                      name="name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="customer-email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customer-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон *
                  </label>
                  <input
                    type="tel"
                    id="customer-phone"
                    name="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="customer-address" className="block text-sm font-medium text-gray-700 mb-1">
                    Адрес доставки *
                  </label>
                  <input
                    type="text"
                    id="customer-address"
                    name="address"
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customer-city" className="block text-sm font-medium text-gray-700 mb-1">
                      Город *
                    </label>
                    <input
                      type="text"
                      id="customer-city"
                      name="city"
                      autoComplete="address-level2"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="customer-postal" className="block text-sm font-medium text-gray-700 mb-1">
                      Индекс
                    </label>
                    <input
                      type="text"
                      id="customer-postal"
                      name="postalCode"
                      autoComplete="postal-code"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customer-notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Дополнительные пожелания
                  </label>
                  <textarea
                    id="customer-notes"
                    name="notes"
                    autoComplete="off"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                    placeholder="Особые требования к доставке или другие пожелания..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSubmitting ? 'Оформление заказа...' : 'Подтвердить заказ'}
                </button>
              </form>
            </div>
          </div>

          {/* Правая колонка - Детали заказа */}
          <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5">
              <h2 className="text-lg font-semibold mb-3 text-black">Детали заказа</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                    {orderData.image && (
                      <Image
                        src={orderData.image}
                        alt="Design preview"
                        fill
                        className="object-contain"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                                         <h3 className="font-medium text-black">Футболка с принтом</h3>
                    <p className="text-sm text-gray-800">
                      Размер: {orderData.size} | Цвет: {orderData.color}
                    </p>
                    <p className="text-sm text-gray-800">
                      Количество: {orderData.quantity} шт.
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-black">Футболка:</span>
                    <span className="text-black">{BASE_TSHIRT_PRICE} ₽ × {orderData.quantity}</span>
                  </div>
                  {orderData.image && (
                    <div className="flex justify-between">
                      <span className="text-black">Принт:</span>
                      <span className="text-black">{getPrintPricePerUnit()} ₽ × {orderData.quantity}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-black">Доставка:</span>
                    <span className="text-black">{shippingCost === 0 ? 'Бесплатно' : `${shippingCost} ₽`}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold text-black">
                       <span>Итого:</span>
                       <span>{calculateTotal()} ₽</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                             <h3 className="font-semibold text-black mb-2">Информация о доставке</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Срок изготовления: 3-5 рабочих дней</li>
                <li>• Доставка по России: 2-7 дней</li>
                <li>• Бесплатная доставка при заказе от 3000 ₽</li>
                <li>• Оплата при получении</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                             <h3 className="font-semibold text-black mb-2">Гарантии качества</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• 100% хлопок премиум качества</li>
                <li>• Стойкие принты, не выцветают</li>
                <li>• Возврат в течение 14 дней</li>
                <li>• Поддержка 24/7</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800">Загрузка...</p>
        </div>
      </div>
    }>
      <OrderPageContent />
    </Suspense>
  );
}