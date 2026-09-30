import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveRedirect, validateFetchUrl, validateImageUrl } from '@/lib/og-image-guard';
import { GET } from '@/app/api/og-image/route';

describe('validateFetchUrl', () => {
  const bad = [
    'https://github.com',
    'http://amazon.com.au',
    'https://amazon.com.au.evil.com',
    'https://evil.com/?amazon.com.au',
    'https://user@amazon.com.au',
    'https://user:pw@amazon.com.au',
    'https://127.0.0.1',
    'https://[::1]/',
    'https://localhost',
    'https://amazon.com.au:8443/x',
    'https://notamazon.com.au',
    'not a url',
    '',
  ];
  for (const u of bad) it(`rejects ${JSON.stringify(u)}`, () => expect(validateFetchUrl(u)).toBeNull());

  const good = [
    'https://www.amazon.com.au/dp/B000',
    'https://amzn.to/abc',
    'https://amzn.asia/d/x',
    'https://amazon.com/dp/B000',
    'https://smile.amazon.com/dp/B000',
    'https://amazon.com.au:443/dp/B000',
  ];
  for (const u of good) it(`accepts ${u}`, () => expect(validateFetchUrl(u)).not.toBeNull());
});

describe('validateImageUrl', () => {
  it('accepts amazon image hosts', () => {
    expect(validateImageUrl('https://m.media-amazon.com/images/I/a.jpg')).toBeTruthy();
    expect(validateImageUrl('https://images-na.ssl-images-amazon.com/x.jpg')).toBeTruthy();
    expect(validateImageUrl('https://foo.media-amazon.com/x.jpg')).toBeTruthy();
  });
  it('rejects others', () => {
    expect(validateImageUrl('http://m.media-amazon.com/x.jpg')).toBeNull();
    expect(validateImageUrl('https://evil.com/x.jpg')).toBeNull();
    expect(validateImageUrl('https://m.media-amazon.com.evil.com/x.jpg')).toBeNull();
    expect(validateImageUrl('https://www.amazon.com.au/x.jpg')).toBeNull();
  });
});

describe('resolveRedirect', () => {
  const cur = new URL('https://amzn.to/abc');
  it('follows to allowed host (absolute and relative)', () => {
    expect(resolveRedirect(cur, 'https://www.amazon.com.au/dp/B000')?.hostname).toBe('www.amazon.com.au');
    expect(resolveRedirect(cur, '/other')?.hostname).toBe('amzn.to');
  });
  it('rejects off-allowlist, downgrade, missing', () => {
    expect(resolveRedirect(cur, 'https://evil.com/')).toBeNull();
    expect(resolveRedirect(cur, 'http://www.amazon.com.au/')).toBeNull();
    expect(resolveRedirect(cur, 'https://127.0.0.1/')).toBeNull();
    expect(resolveRedirect(cur, null)).toBeNull();
  });
});

describe('GET /api/og-image', () => {
  afterEach(() => vi.restoreAllMocks());
  const call = (u: string) => GET(new Request('http://localhost/api/og-image?url=' + encodeURIComponent(u)));

  it('400s on a disallowed URL without fetching', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('no network'));
    const res = await call('https://github.com');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ image: null, error: 'url_not_allowed' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not follow a redirect off the allowlist', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 302, headers: { location: 'https://evil.com/' } }));
    const res = await call('https://amzn.to/abc');
    expect(await res.json()).toEqual({ image: null });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1]).toMatchObject({ redirect: 'manual' });
  });

  it('follows an allowed redirect and returns a validated og:image', async () => {
    const html = '<meta property="og:image" content="https://m.media-amazon.com/images/I/x.jpg">';
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: 'https://www.amazon.com.au/dp/B000' } }))
      .mockResolvedValueOnce(new Response(html, { status: 200 }));
    const res = await call('https://amzn.to/abc');
    expect(await res.json()).toEqual({ image: 'https://m.media-amazon.com/images/I/x.jpg' });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('drops an og:image on a non-allowed host', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<meta property="og:image" content="https://evil.com/x.jpg">', { status: 200 }),
    );
    expect(await (await call('https://www.amazon.com.au/dp/B000')).json()).toEqual({ image: null });
  });

  it('stops after 3 redirects', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(null, { status: 302, headers: { location: 'https://www.amazon.com.au/next' } }));
    expect(await (await call('https://amzn.to/abc')).json()).toEqual({ image: null });
    expect(spy).toHaveBeenCalledTimes(4);
  });
});
