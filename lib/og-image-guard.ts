// Pure validation helpers for /api/og-image (RC-1.1). No I/O so they can be unit-tested.

export const PAGE_HOSTS = [
  'amazon.com.au',
  'www.amazon.com.au',
  'amazon.com',
  'www.amazon.com',
  'amzn.to',
  'amzn.asia',
] as const;

export const IMAGE_HOSTS = [
  'm.media-amazon.com',
  'images-na.ssl-images-amazon.com',
  'images-fe.ssl-images-amazon.com',
  'media-amazon.com', // also matches any *.media-amazon.com
] as const;

export const MAX_REDIRECTS = 3;
export const MAX_BODY_BYTES = 1_500_000;

/** Exact host or true subdomain match on a parsed hostname (never substring). */
export function hostMatches(hostname: string, allowed: readonly string[]): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, '');
  return allowed.some((a) => h === a || h.endsWith('.' + a));
}

function isIpLiteral(hostname: string): boolean {
  if (hostname.startsWith('[') || hostname.includes(':')) return true; // IPv6
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || /^\d+$/.test(hostname) || /^0x[0-9a-f]+$/i.test(hostname);
}

function parseStrict(raw: string, allowed: readonly string[]): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  if (u.username || u.password) return null;
  if (u.port !== '') return null; // non-default port (default 443 is normalised to '')
  const host = u.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.localhost')) return null;
  if (isIpLiteral(host)) return null;
  if (!hostMatches(host, allowed)) return null;
  return u;
}

/** Validate a page URL the server is allowed to fetch. Returns the parsed URL or null. */
export function validateFetchUrl(raw: string | null | undefined): URL | null {
  if (!raw) return null;
  return parseStrict(raw, PAGE_HOSTS);
}

/** Validate an extracted og:image URL. Returns the normalised string or null. */
export function validateImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const u = parseStrict(raw, IMAGE_HOSTS);
  return u ? u.toString() : null;
}

/**
 * Resolve and re-validate a redirect Location against the same allowlist.
 * Returns the next URL, or null if missing/invalid/off-allowlist.
 */
export function resolveRedirect(current: URL, location: string | null | undefined): URL | null {
  if (!location) return null;
  let next: URL;
  try {
    next = new URL(location, current);
  } catch {
    return null;
  }
  return validateFetchUrl(next.toString());
}
