import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { cfg } from '@/lib/runtime-config';
import { ADMIN_COOKIE, ADMIN_TOKEN_TTL_MS, signAdminToken, verifyAdminToken } from '@/lib/auth';

// GET -> is the current browser already authed as admin?
export async function GET() {
  const cookieStore = await cookies();
  const authed = verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
  return NextResponse.json({ authed });
}

// POST { password } -> verify server-side, set httpOnly admin cookie
export async function POST(req: Request) {
  const adminPassword = cfg('ADMIN_PASSWORD');
  if (!adminPassword) {
    return NextResponse.json({ error: 'Admin login is not configured' }, { status: 500 });
  }

  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Hash both sides so the comparison is constant-length and timing-safe.
  const provided = crypto.createHash('sha256').update(String(password ?? '')).digest();
  const expected = crypto.createHash('sha256').update(adminPassword).digest();
  if (!crypto.timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, signAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_TOKEN_TTL_MS / 1000,
  });
  return NextResponse.json({ ok: true });
}

// DELETE -> log out (clear the admin cookie)
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
