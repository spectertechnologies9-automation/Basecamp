import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signupUser, signToken, SESSION_COOKIE_NAME } from '@/lib/auth/local';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { email, password, full_name } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const emailToUse = email.includes('@') ? email.toLowerCase().trim() : `${email.toLowerCase().trim()}@specteros.agency`;

    const user = await signupUser(emailToUse, password, full_name);
    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const res = NextResponse.json({
      user,
      message: 'Account created successfully.',
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

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create account.' },
      { status: 400 }
    );
  }
}
