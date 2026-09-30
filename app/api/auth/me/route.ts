import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return NextResponse.json({ user: null });
  }

  const user = verifyToken(sessionCookie.value);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}
