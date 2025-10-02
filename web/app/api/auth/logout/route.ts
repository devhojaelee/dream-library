import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Log existing cookie before deletion
  const existingToken = request.cookies.get('auth_token')?.value;
  console.log('[LOGOUT] Existing cookie:', existingToken ? `${existingToken.substring(0, 20)}...` : 'NONE');

  const response = NextResponse.json({ success: true });

  // Clear cookie - must match ALL settings from login/signup
  const isProduction = process.env.NODE_ENV === 'production';

  // Use delete method for more reliable cookie removal
  response.cookies.delete('auth_token');

  // Also set empty value as backup
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  console.log('[LOGOUT] Cookie deleted, NODE_ENV:', process.env.NODE_ENV, 'secure:', isProduction);

  return response;
}
