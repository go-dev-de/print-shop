import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getOrderById, updateOrderStatus, deleteOrder } from '@/lib/orderStore';
import { initSchemaIfNeeded, getOrderByIdYdb, updateOrderStatusYdb, deleteOrderYdb } from '@/lib/ydb/repo';

export async function GET(_req, { params }) {
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await initSchemaIfNeeded();
  const order = await getOrderByIdYdb(params.id);
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(request, { params }) {
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { status } = body || {};
    if (!status) return NextResponse.json({ error: 'Status required' }, { status: 400 });
    await initSchemaIfNeeded();
    await updateOrderStatusYdb(params.id, status);
    const updated = await getOrderByIdYdb(params.id);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ order: updated });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await initSchemaIfNeeded();
  await deleteOrderYdb(params.id);
  const ok = true;
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

