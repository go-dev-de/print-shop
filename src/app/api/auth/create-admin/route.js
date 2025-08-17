import { NextResponse } from 'next/server';
import { addUser, findUserByEmail, listUsers } from '@/lib/userStore';
import { initSchemaIfNeeded, createUserYdb, listUsersYdb } from '@/lib/ydb/repo';

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if any admin already exists
    let existingUsers = [];
    try {
      await initSchemaIfNeeded();
      existingUsers = await listUsersYdb();
    } catch (ydbError) {
      console.warn('YDB failed, using memory store:', ydbError.message);
      existingUsers = listUsers();
    }

    const hasAdmin = existingUsers.some(user => user.role === 'admin');
    if (hasAdmin) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 409 });
    }

    // Check if user with this email exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Create admin user
    const adminUser = {
      email,
      password,
      name: name || 'Admin',
      role: 'admin'
    };

    try {
      await createUserYdb(adminUser);
    } catch (ydbError) {
      console.warn('YDB user creation failed, using memory store:', ydbError.message);
      addUser(adminUser);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Admin created successfully',
      admin: { email, name: adminUser.name, role: 'admin' }
    });

  } catch (error) {
    console.error('Admin creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create admin',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    }, { status: 500 });
  }
}