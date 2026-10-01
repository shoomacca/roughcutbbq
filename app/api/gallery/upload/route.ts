import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import { getSupabase, galleryPublicUrl } from '@/lib/supabase';
import { errorResponse, optionalUser, validate } from '@/lib/api';
import { uploadFields } from '@/lib/api-schemas';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_EDGE = 2000;

/** Detect jpeg/png/webp from magic bytes; the declared MIME type is ignored. */
function sniffImage(buf: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/** Re-encode to WebP <= 2000px; sharp drops EXIF/GPS unless withMetadata is set. */
async function reencode(buf: Buffer): Promise<Buffer> {
  return sharp(buf)
    .rotate() // bake in EXIF orientation before the tag is stripped
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
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

  const processed: Buffer[] = [];
  for (const file of [before, after]) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Max 10MB per image' }, { status: 400 });
    }
    const raw = Buffer.from(await file.arrayBuffer());
    if (!sniffImage(raw)) {
      return NextResponse.json({ error: 'Images only (jpeg/png/webp)' }, { status: 400 });
    }
    try {
      processed.push(await reencode(raw));
    } catch {
      return NextResponse.json({ error: 'Images only (jpeg/png/webp)' }, { status: 400 });
    }
  }

  try {
    const supabase = getSupabase();
    const postId = nanoid();
    const beforeName = `${postId}-before.webp`;
    const afterName = `${postId}-after.webp`;
    const uploaded: string[] = [];

    try {
      for (const [objectName, body] of [
        [beforeName, processed[0]],
        [afterName, processed[1]],
      ] as const) {
        const { error } = await supabase.storage
          .from('gallery')
          .upload(objectName, body, { contentType: 'image/webp', upsert: false });
        if (error) throw error;
        uploaded.push(objectName);
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
    } catch (err) {
      // Don't leave orphaned objects behind.
      if (uploaded.length) await supabase.storage.from('gallery').remove(uploaded).catch(() => {});
      throw err;
    }

    return NextResponse.json({ ok: true, id: postId });
  } catch (error) {
    console.error('Gallery upload error:', error);
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 });
  }
}
