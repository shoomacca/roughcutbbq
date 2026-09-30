import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseBody, parseQuery, requireAdmin } from '@/lib/api';
import { gearCreateBody, gearDeleteQuery, gearUpdateBody } from '@/lib/api-schemas';

const FIELDS = ['slug', 'name', 'category', 'description', 'affiliate_url', 'recommended_for', 'sort_order'] as const;

function pickFields(body: object) {
  const src = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of FIELDS) {
    if (src[f] !== undefined) out[f] = src[f];
  }
  return out;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;
  const parsed = await parseBody(req, gearCreateBody);
  if (!parsed.ok) return parsed.res;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('gear').insert(pickFields(parsed.data)).select('*').single();
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'slug_exists' }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    console.error('Admin gear create error:', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;
  const parsed = await parseBody(req, gearUpdateBody);
  if (!parsed.ok) return parsed.res;
  const body = parsed.data;
  try {
    const updates = pickFields(body);
    delete updates.slug; // slugs are permanent — they're the public /go/ URLs
    const supabase = getSupabase();
    const { data, error } = await supabase.from('gear').update(updates).eq('id', Number(body.id)).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    console.error('Admin gear update error:', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;
  const parsed = parseQuery(req.url, gearDeleteQuery);
  if (!parsed.ok) return parsed.res;
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('gear').delete().eq('id', Number(parsed.data.id));
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin gear delete error:', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
