import { NextRequest, NextResponse } from 'next/server';
import { createUser, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
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

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });

    // Set cookie
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Signup failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
