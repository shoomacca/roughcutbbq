import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) return NextResponse.json({ image: null });

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return NextResponse.json({ image: null });
    const html = await res.text();

    // og:image (works for both dp/ and s?k= pages)
    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1] && !ogMatch[1].includes('amazon-adsystem') && !ogMatch[1].includes('transparent-pixel')) {
      return NextResponse.json({ image: ogMatch[1] }, {
        headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
      });
    }

    // Amazon hiRes product image (dp/ pages)
    const hiResMatch = html.match(/"hiRes"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    if (hiResMatch?.[1]) {
      return NextResponse.json({ image: hiResMatch[1] }, {
        headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
      });
    }

    // Search result pages — grab first product thumbnail
    const thumbMatch = html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9%+_-]+\._[A-Z0-9,_]+_\.(?:jpg|png|webp)/);
    if (thumbMatch?.[0]) {
      return NextResponse.json({ image: thumbMatch[0] }, {
        headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
      });
    }

    return NextResponse.json({ image: null });
  } catch {
    return NextResponse.json({ image: null });
  }
}
