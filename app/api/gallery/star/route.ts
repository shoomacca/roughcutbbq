import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseBody, requireUser } from '@/lib/api';
import { postIdBody } from '@/lib/api-schemas';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { user } = auth;
  const parsed = await parseBody(req, postIdBody);
  if (!parsed.ok) return parsed.res;
  const { postId } = parsed.data;

  try {
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
