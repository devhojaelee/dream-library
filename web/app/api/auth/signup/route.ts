import { NextRequest, NextResponse } from 'next/server';
import { createUser, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Log existing cookie before signup
    const existingToken = request.cookies.get('auth_token')?.value;
    console.log('[SIGNUP] Existing cookie before signup:', existingToken ? `${existingToken.substring(0, 20)}...` : 'NONE');

    const { username, password, rememberMe } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await createUser(username, password);
    const token = generateToken(user.id, rememberMe);

    console.log('[SIGNUP] New user created:', username, 'ID:', user.id);
    console.log('[SIGNUP] New token generated:', token.substring(0, 20) + '...');

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });

    // Set cookie
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
    const protocol = request.headers.get('x-forwarded-proto') ||
                     (request.url.startsWith('https') ? 'https' : 'http');
    const isSecure = protocol === 'https';

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: isSecure, // Match actual protocol (https = true, http = false)
      sameSite: 'lax', // Must match login and logout
      maxAge,
      path: '/', // Explicitly set path for consistency
    });

    console.log('[SIGNUP] Cookie set for user:', username, 'protocol:', protocol, 'secure:', isSecure);

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Signup failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
