'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPanel from '@/components/AdminPanel';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        console.log('🔍 Checking admin auth...');
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        console.log('📡 Auth response status:', response.status);
        
        const data = await response.json();
        console.log('👤 Auth data:', data);
        
        if (!response.ok || !data.user) {
          console.log('❌ No user found, redirecting to login');
          router.push('/login?returnTo=/admin');
          return;
        }
        
        if (data.user.role !== 'admin') {
          console.log('❌ User role is not admin:', data.user.role);
          alert(`Access denied. Your role: ${data.user.role}. Required: admin`);
          router.push('/login?returnTo=/admin');
          return;
        }
        
        console.log('✅ Admin access granted');
        setUser(data.user);
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        router.push('/login?returnTo=/admin');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // redirect is happening
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Админ панель</h1>
        <p className="text-gray-700 mb-6">Добро пожаловать, {user.name || user.email}</p>
        <AdminPanel />
      </div>
    </div>
  );
}

