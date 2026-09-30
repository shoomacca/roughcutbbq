import { NextResponse } from 'next/server';
import {
  MAX_BODY_BYTES,
  MAX_REDIRECTS,
  resolveRedirect,
  validateFetchUrl,
  validateImageUrl,
} from '@/lib/og-image-guard';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-AU,en;q=0.9',
};

const CACHE = { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' };

/** Read at most maxBytes of the body as text, then stop. */
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return (await res.text()).slice(0, maxBytes);
  const reader = res.body.getReader();
  const buf = new Uint8Array(maxBytes);
  let off = 0;
  while (off < maxBytes) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    const n = Math.min(value.byteLength, maxBytes - off);
    buf.set(value.subarray(0, n), off);
    off += n;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(buf.subarray(0, off));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) return NextResponse.json({ image: null });

  let current = validateFetchUrl(url);
  if (!current) {
    return NextResponse.json({ image: null, error: 'url_not_allowed' }, { status: 400 });
  }

  try {
    const signal = AbortSignal.timeout(6000);
    let res: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const r = await fetch(current.toString(), { headers: HEADERS, signal, redirect: 'manual' });
      if (r.status >= 300 && r.status < 400) {
        await r.body?.cancel().catch(() => {});
        const next = resolveRedirect(current, r.headers.get('location'));
        if (!next || hop === MAX_REDIRECTS) return NextResponse.json({ image: null });
        current = next;
        continue;
      }
      res = r;
      break;
    }

    if (!res || !res.ok) return NextResponse.json({ image: null });
    const html = await readCapped(res, MAX_BODY_BYTES);

    // og:image (works for both dp/ and s?k= pages)
    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1] && !ogMatch[1].includes('amazon-adsystem') && !ogMatch[1].includes('transparent-pixel')) {
      const safe = validateImageUrl(ogMatch[1]);
      if (safe) return NextResponse.json({ image: safe }, { headers: CACHE });
    }

    // Amazon hiRes product image (dp/ pages)
    const hiResMatch = html.match(/"hiRes"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    if (hiResMatch?.[1]) {
      const safe = validateImageUrl(hiResMatch[1]);
      if (safe) return NextResponse.json({ image: safe }, { headers: CACHE });
    }

    // Search result pages — grab first product thumbnail
    const thumbMatch = html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9%+_-]+\._[A-Z0-9,_]+_\.(?:jpg|png|webp)/);
    if (thumbMatch?.[0]) {
      return NextResponse.json({ image: thumbMatch[0] }, { headers: CACHE });
    }

    return NextResponse.json({ image: null });
  } catch {
    return NextResponse.json({ image: null });
  }
}
