import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { validate } from '@/lib/api';
import { slugParam } from '@/lib/api-schemas';
import { GEAR } from '@/data/gear';
import { RUBS } from '@/data/rubs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const p = validate(slugParam, await params);
  if (!p.ok) return NextResponse.redirect(new URL('/gear', req.url));
  const { slug } = p.data;

  let affiliateUrl: string | undefined;

  try {
    const supabase = getSupabase();
    const { data } = await supabase.from('gear').select('affiliate_url').eq('slug', slug).maybeSingle();
    affiliateUrl = data?.affiliate_url;

    // Log click — fire and forget
    await supabase.from('gear_clicks').insert({ gear_slug: slug });
  } catch {
    // DB unavailable — fall through to static data
  }

  // Fall back to static gear/rub data so affiliate links never break
  if (!affiliateUrl || affiliateUrl === '#') {
    const item =
      GEAR.find((g) => g.slug === slug) ?? RUBS.find((r) => r.slug === slug);
    if (item) affiliateUrl = item.affiliateUrl;
  }

  if (!affiliateUrl || affiliateUrl === '#') {
    return NextResponse.redirect(new URL('/gear', req.url));
  }

  return NextResponse.redirect(affiliateUrl);
}
