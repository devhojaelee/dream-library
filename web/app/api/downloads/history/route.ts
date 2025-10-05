import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getDownloads } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const downloads = getDownloads();
    const userDownloads = downloads.filter(d => d.userId === payload.userId);

    return NextResponse.json({
      downloads: userDownloads,
    });
  } catch (error) {
    console.error('Download history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download history' },
      { status: 500 }
    );
  }
}
