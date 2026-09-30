import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import { getSupabase, galleryPublicUrl } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

function ext(file: File): string {
  return file.type.split('/')[1].replace('jpeg', 'jpg');
}

export async function POST(req: Request) {
  const form = await req.formData();
  const before = form.get('before') as File | null;
  const after = form.get('after') as File | null;
  const cut = (form.get('cut') as string | null) ?? '';
  const method = (form.get('method') as string | null) ?? '';
  const name = (form.get('name') as string | null) || null;
  const gearUsed = (form.get('gearUsed') as string | null) || null;

  if (!before || !after || !cut || !method) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

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

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    let userId: number | null = null;
    if (sessionCookie) {
      const user = verifyToken(sessionCookie.value);
      if (user) userId = user.userId;
    }

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
