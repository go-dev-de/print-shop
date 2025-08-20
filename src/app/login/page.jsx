'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка входа');
      } else {
        // Очищаем флаг выхода при успешном входе
        sessionStorage.removeItem('user_logged_out');
        
        // Redirect to original destination or appropriate default
        const returnTo = searchParams?.get('returnTo');
        if (returnTo) {
          router.push(returnTo);
        } else if (data.user?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (e) {
      setError('Сетевая ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800 p-4">
      <div className="bg-gray-700 w-full max-w-md rounded-xl shadow-xl border border-gray-600 p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Вход</h1>
          <p className="text-gray-300 text-sm">Войдите в свой аккаунт</p>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Email</label>
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              className="w-full border-2 border-gray-500 rounded-lg px-4 py-3 text-white bg-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200" 
              placeholder="Введите ваш email"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Пароль</label>
            <input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              type="password" 
              className="w-full border-2 border-gray-500 rounded-lg px-4 py-3 text-white bg-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200" 
              placeholder="Введите пароль"
              required 
            />
          </div>
          <button 
            disabled={loading} 
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-700 transition-all duration-200 text-base"
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
        
        <div className="text-center">
          <div className="text-sm text-gray-400">
            Нет аккаунта? <Link className="text-blue-400 hover:text-blue-300 hover:underline font-medium" href="/register">Зарегистрироваться</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
