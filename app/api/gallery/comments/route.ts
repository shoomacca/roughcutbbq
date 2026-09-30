import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getAnonymousName } from '@/lib/auth';
import { parseBody, parseQuery, requireUser } from '@/lib/api';
import { commentBody, commentsQuery } from '@/lib/api-schemas';

export async function GET(req: Request) {
  const q = parseQuery(req.url, commentsQuery);
  if (!q.ok) return q.res;
  const { postId } = q.data;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('post_comments')
      .select('id, post_id, user_id, comment_text, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const comments = (data ?? []).map((c) => ({
      id: c.id,
      postId: c.post_id,
      text: c.comment_text,
      createdAt: c.created_at,
      authorName: getAnonymousName(c.user_id),
    }));

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { user } = auth;
  const parsed = await parseBody(req, commentBody);
  if (!parsed.ok) return parsed.res;
  const { postId, commentText } = parsed.data;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: user.userId, comment_text: commentText })
      .select('id')
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      comment: {
        id: data.id,
        postId,
        text: commentText,
        createdAt: new Date().toISOString(),
        authorName: getAnonymousName(user.userId),
      },
    });
  } catch (error) {
    console.error('Post comment error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
