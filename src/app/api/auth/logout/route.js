import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Агрессивно удаляем куки всеми способами
    const cookieName = 'ps_session';
    
    // Способ 1: delete
    try {
      cookieStore.delete(cookieName);
      console.log('Cookie deleted via delete()');
    } catch (e) {
      console.log('Delete failed:', e.message);
    }
    
    // Способ 2: set с истекшим временем
    try {
      cookieStore.set({
        name: cookieName,
        value: '',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 0,
        expires: new Date(0),
      });
      console.log('Cookie cleared via set()');
    } catch (e) {
      console.log('Set failed:', e.message);
    }
    
    // Способ 3: попробуем разные пути
    const paths = ['/', '/api', '/auth'];
    for (const path of paths) {
      try {
        cookieStore.set({
          name: cookieName,
          value: '',
          path: path,
          maxAge: 0,
          expires: new Date(0),
        });
      } catch (e) {
        // ignore
      }
    }
    
    console.log('All logout methods attempted');
    
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Дополнительно очищаем куки в response headers
    response.cookies.set({
      name: cookieName,
      value: '',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      expires: new Date(0),
    });
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}

