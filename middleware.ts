import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the correct cookie set by auth.ts server actions
  const userId = request.cookies.get('userId')?.value;
  const { pathname } = request.nextUrl;

  // Paths that don't require authentication
  const isPublicPath = pathname === '/login' || pathname === '/signup';
  
  // Exclude api routes and static files from middleware checks
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // If user is not authenticated and trying to access a protected route
  if (!userId && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and trying to access login/signup pages
  if (userId && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
