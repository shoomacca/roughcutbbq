import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 });

  try {
    const supabase = getSupabase();
    const { data: post } = await supabase
      .from('gallery_posts')
      .select('report_count')
      .eq('id', postId)
      .maybeSingle();
    if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const newCount = (post.report_count ?? 0) + 1;
    const { error } = await supabase
      .from('gallery_posts')
      .update({ report_count: newCount, reported: newCount >= 3 })
      .eq('id', postId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
