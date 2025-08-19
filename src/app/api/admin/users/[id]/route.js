import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateUserRole, listUsers, deleteUser } from '@/lib/userStore';
import { initSchemaIfNeeded, updateUserRoleYdb, listUsersYdb, deleteUserYdb } from '@/lib/ydb/repo';

export async function PATCH(request, { params }) {
  // Await params to fix Next.js warning
  const { id } = await params;
  
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { role } = body || {};
    if (!role) return NextResponse.json({ error: 'Role required' }, { status: 400 });
    await initSchemaIfNeeded();
    await updateUserRoleYdb(id, role);
    const users = await listUsersYdb();
    const updated = users.find((u) => u.id === id) || null;
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ user: updated, users });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  // Await params to fix Next.js warning
  const { id } = await params;
  
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    console.log('🗑️ Admin deleting user:', id);
    console.log('👤 Current admin user:', user.email, user.role);
    
    await initSchemaIfNeeded();
    
    // Пытаемся удалить из YDB
    try {
      await deleteUserYdb(id);
      console.log('✅ User deleted from YDB');
    } catch (ydbError) {
      console.warn('⚠️ YDB delete failed, falling back to in-memory:', ydbError.message);
      // Fallback к in-memory
      const deletedUser = deleteUser(id);
      if (!deletedUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }
    
    // Получаем обновленный список пользователей
    let users = [];
    try {
      users = await listUsersYdb();
    } catch (e) {
      console.warn('⚠️ YDB list failed, using in-memory:', e.message);
      users = listUsers();
    }
    
    return NextResponse.json({ 
      message: 'User deleted successfully', 
      users 
    });
  } catch (e) {
    console.error('❌ Delete user error:', e);
    return NextResponse.json({ 
      error: e.message || 'Failed to delete user' 
    }, { status: 400 });
  }
}

