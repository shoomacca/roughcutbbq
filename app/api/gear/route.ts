import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseQuery } from '@/lib/api';
import { gearQuery } from '@/lib/api-schemas';

export async function GET(req: Request) {
  const q = parseQuery(req.url, gearQuery);
  if (!q.ok) return q.res;
  const { category } = q.data;
  const limit = Math.min(parseInt(q.data.limit ?? '100', 10), 100);

  try {
    const supabase = getSupabase();
    let query = supabase.from('gear').select('*');
    if (category) query = query.eq('category', category);
    const { data, error } = await query.order('sort_order', { ascending: true }).limit(limit);
    if (error) throw error;
    return NextResponse.json({ gear: data ?? [] });
  } catch (error) {
    console.error('Gear fetch error:', error);
    return NextResponse.json({ gear: [] });
  }
}
