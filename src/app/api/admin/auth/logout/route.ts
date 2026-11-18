import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/auth/admin';

export async function POST() {
  const res = NextResponse.json({ message: 'Admin session terminated' });
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
  return res;
}
