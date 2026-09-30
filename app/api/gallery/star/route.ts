import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;
  return verifyToken(sessionCookie.value);
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { postId } = await req.json();
    if (!postId) return NextResponse.json({ error: 'missing_post_id' }, { status: 400 });

    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from('post_stars')
      .select('post_id')
      .eq('user_id', user.userId)
      .eq('post_id', postId)
      .maybeSingle();

    let starred: boolean;
    if (existing) {
      await supabase.from('post_stars').delete().eq('user_id', user.userId).eq('post_id', postId);
      starred = false;
    } else {
      await supabase.from('post_stars').insert({ user_id: user.userId, post_id: postId });
      starred = true;
    }

    const { count } = await supabase
      .from('post_stars')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return NextResponse.json({ success: true, starred, starCount: count ?? 0 });
  } catch (error) {
    console.error('Star toggle error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
