import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear cookie - must match ALL settings from login/signup
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    path: '/', // Must match login/signup
  });

  return response;
}
