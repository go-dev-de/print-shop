import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateSectionYdb, deleteSectionYdb } from '@/lib/ydb/catalogRepo';
import { ensureTablesExist } from '@/lib/ydb/autoInit';

export async function PATCH(request, { params }) {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await ensureTablesExist();
    const patch = await request.json();
    const updated = await updateSectionYdb(params.id, patch);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ section: updated });
  } catch (error) {
    console.error('Failed to update section:', error);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(_req, { params }) {
  const user = await getSession();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await ensureTablesExist();
    await deleteSectionYdb(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete section:', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

