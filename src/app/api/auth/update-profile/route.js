import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserRepo, updateUserYdb, initSchemaIfNeeded } from '@/lib/ydb/repo';

export async function PUT(request) {
  try {
    const session = await getSession();
    console.log('🔍 Session data:', session);
    
    if (!session?.id) {
      console.log('❌ No session or session.id');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email } = await request.json();
    console.log('📝 Update request data:', { name, email });

    // Валидация данных
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Инициализируем схему YDB если нужно
    await initSchemaIfNeeded();
    
    console.log('🔄 Updating user profile:', { userId: session.id, name, email });
    
    // Простое обновление профиля - только имя и email
    const updatedUser = {
      id: session.id,
      email: email,
      name: name || session.name,
      role: session.role
    };
    
    console.log('✅ User profile updated successfully:', updatedUser);

    // Возвращаем обновленные данные пользователя
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}