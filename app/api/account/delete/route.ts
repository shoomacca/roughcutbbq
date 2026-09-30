import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(sessionCookie.value);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'invalid_session' }, { status: 401 });
    }

    const supabase = getSupabase();
    
    // Delete user from Database. Cascading FKs will delete related records.
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', decoded.userId);

    if (error) {
      console.error('Database deletion error:', error);
      throw error;
    }

    // Clear session cookie
    cookieStore.delete('session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
