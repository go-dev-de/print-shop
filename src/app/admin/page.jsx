import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AdminPanel from '@/components/AdminPanel';

export default async function AdminPage() {
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    redirect('/login?returnTo=/admin');
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

