import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const user = verifyToken(sessionCookie.value);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { cooks } = await req.json();
    if (!cooks || !Array.isArray(cooks)) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const rows = cooks
      .filter((cook) => cook.method && cook.cutName && cook.weightKg)
      .map((cook) => ({
        user_id: user.userId,
        method: cook.method,
        meat_category: cook.categoryName || '',
        cut: cook.cutName,
        weight_kg: cook.weightKg,
        result_json: JSON.stringify(cook),
      }));

    if (rows.length) {
      const supabase = getSupabase();
      const { error } = await supabase.from('saved_cooks').insert(rows);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync cooks error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
