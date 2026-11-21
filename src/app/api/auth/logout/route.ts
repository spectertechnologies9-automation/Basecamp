import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/local';

export async function POST() {
  const res = NextResponse.json({ message: 'Signed out successfully.' });

  const cookiesToClear = [
    SESSION_COOKIE_NAME,
    'specter_session',
    'specter_user',
    'nexaflow_admin_session',
  ];

  for (const name of cookiesToClear) {
    res.cookies.set({
      name,
      value: '',
      httpOnly: false,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return res;
}
