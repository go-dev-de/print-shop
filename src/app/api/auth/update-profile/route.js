import { getSession } from '@/lib/session';
import { getUserRepo, updateUserYdb, initSchemaIfNeeded } from '@/lib/ydb/repo';
import { updateUser } from '@/lib/userStore';

export async function PUT(request) {
  try {
    const session = await getSession();
    
    if (!session?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, avatar } = await request.json();

    // Валидация данных
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Инициализируем схему YDB если нужно
    await initSchemaIfNeeded();
    
    // Обновляем профиль пользователя
    let updatedUser = await updateUserYdb(session.id, {
      name: name || '',
      email,
      avatar: avatar || ''
    });

    if (!updatedUser) {
      // Fallback к in-memory хранилищу
      try {
        updatedUser = updateUser(session.id, {
          name: name || '',
          email,
          avatar: avatar || ''
        });
      } catch (memError) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
    }

    if (!updatedUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Возвращаем обновленные данные пользователя
    return Response.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      role: updatedUser.role
    });

  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}