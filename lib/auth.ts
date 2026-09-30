import crypto from 'crypto';
import { cookies } from 'next/headers';
import { cfg } from './runtime-config';

const JWT_SECRET = cfg('JWT_SECRET') || 'fallback-secret-for-local-dev-please-change-it-in-production-1234567890';

export function signToken(payload: { userId: number; email: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
    
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
      
    if (signature !== expectedSignature) return null;
    
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
  return hash === verifyHash;
}

// -- Admin session tokens (httpOnly cookie, verified server-side) --
export const ADMIN_COOKIE = 'admin_token';
export const ADMIN_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function signAdminToken(): string {
  const exp = Date.now() + ADMIN_TOKEN_TTL_MS;
  const body = Buffer.from(JSON.stringify({ role: 'admin', exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`admin.${body}`).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature) return false;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`admin.${body}`).digest('base64url');
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return decoded.role === 'admin' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

/** True when the incoming request carries a valid admin_token cookie. */
export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
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
