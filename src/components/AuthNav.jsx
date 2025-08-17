'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthNav() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const onLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (res.ok) {
        setUser(null);
        // Immediately reload user state to confirm logout
        await loadUser();
        // Force page reload to clear all state and redirect
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) return null;

  return (
    <div className="flex items-center space-x-4">
      {user ? (
        <>
          <span className="text-gray-800">{user.name || user.email}</span>
          {user.role === 'admin' && (
            <Link className="text-blue-600 hover:underline" href="/admin">Админ</Link>
          )}
          <button onClick={onLogout} className="text-red-600 hover:underline">Выйти</button>
        </>
      ) : (
        <>
          <Link className="text-blue-600 hover:underline" href="/login">Войти</Link>
          <Link className="text-blue-600 hover:underline" href="/register">Регистрация</Link>
        </>
      )}
    </div>
  );
}

