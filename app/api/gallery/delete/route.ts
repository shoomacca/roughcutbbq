import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/auth';

export async function DELETE(req: Request) {
  // Admin-only: require a valid httpOnly admin_token cookie (set by /api/admin/login)
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 });

  try {
    const supabase = getSupabase();

    const { data: post } = await supabase
      .from('gallery_posts')
      .select('before_url, after_url')
      .eq('id', postId)
      .maybeSingle();

    if (post) {
      const objects = [post.before_url, post.after_url]
        .map((url: string) => url.split('/object/public/gallery/')[1])
        .filter(Boolean);
      if (objects.length) {
        await supabase.storage.from('gallery').remove(objects);
      }
    }

    const { error } = await supabase.from('gallery_posts').delete().eq('id', postId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Gallery delete error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
