import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { hashPassword, signToken } from '@/lib/auth';
import { parseBody } from '@/lib/api';
import { signupBody } from '@/lib/api-schemas';

export async function POST(req: Request) {
  try {
    const parsed = await parseBody(req, signupBody);
    if (!parsed.ok) return parsed.res;
    const { email, password } = parsed.data;

    const supabase = getSupabase();
    const cleanEmail = email.toLowerCase();

    const { data: inserted, error } = await supabase
      .from('users')
      .insert({ email: cleanEmail, password_hash: hashPassword(password) })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'user_exists' }, { status: 409 });
      }
      throw error;
    }

    const userId = inserted.id as number;
    const token = signToken({ userId, email: cleanEmail });
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({ success: true, user: { id: userId, email: cleanEmail } });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
