import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'missing_token' }, { status: 400 });

  try {
    const supabase = getSupabase();
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('id, unsubscribed_at')
      .eq('unsubscribe_token', token)
      .maybeSingle();

    if (!subscriber) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    if (!subscriber.unsubscribed_at) {
      await supabase
        .from('subscribers')
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq('unsubscribe_token', token);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
