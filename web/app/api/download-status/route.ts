import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getDownloads } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

// Toggle download status
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { bookId, status } = await request.json();

    const DOWNLOADS_FILE = path.join(process.cwd(), 'data', 'downloads.json');
    const downloads = getDownloads();

    if (status === true) {
      // Add download
      const existing = downloads.find(d => d.userId === payload.userId && d.bookId === bookId);
      if (!existing) {
        downloads.push({
          userId: payload.userId,
          bookId,
          downloadedAt: new Date().toISOString(),
        });
        fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2));
      }
    } else {
      // Remove download
      const filtered = downloads.filter(d => !(d.userId === payload.userId && d.bookId === bookId));
      fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify(filtered, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Toggle download status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
