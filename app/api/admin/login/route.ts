import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { signAdminToken, verifyAdminToken } from '@/lib/auth';

// GET → am I already authed as admin?
export async function GET() {
  const cookieStore = await cookies();
  const authed = verifyAdminToken(cookieStore.get('admin_token')?.value);
  return NextResponse.json({ authed });
}

// POST { password } → verify server-side, set httpOnly admin cookie
export async function POST(req: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: 'Admin login is not configured' }, { status: 500 });
  }

  const { password } = await req.json();
  const provided = Buffer.from(String(password ?? ''));
  const expected = Buffer.from(adminPassword);
  const match =
    provided.length === expected.length && crypto.timingSafeEqual(provided, expected);

  if (!match) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set('admin_token', signAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
  return NextResponse.json({ ok: true });
}
