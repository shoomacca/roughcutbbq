import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import { type SavedCook } from '@/lib/resultStorage';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;
  return verifyToken(sessionCookie.value);
}

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
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

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
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const cook = await req.json();
    if (!cook.method || !cook.cutName || !cook.weightKg) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
    }

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
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { saveId, rating, notes } = await req.json();
    if (!saveId) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    const id = parseInt(saveId, 10);
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
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const saveId = searchParams.get('saveId');
    if (!saveId) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

    const supabase = getSupabase();
    const { error } = await supabase
      .from('saved_cooks')
      .delete()
      .eq('id', parseInt(saveId, 10))
      .eq('user_id', user.userId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete cook error:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
