import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { verifyToken, getAnonymousName } from '@/lib/auth';

interface GalleryRow {
  id: string;
  before_url: string;
  after_url: string;
  name: string | null;
  cut: string;
  method: string;
  gear_used: string | null;
  report_count: number;
  reported: boolean;
  created_at: string;
  user_id: number | null;
  star_count: number | null;
  comment_count: number | null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const method = searchParams.get('method');
  const cut = searchParams.get('cut');
  const flagged = searchParams.get('flagged') === 'true';

  try {
    const supabase = getSupabase();
    let query = supabase.from('gallery_with_counts').select('*');

    if (flagged) {
      query = query.gt('report_count', 0).order('report_count', { ascending: false }).limit(100);
    } else {
      query = query.eq('reported', false);
      if (method) query = query.eq('method', method);
      if (cut) query = query.eq('cut', cut);
      query = query.order('created_at', { ascending: false }).limit(50);
    }

    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as GalleryRow[];

    // Which posts has the current user starred?
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    const starredSet = new Set<string>();
    if (sessionCookie) {
      const user = verifyToken(sessionCookie.value);
      if (user) {
        const { data: starred } = await supabase
          .from('post_stars')
          .select('post_id')
          .eq('user_id', user.userId);
        (starred ?? []).forEach((r) => starredSet.add(r.post_id));
      }
    }

    const posts = rows.map((row) => ({
      id: row.id,
      before_url: row.before_url,
      after_url: row.after_url,
      name: row.user_id ? getAnonymousName(row.user_id) : (row.name || 'Anonymous Pitmaster'),
      cut: row.cut,
      method: row.method,
      gear_used: row.gear_used,
      report_count: row.report_count,
      created_at: row.created_at,
      star_count: Number(row.star_count ?? 0),
      comment_count: Number(row.comment_count ?? 0),
      has_starred: starredSet.has(row.id),
    }));

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Gallery fetch error:', error);
    // Degrade gracefully — an empty gallery beats a broken page
    return NextResponse.json({ posts: [] });
  }
}
