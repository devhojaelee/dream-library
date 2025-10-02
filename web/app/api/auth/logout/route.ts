import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Log existing cookie before deletion
  const existingToken = request.cookies.get('auth_token')?.value;
  console.log('[LOGOUT] Existing cookie:', existingToken ? `${existingToken.substring(0, 20)}...` : 'NONE');

  const response = NextResponse.json({ success: true });

  // Clear cookie with EXACT matching attributes from login/signup
  // Must match: httpOnly, secure, sameSite, path
  // CRITICAL: secure must match the protocol used (https = true, http = false)
  const protocol = request.headers.get('x-forwarded-proto') ||
                   (request.url.startsWith('https') ? 'https' : 'http');
  const isSecure = protocol === 'https';

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  console.log('[LOGOUT] Cookie deleted with maxAge=0, protocol:', protocol, 'secure:', isSecure);

  return response;
}
