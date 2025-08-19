import { NextResponse } from 'next/server';
import { addUser, findUserByEmail } from '@/lib/userStore';
import { setSession } from '@/lib/session';
import { initSchemaIfNeeded, createUser, findUserByEmailYdb } from '@/lib/ydb/repo';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name } = body || {};
    if (!email || !password) {
      return NextResponse.json({ error: 'Требуются email и пароль' }, { status: 400 });
    }
    // Try YDB first, fallback to memory store
    let existing;
    try {
      await initSchemaIfNeeded();
      existing = await findUserByEmailYdb(email);
    } catch (ydbError) {
      console.warn('YDB check failed, using memory store:', ydbError.message);
      existing = findUserByEmail(email);
    }
    if (existing) {
      return NextResponse.json({ error: 'Пользователь уже существует' }, { status: 409 });
    }
    // Create user (try YDB first, fallback to memory)
    const crypto = await import('node:crypto');
    const passwordHash = crypto.createHash('sha256').update(String(password)).digest('hex');
    
    let user;
    try {
      user = await createUser({ 
        email, 
        name, 
        passwordHash, 
        role: 'user', 
        avatar: '1' // Дефолтная аватарка под номером 1
      });
    } catch (ydbError) {
      console.warn('YDB create failed, using memory store:', ydbError.message);
      user = addUser({ email, name, password, role: 'user' });
    }
    
    await setSession({ id: user.id, email: user.email, name: user.name, role: user.role });
    return NextResponse.json({ user });
  } catch (e) {
    console.error('Register error:', e);
    const dev = process.env.NODE_ENV !== 'production';
    return NextResponse.json({ 
      error: 'Ошибка регистрации', 
      details: dev ? String(e?.stack || e?.message || e) : undefined
    }, { status: 500 });
  }
}

