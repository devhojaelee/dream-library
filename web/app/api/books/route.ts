import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // /books 폴더 경로 (Docker 볼륨 마운트)
    const booksDir = process.env.BOOKS_DIR || path.join(process.cwd(), '..', 'books');
    const metadataDir = path.join(booksDir, 'metadata');

    // 폴더가 없으면 생성
    if (!fs.existsSync(booksDir)) {
      return NextResponse.json({ books: [] });
    }

    // .epub 파일만 필터링
    const files = fs.readdirSync(booksDir);
    const epubFiles = files.filter(file => file.endsWith('.epub'));

    // 책 정보 배열 생성
    const books = epubFiles.map((filename, index) => {
      const filepath = path.join(booksDir, filename);
      const stats = fs.statSync(filepath);

      // 파일명에서 .epub 제거하여 제목으로 사용
      const title = filename.replace('.epub', '');

      // Find metadata JSON with same base filename
      const metadataPath = path.join(metadataDir, `${title}.json`);

      let metadata: Record<string, string> = {};
      if (fs.existsSync(metadataPath)) {
        const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
        metadata = JSON.parse(metadataContent);
      }

      return {
        id: index + 1,
        title: metadata.title || title,
        filename: filename,
        size: stats.size,
        addedDate: stats.birthtime,
        cover: metadata.cover || null,
        coverUpdated: metadata.cover_updated || null,
        description: metadata.description || null,
        author: metadata.author || null,
        year: metadata.year || null,
        needsReview: metadata.needs_review || false,
      };
    });

    // 최신순으로 정렬
    books.sort((a, b) => b.addedDate.getTime() - a.addedDate.getTime());

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error reading books:', error);
    return NextResponse.json({ error: 'Failed to load books' }, { status: 500 });
  }
}
