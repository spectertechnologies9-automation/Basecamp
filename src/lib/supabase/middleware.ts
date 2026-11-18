import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Static assets and API routes shouldn't be redirected
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const hasLocalSession = request.cookies.has('nexaflow_session');

  const protectedPaths = [
    '/dashboard',
    '/projects',
    '/admin',
    '/studio',
    '/settings',
    '/my-tasks',
    '/my-events',
    '/my-bookmarks',
    '/my-activity',
    '/my-notes',
    '/everything',
    '/activity',
    '/calendar',
    '/reports',
    '/search',
  ];

  const isProtectedPath = protectedPaths.some(p => pathname.startsWith(p));

  // Admin routes dedicated password login protection
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const hasAdminSession = request.cookies.has('nexaflow_admin_session');
    if (!hasAdminSession) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  if (pathname === '/admin/login' && request.cookies.has('nexaflow_admin_session')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin';
    return NextResponse.redirect(redirectUrl);
  }

  // If not logged in and requesting a protected path, redirect to login
  if (isProtectedPath && !hasLocalSession) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If already logged in and visiting auth pages, redirect to dashboard
  if (hasLocalSession && (pathname === '/auth/login' || pathname === '/auth/signup' || pathname === '/')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Root redirect
  if (pathname === '/') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = hasLocalSession ? '/dashboard' : '/auth/login';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}
