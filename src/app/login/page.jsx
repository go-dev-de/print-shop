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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">Вход</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
            <input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              className="w-full border-2 border-gray-400 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none" 
              placeholder="Введите ваш email"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Пароль</label>
            <input 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              type="password" 
              className="w-full border-2 border-gray-400 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:outline-none" 
              placeholder="Введите пароль"
              required 
            />
          </div>
          <button 
            disabled={loading} 
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
        <div className="text-sm text-gray-700">
          Нет аккаунта? <Link className="text-blue-600 hover:underline" href="/register">Зарегистрироваться</Link>
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
