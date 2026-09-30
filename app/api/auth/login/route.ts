import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { verifyPassword, signToken } from '@/lib/auth';
import { parseBody } from '@/lib/api';
import { loginBody } from '@/lib/api-schemas';

export async function POST(req: Request) {
  try {
    const parsed = await parseBody(req, loginBody);
    if (!parsed.ok) return parsed.res;
    const { email, password } = parsed.data;

    const supabase = getSupabase();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email });
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({ success: true, user: { id: user.id, email } });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
