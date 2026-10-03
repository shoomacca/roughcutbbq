import crypto from 'crypto';
import { cookies } from 'next/headers';
import { cfg } from './runtime-config';
import { getSupabase } from './supabase';

// Resolved lazily (at sign/verify time, not import time) so `next build`
// can collect page data without secrets present.
function getJwtSecret(): string {
  const secret = cfg('JWT_SECRET');
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    // Never sign tokens with a known secret in production - anyone could forge sessions.
    throw new Error('JWT_SECRET must be set in production.');
  }
  return 'local-dev-only-secret';
}

/** Constant-time string comparison (length mismatch returns false). */
function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Compare with self to keep timing uniform
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function signToken(payload: { userId: number; email: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(`${header}.${body}`)
    .digest('base64url');
    
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    
    const expectedSignature = crypto
      .createHmac('sha256', getJwtSecret())
      .update(`${header}.${body}`)
      .digest('base64url');
      
    if (!timingSafeCompare(signature, expectedSignature)) return null;
    
    const decodedBody = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (decodedBody.exp < Date.now()) return null; // Expired
    
    return { userId: decodedBody.userId, email: decodedBody.email };
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return timingSafeCompare(hash, verifyHash);
}

// -- Admin session tokens (httpOnly cookie, verified server-side) --
export const ADMIN_COOKIE = 'admin_token';
export const ADMIN_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function signAdminToken(): string {
  const exp = Date.now() + ADMIN_TOKEN_TTL_MS;
  const body = Buffer.from(JSON.stringify({ role: 'admin', exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', getJwtSecret()).update(`admin.${body}`).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature) return false;
    const expected = crypto.createHmac('sha256', getJwtSecret()).update(`admin.${body}`).digest('base64url');
    if (!timingSafeCompare(signature, expected)) return false;
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return decoded.role === 'admin' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

// -- Email allow-listed admins (interim, before full roles in RC-7.1) --
/** Name of the user session cookie (re-exported by lib/api.ts). */
export const SESSION_COOKIE = 'session';

/** Parse ADMIN_EMAILS: comma-separated, trimmed, lowercased, blanks dropped. */
export function parseAdminEmails(raw: string | undefined | null): Set<string> {
  return new Set(
    (raw ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0)
  );
}

/** Case-insensitive membership in ADMIN_EMAILS. Unset/empty env -> nobody. */
export function isAllowedAdminEmail(email: string | undefined | null, raw: string = cfg('ADMIN_EMAILS')): boolean {
  if (typeof email !== 'string' || !email.trim()) return false;
  return parseAdminEmails(raw).has(email.trim().toLowerCase());
}

/**
 * Session-token path: the user JWT verifies, its email is allow-listed, and the
 * user row still exists with that email (one indexed lookup, only for
 * allow-listed emails). Any DB error fails closed.
 */
async function isAllowListedSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const user = verifyToken(token);
  if (!user || !user.userId || !isAllowedAdminEmail(user.email)) return false;
  try {
    const { data, error } = await getSupabase()
      .from('users')
      .select('id, email')
      .eq('id', user.userId)
      .maybeSingle();
    if (error || !data || typeof data.email !== 'string') return false;
    return data.email.trim().toLowerCase() === user.email.trim().toLowerCase();
  } catch {
    return false;
  }
}

/**
 * The single admin check. True when EITHER the request carries a valid
 * admin_token cookie (shared password, /api/admin/login) OR a valid user
 * session whose email is in ADMIN_EMAILS (and still matches the DB row).
 */
export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  if (verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value)) return true;
  return isAllowListedSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export function getAnonymousName(userId: number): string {
  const adjectives = [
    "Smoky", "Crispy", "Sizzling", "Glazed", "Charred", 
    "Slow", "Spiced", "Seared", "Tender", "Juicy", 
    "Wood-fired", "Peppered", "Sweet", "Garlic", "Onion", 
    "Zesty", "Honey", "Bacon", "Oak", "Cherry"
  ];
  const nouns = [
    "Brisket", "Ribs", "Pork", "Chicken", "Coal", 
    "Pitmaster", "Grill", "Smoker", "Rub", "Ember", 
    "Chop", "Sausage", "Steak", "Wing", "Patty", 
    "Flame", "Chimney", "Grate", "Sauce", "Bark"
  ];
  const adj = adjectives[userId % adjectives.length];
  const noun = nouns[(userId * 7) % nouns.length];
  return `${adj} ${noun} #${userId}`;
}
