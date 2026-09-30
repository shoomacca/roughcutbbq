import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { verifyToken, getAnonymousName } from '@/lib/auth';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;
  return verifyToken(sessionCookie.value);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');
  if (!postId) return NextResponse.json({ error: 'missing_post_id' }, { status: 400 });

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
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { postId, commentText } = await req.json();
    if (!postId || !commentText || !commentText.trim()) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: user.userId, comment_text: commentText.trim() })
      .select('id')
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      comment: {
        id: data.id,
        postId,
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
        authorName: getAnonymousName(user.userId),
      },
    });
  } catch (error) {
    console.error('Post comment error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
