import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // The site is public by default. Only these paths require login.
  const isProtectedPath =
    pathname === '/saves' ||
    pathname.startsWith('/saves/') ||
    pathname.startsWith('/admin');

  if (!token && isProtectedPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged-in users skip the login/signup pages
  if (token && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/calculator', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all paths except static assets
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
