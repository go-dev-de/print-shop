'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    const amountParam = searchParams.get('amount');
    
    if (!orderIdParam || !amountParam) {
      router.push('/');
      return;
    }
    
    setOrderId(orderIdParam);
    setAmount(parseFloat(amountParam));
  }, [searchParams, router]);

  const handlePayment = async (method) => {
    setLoading(true);
    
    try {
      // Имитация обработки платежа
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // В реальном приложении здесь был бы вызов платежного API
      console.log(`Processing payment: ${method}, Order: ${orderId}, Amount: ${amount}`);
      
      // Перенаправляем на страницу подтверждения
      router.push(`/order-confirmation?orderId=${orderId}&paid=true`);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ошибка при обработке платежа');
    } finally {
      setLoading(false);
    }
  };

  if (!orderId || !amount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-lg shadow-lg">
        <div className="container">
          <div className="flex justify-center items-center py-4 lg:py-6">
            <Link href="/">
              <Image
                src="/logo-pr-style.png"
                alt="PrintStyle Logo"
                width={150}
                height={40}
                className="hidden lg:block"
              />
              <h1 className="text-heading text-gray-900">
                Print<span className="text-blue-600">Style</span>
              </h1>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-hero text-gray-900 mb-6">
              Оплата заказа
            </h1>
            <p className="text-body text-gray-600">
              Заказ #{orderId}
            </p>
          </div>

          {/* Payment Card */}
          <div className="card card-lg animate-fade-in">
            {/* Order Summary */}
            <div className="text-center mb-8">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {amount} ₽
              </div>
              <p className="text-gray-600">К оплате</p>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4">
              <h2 className="text-heading text-gray-900 mb-6 text-center">
                Выберите способ оплаты
              </h2>

              {/* Bank Card */}
              <button
                onClick={() => handlePayment('card')}
                disabled={loading}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Банковской картой</div>
                    <div className="text-sm text-gray-600">Visa, MasterCard, МИР</div>
                  </div>
                </div>
              </button>

              {/* YooMoney */}
              <button
                onClick={() => handlePayment('yoomoney')}
                disabled={loading}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">ЮMoney</div>
                    <div className="text-sm text-gray-600">Электронный кошелек</div>
                  </div>
                </div>
              </button>

              {/* SBP */}
              <button
                onClick={() => handlePayment('sbp')}
                disabled={loading}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Система быстрых платежей</div>
                    <div className="text-sm text-gray-600">Оплата по QR-коду</div>
                  </div>
                </div>
              </button>
            </div>

            {loading && (
              <div className="mt-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Обрабатываем платеж...</p>
              </div>
            )}

            {/* Security Note */}
            <div className="mt-8 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm text-green-800 font-medium">Безопасная оплата</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Все платежи защищены SSL-шифрованием
              </p>
            </div>

            {/* Back Button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => router.back()}
                disabled={loading}
                className="btn btn-outline btn-md"
              >
                ← Вернуться к заказу
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentForm />
    </Suspense>
  );
}