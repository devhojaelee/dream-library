import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getDownloads } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

// Get crawler download status
export async function GET() {
  try {
    const booksDir = process.env.BOOKS_DIR || path.join(process.cwd(), '..', 'books');
    const statusPath = path.join(booksDir, 'download_status.json');

    // Check if status file exists
    if (!fs.existsSync(statusPath)) {
      return NextResponse.json({
        status: 'ready',
        message: '새로운 책을 다운로드할 수 있습니다!'
      });
    }

    // Read status file
    const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    const waitUntil = new Date(statusData.waitUntil);
    const now = new Date();

    // Check if wait time has passed
    if (now >= waitUntil) {
      return NextResponse.json({
        status: 'ready',
        message: '새로운 책을 다운로드할 수 있습니다!'
      });
    }

    // Still waiting
    const remainingMs = waitUntil.getTime() - now.getTime();
    return NextResponse.json({
      status: 'waiting',
      waitUntil: statusData.waitUntil,
      remainingMs,
      message: '다운로드 대기 중입니다.'
    });

  } catch (error) {
    console.error('Error reading download status:', error);
    return NextResponse.json({
      status: 'ready',
      message: '새로운 책을 다운로드할 수 있습니다!'
    });
  }
}

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
