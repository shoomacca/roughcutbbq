import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { parseBody, parseQuery, requireUser } from '@/lib/api';
import { saveBody, saveDeleteQuery, savePatchBody } from '@/lib/api-schemas';
import { type SavedCook } from '@/lib/resultStorage';

interface SavedCookRow {
  id: number;
  method: string;
  meat_category: string;
  cut: string;
  weight_kg: string | number;
  result_json: string;
  created_at: string;
}

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { user } = auth;

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('saved_cooks')
      .select('id, method, meat_category, cut, weight_kg, result_json, created_at')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const saves = (data as SavedCookRow[]).map((row) => {
      let resultObj: Partial<SavedCook> = {};
      try {
        resultObj = JSON.parse(row.result_json);
      } catch (e) {
        console.error('Error parsing result_json:', e);
      }
      return {
        ...resultObj,
        id: row.id,
        saveId: String(row.id),
        method: row.method,
        meat_category: row.meat_category,
        cut: row.cut,
        weightKg: Number(row.weight_kg),
        savedAt: row.created_at,
      };
    });

    return NextResponse.json({ saves });
  } catch (error) {
    console.error('Fetch saves error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { user } = auth;

  const parsed = await parseBody(req, saveBody);
  if (!parsed.ok) return parsed.res;
  const cook = parsed.data as Record<string, unknown> & { method: string; cutName: string; weightKg: number; categoryName?: string };

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('saved_cooks')
      .insert({
        user_id: user.userId,
        method: cook.method,
        meat_category: cook.categoryName || '',
        cut: cook.cutName,
        weight_kg: cook.weightKg,
        result_json: JSON.stringify(cook),
      })
      .select('id')
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Save cook error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { user } = auth;

  const parsed = await parseBody(req, savePatchBody);
  if (!parsed.ok) return parsed.res;
  const { rating, notes } = parsed.data;
  const id = Number(parsed.data.saveId);

  try {
    const supabase = getSupabase();

    const { data: row, error } = await supabase
      .from('saved_cooks')
      .select('result_json')
      .eq('id', id)
      .eq('user_id', user.userId)
      .maybeSingle();
    if (error) throw error;
    if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    let resultJsonObj: Partial<SavedCook> = {};
    try {
      resultJsonObj = JSON.parse(row.result_json);
    } catch {}

    const updatedResult = {
      ...resultJsonObj,
      rating: rating !== undefined ? rating : resultJsonObj.rating,
      notes: notes !== undefined ? notes : resultJsonObj.notes,
    };

    const { error: updateError } = await supabase
      .from('saved_cooks')
      .update({ result_json: JSON.stringify(updatedResult) })
      .eq('id', id)
      .eq('user_id', user.userId);
    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update cook error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.res;
  const { user } = auth;

  const parsed = parseQuery(req.url, saveDeleteQuery);
  if (!parsed.ok) return parsed.res;
  const saveId = Number(parsed.data.saveId);

  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('saved_cooks')
      .delete()
      .eq('id', saveId)
      .eq('user_id', user.userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete cook error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
