import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/local';

export async function POST() {
  const res = NextResponse.json({ message: 'Signed out successfully.' });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return res;
}
