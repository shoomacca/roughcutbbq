import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.from('cook_tally').select('count').eq('id', 1).maybeSingle();
    return NextResponse.json({ count: Number(data?.count ?? 0) });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

export async function POST() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('increment_cook_tally');
    if (error) throw error;
    return NextResponse.json({ count: Number(data ?? 0) });
  } catch (error) {
    console.error('Tally error:', error);
    return NextResponse.json({ count: 0 });
  }
}
