import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getSupabase, galleryPublicUrl } from '@/lib/supabase';
import { errorResponse, optionalUser, validate } from '@/lib/api';
import { uploadFields } from '@/lib/api-schemas';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

function ext(file: File): string {
  return file.type.split('/')[1].replace('jpeg', 'jpg');
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return errorResponse(400, 'invalid_input');
  }
  const before = form.get('before') as File | null;
  const after = form.get('after') as File | null;
  const fields = validate(uploadFields, {
    cut: form.get('cut') ?? '',
    method: form.get('method') ?? '',
    name: (form.get('name') as string | null) || null,
    gearUsed: (form.get('gearUsed') as string | null) || null,
  });

  if (!fields.ok) return fields.res;
  if (!before || !after) return errorResponse(400, 'invalid_input');
  const { cut, method, name, gearUsed } = fields.data;

  for (const file of [before, after]) {
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Images only (jpeg/png/webp)' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Max 10MB per image' }, { status: 400 });
    }
  }

  try {
    const supabase = getSupabase();
    const postId = nanoid();
    const beforeName = `${postId}-before.${ext(before)}`;
    const afterName = `${postId}-after.${ext(after)}`;

    for (const [objectName, file] of [
      [beforeName, before],
      [afterName, after],
    ] as const) {
      const { error } = await supabase.storage
        .from('gallery')
        .upload(objectName, Buffer.from(await file.arrayBuffer()), {
          contentType: file.type,
          upsert: false,
        });
      if (error) throw error;
    }

    const userId = (await optionalUser())?.userId ?? null;

    const { error: insertError } = await supabase.from('gallery_posts').insert({
      id: postId,
      user_id: userId,
      before_url: galleryPublicUrl(beforeName),
      after_url: galleryPublicUrl(afterName),
      name,
      cut,
      method,
      gear_used: gearUsed,
    });
    if (insertError) throw insertError;

    return NextResponse.json({ ok: true, id: postId });
  } catch (error) {
    console.error('Gallery upload error:', error);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }
}
