import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getDownloads } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

// Toggle download status
export async function POST(request: NextRequest) {
  try {
    console.log('[download-status] Request received');

    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      console.log('[download-status] No token found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      console.log('[download-status] Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { bookId, status } = await request.json();
    console.log('[download-status] Processing:', { userId: payload.userId, bookId, status });

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
        console.log('[download-status] Download added');
      } else {
        console.log('[download-status] Download already exists');
      }
    } else {
      // Remove download
      const filtered = downloads.filter(d => !(d.userId === payload.userId && d.bookId === bookId));
      fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify(filtered, null, 2));
      console.log('[download-status] Download removed, filtered count:', filtered.length);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[download-status] Error:', error);
    return NextResponse.json({
      error: 'Failed to update status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
