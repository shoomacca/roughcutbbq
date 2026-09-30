import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { errorResponse, parseQuery } from '@/lib/api';
import { unsubscribeQuery } from '@/lib/api-schemas';

export async function GET(req: Request) {
  const q = parseQuery(req.url, unsubscribeQuery);
  if (!q.ok) return errorResponse(400, 'missing_token');
  const { token } = q.data;

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
