import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseBody, requireUser } from '@/lib/api';
import { SYNC_MAX_BODY_BYTES, syncBody, syncItem } from '@/lib/api-schemas';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { user } = auth;
  const parsed = await parseBody(req, syncBody, { maxBytes: SYNC_MAX_BODY_BYTES });
  if (!parsed.ok) return parsed.res;

  try {
    // Invalid items are dropped (as before), not rejected.
    const rows = parsed.data.cooks
      .flatMap((c) => {
        const r = syncItem.safeParse(c);
        return r.success ? [r.data as Record<string, unknown> & { method: string; cutName: string; weightKg: number; categoryName?: string }] : [];
      })
      .map((cook) => ({
        user_id: user.userId,
        method: cook.method,
        meat_category: cook.categoryName || '',
        cut: cook.cutName,
        weight_kg: cook.weightKg,
        result_json: JSON.stringify(cook),
      }));

    if (rows.length) {
      const supabase = getSupabase();
      const { error } = await supabase.from('saved_cooks').insert(rows);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync cooks error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
