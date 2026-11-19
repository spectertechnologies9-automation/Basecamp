import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { loginUser, signToken, SESSION_COOKIE_NAME } from '@/lib/auth/local';
import { queryOne } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const user = await loginUser(email, password);

    if (!user) {
      const inactive = await queryOne<any>(
        'SELECT is_active FROM users WHERE email = ?',
        [email.toLowerCase().trim()]
      );
      if (inactive && !inactive.is_active) {
        return NextResponse.json(
          { error: 'Your access to this workspace has been revoked by an administrator.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const res = NextResponse.json({
      user,
      message: 'Signed in successfully.',
    });

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    res.cookies.set({
      name: 'specter_session',
      value: 'true',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    // Provide immediate admin portal access for administrators
    if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'owner') {
      res.cookies.set({
        name: 'nexaflow_admin_session',
        value: signToken({ email: user.email, role: user.role, timestamp: Date.now() }),
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Authentication failed.' },
      { status: 500 }
    );
  }
}
