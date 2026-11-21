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

  const sessionVal = request.cookies.get('nexaflow_session')?.value;
  const specterSessionVal = request.cookies.get('specter_session')?.value;
  const specterUserVal = request.cookies.get('specter_user')?.value;

  const hasLocalSession = Boolean(
    (sessionVal && sessionVal !== '' && sessionVal !== 'false') ||
    (specterSessionVal && specterSessionVal === 'true') ||
    (specterUserVal && specterUserVal !== '' && specterUserVal !== 'null')
  );

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
    '/team',
  ];

  const isProtectedPath = protectedPaths.some(p => pathname.startsWith(p));

  // Admin routes: accessible if user has admin session OR active logged in session
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminVal = request.cookies.get('nexaflow_admin_session')?.value;
    const hasAdminSession = Boolean(adminVal && adminVal !== '' && adminVal !== 'false');
    if (!hasAdminSession && !hasLocalSession) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  if (pathname === '/admin/login') {
    const adminVal = request.cookies.get('nexaflow_admin_session')?.value;
    if (adminVal && adminVal !== '' && adminVal !== 'false') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin';
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // If already logged in and visiting auth pages or root, redirect to dashboard
  if (hasLocalSession && (pathname === '/auth/login' || pathname === '/auth/signup' || pathname === '/')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // If not logged in and requesting root or a protected path, redirect to login
  if (!hasLocalSession && (pathname === '/' || isProtectedPath)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    if (pathname !== '/') {
      redirectUrl.searchParams.set('redirectTo', pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}
