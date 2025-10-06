import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername, verifyPassword, generateToken, updateLastLogin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password, rememberMe } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = getUserByUsername(username);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // 승인 확인
    if (!user.approved) {
      return NextResponse.json(
        { error: '회원가입 승인 대기중입니다. 관리자 승인 후 로그인할 수 있습니다.' },
        { status: 403 }
      );
    }

    const token = generateToken(user.id, rememberMe);

    // Update last login timestamp
    updateLastLogin(user.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });

    // Set cookie
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    const protocol = request.headers.get('x-forwarded-proto') ||
                     (request.url.startsWith('https') ? 'https' : 'http');
    const isSecure = protocol === 'https';

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: isSecure, // Match actual protocol (https = true, http = false)
      sameSite: 'lax',
      maxAge,
      path: '/', // Explicitly set path for consistency
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
