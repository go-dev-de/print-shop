import { getSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const session = await getSession();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ps_session');
    
    return Response.json({
      hasSession: !!session,
      sessionData: session,
      hasCookie: !!sessionCookie,
      cookieValue: sessionCookie?.value || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}