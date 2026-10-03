/**
 * Amazon Associates tag: pure helpers (no server imports, safe anywhere).
 * DB-backed read/write lives in lib/affiliate.ts.
 */

export const AMAZON_TAG_KEY = 'amazon_tag';
export const DEFAULT_AMAZON_TAG = 'roughcutbbq-22';

/**
 * Amazon tracking-ID shape: a store ID (lowercase letters, digits, hyphens)
 * followed by a two-digit marketplace suffix starting with 2 (-20 US/CA,
 * -21 UK/EU, -22 AU/JP, ...). Total length 5..42. Strict on purpose: the
 * value is written into every outbound URL, so anything else (spaces, '&',
 * '#', '=', uppercase) is rejected rather than escaped.
 */
export const AMAZON_TAG_RE = /^[a-z0-9][a-z0-9-]{1,38}-2[0-9]$/;

export function normalizeAmazonTag(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidAmazonTag(tag: string): boolean {
  return AMAZON_TAG_RE.test(tag);
}

/** Hosts whose `tag` query param we own. Subdomains (www., smile.) included. */
const AMAZON_HOSTS = ['amazon.com.au', 'amazon.com'];

function isAmazonHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return AMAZON_HOSTS.some((d) => h === d || h.endsWith('.' + d));
}

/**
 * Set or replace the `tag` query param on an amazon.com.au / amazon.com URL.
 * Everything else is returned unchanged, including:
 *  - non-Amazon hosts and unparseable values such as '#';
 *  - short links (amzn.to, amzn.asia): the tag is baked into the redirect
 *    target Amazon stores for the short code, so a query param here would be
 *    ignored. Replace those with full amazon.com.au URLs in /admin/gear.
 */
export function applyAmazonTag(url: string, tag: string): string {
  if (!isValidAmazonTag(tag)) return url;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return url;
  if (!isAmazonHost(u.hostname)) return url;
  if (u.searchParams.get('tag') === tag && u.searchParams.getAll('tag').length === 1) return url;
  u.searchParams.set('tag', tag);
  return u.toString();
}
