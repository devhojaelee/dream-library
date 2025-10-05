import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getDownloads } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

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

    // Get book metadata for each download
    const booksDir = process.env.BOOKS_DIR || path.join(process.cwd(), '..', 'books');
    const metadataDir = path.join(booksDir, 'metadata');

    // Get all books to map bookId to metadata
    const files = fs.existsSync(booksDir) ? fs.readdirSync(booksDir) : [];
    const epubFiles = files.filter(file => file.endsWith('.epub'));

    const bookMetadataMap = new Map();
    epubFiles.forEach((filename, index) => {
      const title = filename.replace('.epub', '');
      const metadataPath = path.join(metadataDir, `${title}.json`);

      let metadata: Record<string, string> = {};
      if (fs.existsSync(metadataPath)) {
        const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
        metadata = JSON.parse(metadataContent);
      }

      bookMetadataMap.set(index + 1, {
        title: metadata.title || title,
        author: metadata.author || null,
        year: metadata.year || null,
      });
    });

    // Enrich downloads with book metadata
    const enrichedDownloads = userDownloads.map(download => ({
      ...download,
      book: bookMetadataMap.get(download.bookId) || null,
    }));

    return NextResponse.json({
      downloads: enrichedDownloads,
    });
  } catch (error) {
    console.error('Download history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch download history' },
      { status: 500 }
    );
  }
}
