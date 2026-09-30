import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 100);

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
