import { NextResponse } from 'next/server';
import { listUsers } from '@/lib/userStore';
import { initSchemaIfNeeded, listUsersYdb } from '@/lib/ydb/repo';
import { getSession } from '@/lib/session';

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Get users from both YDB and memory store
  let ydbUsers = [];
  try {
    await initSchemaIfNeeded();
    ydbUsers = await listUsersYdb();
  } catch (error) {
    console.warn('YDB users fetch failed:', error.message);
  }
  
  const memoryUsers = listUsers();
  
  // Merge users, avoiding duplicates by email
  const usersByEmail = new Map();
  
  // Add memory users first
  memoryUsers.forEach(user => {
    usersByEmail.set(user.email, user);
  });
  
  // Add YDB users (will overwrite memory users if same email)
  ydbUsers.forEach(user => {
    usersByEmail.set(user.email, user);
  });
  
  const users = Array.from(usersByEmail.values());
  return NextResponse.json({ users });
}

