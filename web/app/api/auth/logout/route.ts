import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Log existing cookie before deletion
  const existingToken = request.cookies.get('auth_token')?.value;
  console.log('[LOGOUT] Existing cookie:', existingToken ? `${existingToken.substring(0, 20)}...` : 'NONE');

  const response = NextResponse.json({ success: true });

  // Clear cookie with EXACT matching attributes from login/signup
  // Must match: httpOnly, secure, sameSite, path
  const isProduction = process.env.NODE_ENV === 'production';

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  console.log('[LOGOUT] Cookie deleted with maxAge=0, NODE_ENV:', process.env.NODE_ENV, 'secure:', isProduction);

  return response;
}
