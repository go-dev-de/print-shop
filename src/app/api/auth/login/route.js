import { NextResponse } from 'next/server';
import { validateCredentials } from '@/lib/userStore';
import { setSession } from '@/lib/session';
import { initSchemaIfNeeded, findUserByEmailYdb } from '@/lib/ydb/repo';
import { upsertCart, getCartByUser } from '@/lib/ydb/repo';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body || {};
    if (!email || !password) {
      return NextResponse.json({ error: 'Требуются email и пароль' }, { status: 400 });
    }
    
    // Try YDB first, fallback to memory store
    let user;
    try {
      await initSchemaIfNeeded();
      const crypto = await import('node:crypto');
      const hash = crypto.createHash('sha256').update(String(password)).digest('hex');
      const ydbUser = await findUserByEmailYdb(email);
      user = ydbUser && ydbUser.passwordHash === hash ? ydbUser : null;
    } catch (ydbError) {
      console.warn('YDB login failed, using memory store:', ydbError.message);
      user = null;
    }
    
    // Fallback to memory store if YDB failed or user not found
    if (!user) {
      user = validateCredentials(email, password);
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Неверные учетные данные' }, { status: 401 });
    }
    
    await setSession({ id: user.id, email: user.email, name: user.name, role: user.role });
    
    // Optional: merge guest cart from request body
    try {
      const guestItems = Array.isArray(body?.guestCart) ? body.guestCart : [];
      if (guestItems.length > 0) {
        try {
          const existing = await getCartByUser(user.id);
          const byId = new Map();
          if (existing?.items) {
            for (const it of existing.items) {
              const key = String(it.id ?? it.productId ?? JSON.stringify(it));
              byId.set(key, { ...it });
            }
          }
          for (const it of guestItems) {
            const key = String(it.id ?? it.productId ?? JSON.stringify(it));
            if (byId.has(key)) {
              const prev = byId.get(key);
              const qty = Number(prev.quantity || prev.qty || 1) + Number(it.quantity || it.qty || 1);
              byId.set(key, { ...prev, ...it, quantity: qty });
            } else {
              byId.set(key, { ...it });
            }
          }
          await upsertCart({ userId: user.id, items: Array.from(byId.values()) });
        } catch (cartError) {
          console.warn('Cart merge failed, skipping:', cartError.message);
        }
      }
    } catch {}
    return NextResponse.json({ user });
  } catch (e) {
    console.error('Login error:', e);
    const dev = process.env.NODE_ENV !== 'production';
    return NextResponse.json({ 
      error: 'Ошибка входа', 
      details: dev ? String(e?.stack || e?.message || e) : undefined 
    }, { status: 500 });
  }
}

