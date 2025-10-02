import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUsers, getUserDownloads } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    console.log('[AUTH/ME] Token received:', token ? `${token.substring(0, 20)}...` : 'NONE');

    if (!token) {
      console.log('[AUTH/ME] No token found, returning null user');
      return NextResponse.json({ user: null });
    }

    const payload = verifyToken(token);
    if (!payload) {
      console.log('[AUTH/ME] Invalid token, returning null user');
      return NextResponse.json({ user: null });
    }

    console.log('[AUTH/ME] Token valid, user ID:', payload.userId);

    const users = getUsers();
    const user = users.find(u => u.id === payload.userId);

    if (!user) {
      console.log('[AUTH/ME] User not found for ID:', payload.userId);
      return NextResponse.json({ user: null });
    }

    console.log('[AUTH/ME] Returning user:', user.username, 'ID:', user.id);

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
