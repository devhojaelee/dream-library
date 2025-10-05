import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const booksDir = process.env.BOOKS_DIR || path.join(process.cwd(), '..', 'books');
    const coversDir = path.join(booksDir, 'covers');
    const filepath = path.join(coversDir, filename);

    // 파일이 존재하는지 확인
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: 'Cover not found' }, { status: 404 });
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(filepath);

    // 확장자에 따라 content-type 설정
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    const contentType = contentTypes[ext] || 'image/jpeg';

    // 파일 수정 시간을 ETag로 사용
    const stats = fs.statSync(filepath);
    const etag = `"${stats.mtime.getTime()}"`;

    // 이미지 응답 반환
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': process.env.NODE_ENV === 'production'
          ? 'public, max-age=3600, must-revalidate'
          : 'no-cache, no-store, must-revalidate',
        'ETag': etag,
      },
    });
  } catch (error) {
    console.error('Cover error:', error);
    return NextResponse.json({ error: 'Failed to load cover' }, { status: 500 });
  }
}
