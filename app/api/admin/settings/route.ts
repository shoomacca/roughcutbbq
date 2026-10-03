import { NextResponse } from 'next/server';
import { parseBody, requireAdmin } from '@/lib/api';
import { settingsPutBody } from '@/lib/api-schemas';
import { DEFAULT_AMAZON_TAG, getAmazonTag, setAmazonTag } from '@/lib/affiliate';

// GET -> current settings (admin only).
export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;
  return NextResponse.json({ amazon_tag: await getAmazonTag(), default_amazon_tag: DEFAULT_AMAZON_TAG });
}

// PUT { amazon_tag } -> validate (Amazon tracking-ID shape) and save.
export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.res;
  const parsed = await parseBody(req, settingsPutBody);
  if (!parsed.ok) return parsed.res;
  try {
    await setAmazonTag(parsed.data.amazon_tag);
    return NextResponse.json({ ok: true, amazon_tag: parsed.data.amazon_tag });
  } catch (e) {
    // Most likely cause before migration 0003 is applied: app_settings does not exist.
    console.error('Admin settings save error:', e);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
