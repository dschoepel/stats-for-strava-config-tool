// proxy.js
/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Routes that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/request-reset',
  '/api/auth/reset-password',
  '/api/auth/logout',
  '/api/runtime-config',
  '/api/sports-list',
  '/api/file-content',
  '/favicon.ico',
];

// Path prefixes that don't require authentication
const publicPrefixes = [
  '/_next/',
  '/public/',
];

function isPublicPath(pathname) {
  // Check exact matches
  if (publicPaths.includes(pathname)) {
    return true;
  }
  
  // Check path prefixes
  for (const prefix of publicPrefixes) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }
  
  return false;
}

export default function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Get session cookie
  const sessionCookie = request.cookies.get('sfs_session');
  
  if (!sessionCookie) {
    // No session cookie, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT token
  try {
    const secret = process.env.SESSION_SECRET || 'default-secret-change-me';
    jwt.verify(sessionCookie.value, secret);
    
    // Token is valid, allow access
    return NextResponse.next();
  } catch {
    // Token is invalid or expired, redirect to login
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    
    // Clear the invalid cookie
    response.cookies.set('sfs_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  }
}

// Configure which routes to run proxy on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
