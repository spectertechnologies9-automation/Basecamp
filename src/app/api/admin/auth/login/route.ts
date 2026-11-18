import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminCredentials, signAdminToken, ADMIN_COOKIE_NAME, DEFAULT_ADMIN_EMAIL } from '@/lib/auth/admin';
import { getServerUser } from '@/lib/auth';
import { signToken, SESSION_COOKIE_NAME } from '@/lib/auth/local';
import { queryOne } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Master administrator password is required' }, { status: 400 });
    }

    const isValid = await verifyAdminCredentials(password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid master administration password' }, { status: 401 });
    }

    let currentUser = await getServerUser();
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
      const adminUser = await queryOne<any>(
        'SELECT * FROM users WHERE role = "owner" OR role = "admin" ORDER BY created_at ASC LIMIT 1'
      );
      if (adminUser) {
        currentUser = adminUser;
      }
    }

    const adminEmail = currentUser?.email || DEFAULT_ADMIN_EMAIL;
    const token = signAdminToken({
      email: adminEmail,
      timestamp: Date.now(),
    });

    const res = NextResponse.json({
      message: 'Admin authorization granted',
      authorized: true,
      user: currentUser,
    });

    // 1. Set Admin authorization cookie
    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours
    });

    // 2. Also ensure user session is active as the administrator
    if (currentUser) {
      const userToken = signToken({
        userId: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
      });

      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: userToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Authorization failed' }, { status: 500 });
  }
}
