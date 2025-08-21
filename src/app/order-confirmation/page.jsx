'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function OrderConfirmationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    const paidParam = searchParams.get('paid');
    
    if (!orderIdParam) {
      router.push('/');
      return;
    }
    
    setOrderId(orderIdParam);
    setIsPaid(paidParam === 'true');
  }, [searchParams, router]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="shadow-lg" style={{backgroundColor: '#424242'}}>
        <div className="container">
          <div className="flex justify-center items-center py-1">
            <h1 className="text-heading text-white h-full flex items-center">
              <Link href="/" className="hover:text-blue-600 transition-all duration-300 h-full flex items-center">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <div className="card card-lg text-center animate-fade-in">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Message */}
            <h1 className="text-hero text-gray-900 mb-4">
              {isPaid ? 'Заказ оплачен!' : 'Заказ оформлен!'}
            </h1>
            
            <p className="text-body text-gray-600 mb-8">
              {isPaid 
                ? 'Ваш заказ успешно оплачен и принят в обработку'
                : 'Ваш заказ принят и ожидает обработки'
              }
            </p>

            {/* Order Info */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-body text-gray-600">Номер заказа:</span>
                <span className="text-subheading text-gray-900 font-mono">#{orderId}</span>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-body text-gray-600">Статус:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isPaid 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isPaid ? 'Оплачен' : 'Ожидает оплаты'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-body text-gray-600">Дата создания:</span>
                <span className="text-body text-gray-900">
                  {new Date().toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Next Steps */}
            <div className="text-left mb-8">
              <h2 className="text-heading text-gray-900 mb-4">Что дальше?</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">1</span>
                  </div>
                  <p className="text-body text-gray-600">
                    Мы обработаем ваш заказ в течение 24 часов
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">2</span>
                  </div>
                  <p className="text-body text-gray-600">
                    Изготовление займет 1-3 рабочих дня
                  </p>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">3</span>
                  </div>
                  <p className="text-body text-gray-600">
                    Мы уведомим вас о готовности заказа
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-subheading text-gray-900 mb-3">Есть вопросы?</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-blue-800">+7 (999) 123-45-67</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-blue-800">зайчикГэнг@yandex.ru</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => router.push('/products')}
                className="btn btn-primary btn-lg w-full"
              >
                Продолжить покупки
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="btn btn-outline btn-lg w-full"
              >
                На главную
              </button>
            </div>

            {/* Social Share */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                Поделитесь с друзьями:
              </p>
              <div className="flex justify-center space-x-4">
                <button className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                
                <button className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
                
                <button className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderConfirmationForm />
    </Suspense>
  );
}