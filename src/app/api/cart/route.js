import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { upsertCart, getCartByUser } from '@/lib/ydb/repo';
import { initSchemaIfNeeded } from '@/lib/ydb/repo';

export const runtime = 'nodejs';

export async function GET() {
  await initSchemaIfNeeded();
  const user = await getSession();
  if (!user) return NextResponse.json({ cart: null });
  const cart = await getCartByUser(user.id);
  return NextResponse.json({ cart });
}

export async function POST(request) {
  await initSchemaIfNeeded();
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { items, id } = await request.json();
  const incoming = Array.isArray(items) ? items : [];
  const existing = await getCartByUser(user.id);
  let merged = incoming;
  if (existing && Array.isArray(existing.items)) {
    const byId = new Map();
    for (const it of existing.items) {
      if (!it || typeof it !== 'object') continue;
      const key = String(it.id ?? it.productId ?? JSON.stringify(it));
      byId.set(key, { ...it });
    }
    for (const it of incoming) {
      if (!it || typeof it !== 'object') continue;
      const key = String(it.id ?? it.productId ?? JSON.stringify(it));
      if (byId.has(key)) {
        const prev = byId.get(key);
        const qty = Number(prev.quantity || prev.qty || 1) + Number(it.quantity || it.qty || 1);
        byId.set(key, { ...prev, ...it, quantity: qty });
      } else {
        byId.set(key, { ...it });
      }
    }
    merged = Array.from(byId.values());
  }
  const cart = await upsertCart({ id, userId: user.id, items: merged });
  return NextResponse.json({ cart });
}

