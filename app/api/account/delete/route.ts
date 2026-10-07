import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { requireUser } from '@/lib/api';

export async function POST() {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;

  try {
    const supabase = getSupabase();

    // Gallery photos are public, so remove them with the account (user_id FK is SET NULL).
    // Stars/comments/reports on the posts cascade from the post delete.
    const { data: posts, error: postsError } = await supabase
      .from('gallery_posts')
      .select('id, before_url, after_url')
      .eq('user_id', auth.user.userId);
    if (postsError) throw postsError;

    if (posts?.length) {
      const objects = posts
        .flatMap((p: { before_url: string; after_url: string }) => [p.before_url, p.after_url])
        .map((url) => url.split('/object/public/gallery/')[1])
        .filter(Boolean);
      if (objects.length) {
        const { error: rmError } = await supabase.storage.from('gallery').remove(objects);
        // Log and continue: a storage hiccup must not block account deletion.
        if (rmError) console.error('Gallery storage removal error:', rmError);
      }
      const { error: postDelError } = await supabase
        .from('gallery_posts')
        .delete()
        .eq('user_id', auth.user.userId);
      if (postDelError) throw postDelError;
    }

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
