import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/auth';

const FIELDS = ['slug', 'name', 'category', 'description', 'affiliate_url', 'recommended_for', 'sort_order'] as const;

function pickFields(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of FIELDS) {
    if (body[f] !== undefined) out[f] = body[f];
  }
  return out;
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.slug || !body.name || !body.category || !body.affiliate_url) {
      return NextResponse.json({ error: 'slug, name, category and affiliate_url are required' }, { status: 400 });
    }
    const supabase = getSupabase();
    const { data, error } = await supabase.from('gear').insert(pickFields(body)).select('*').single();
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
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const updates = pickFields(body);
    delete updates.slug; // slugs are permanent — they're the public /go/ URLs
    const supabase = getSupabase();
    const { data, error } = await supabase.from('gear').update(updates).eq('id', body.id).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, item: data });
  } catch (e) {
    console.error('Admin gear update error:', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const supabase = getSupabase();
    const { error } = await supabase.from('gear').delete().eq('id', parseInt(id, 10));
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Admin gear delete error:', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
