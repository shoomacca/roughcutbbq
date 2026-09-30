import { NextResponse } from 'next/server';
import { optionalUser } from '@/lib/api';

export async function GET() {
  const user = await optionalUser();
  return NextResponse.json({ user });
}
