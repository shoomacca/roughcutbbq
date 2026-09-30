import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { requireUser } from '@/lib/api';

export async function POST() {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;

  try {
    const supabase = getSupabase();

    // Delete user from Database. Cascading FKs will delete related records.
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', auth.user.userId);

    if (error) {
      console.error('Database deletion error:', error);
      throw error;
    }

    // Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete('session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
