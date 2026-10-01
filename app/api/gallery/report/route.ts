import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getSupabase } from '@/lib/supabase';
import { cfg } from '@/lib/runtime-config';
import { optionalUser, parseBody } from '@/lib/api';
import { postIdBody } from '@/lib/api-schemas';

const HIDE_THRESHOLD = 3;

/** user id if logged in, else salted SHA-256 of client IP + user-agent. */
async function reporterKey(req: Request): Promise<string> {
  const user = await optionalUser();
  if (user) return `u:${user.userId}`;
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const ua = req.headers.get('user-agent') ?? '';
  const h = createHash('sha256').update(`${cfg('JWT_SECRET')}|${ip}|${ua}`).digest('hex');
  return `a:${h}`;
}

export async function POST(req: Request) {
  const parsed = await parseBody(req, postIdBody);
  if (!parsed.ok) return parsed.res;
  const { postId } = parsed.data;

  try {
    const supabase = getSupabase();
    const { data: post } = await supabase
      .from('gallery_posts')
      .select('id')
      .eq('id', postId)
      .maybeSingle();
    if (!post) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const { error: insErr } = await supabase
      .from('post_reports')
      .upsert(
        { post_id: postId, reporter_key: await reporterKey(req) },
        { onConflict: 'post_id,reporter_key', ignoreDuplicates: true }
      );
    if (insErr) throw insErr;

    const { count, error: cntErr } = await supabase
      .from('post_reports')
      .select('reporter_key', { count: 'exact', head: true })
      .eq('post_id', postId);
    if (cntErr) throw cntErr;

    const n = count ?? 0;
    const { error } = await supabase
      .from('gallery_posts')
      .update({ report_count: n, reported: n >= HIDE_THRESHOLD })
      .eq('id', postId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
