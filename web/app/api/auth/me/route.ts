import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUsers, getUserDownloads } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ user: null });
    }

    const users = getUsers();
    const user = users.find(u => u.id === payload.userId);

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const downloadedBooks = getUserDownloads(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        downloadedBooks,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ user: null });
  }
}
