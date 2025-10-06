import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyToken, trackDownload, DeviceType, UIMode } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // 인증 확인 - 로그인한 사용자만 다운로드 가능
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { filename } = await params;
    const bookId = request.nextUrl.searchParams.get('bookId');
    const deviceType = request.nextUrl.searchParams.get('deviceType') as DeviceType | null;
    const uiMode = request.nextUrl.searchParams.get('uiMode') as UIMode | null;
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    const booksDir = process.env.BOOKS_DIR || path.join(process.cwd(), '..', 'books');
    const filepath = path.join(booksDir, filename);

    // 파일이 존재하는지 확인
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // 다운로드 추적 with enhanced metadata
    if (bookId) {
      // Read book metadata if available
      let bookMetadata: { bookTitle?: string; bookAuthor?: string; genre?: string } = {};
      try {
        const metadataFilename = filename.replace('.epub', '.json');
        const metadataPath = path.join(booksDir, 'metadata', metadataFilename);

        if (fs.existsSync(metadataPath)) {
          const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          bookMetadata = {
            bookTitle: metadata.title,
            bookAuthor: metadata.author,
            genre: metadata.genre,
          };
        }
      } catch (error) {
        console.error('Failed to read book metadata:', error);
        // Continue without metadata
      }

      trackDownload(payload.userId, parseInt(bookId), {
        deviceType: deviceType || undefined,
        uiMode: uiMode || undefined,
        sessionId: sessionId || undefined,
        ...bookMetadata,
      });
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(filepath);

    // 다운로드 응답 반환
    // Safari 호환을 위해 filename과 filename* 둘 다 제공
    const encodedFilename = encodeURIComponent(filename);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/epub+zip',
        'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
