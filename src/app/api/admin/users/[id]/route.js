import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateUserRole, listUsers } from '@/lib/userStore';
import { initSchemaIfNeeded, updateUserRoleYdb, listUsersYdb } from '@/lib/ydb/repo';

export async function PATCH(request, { params }) {
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { role } = body || {};
    if (!role) return NextResponse.json({ error: 'Role required' }, { status: 400 });
    await initSchemaIfNeeded();
    await updateUserRoleYdb(params.id, role);
    const users = await listUsersYdb();
    const updated = users.find((u) => u.id === params.id) || null;
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ user: updated, users });
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

