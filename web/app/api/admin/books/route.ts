import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const booksDir = process.env.BOOKS_DIR || path.join(process.cwd(), '..', 'books');
    const metadataDir = path.join(booksDir, 'metadata');
    const coversDir = path.join(booksDir, 'covers');

    // Load review status from writable data directory
    const dataDir = path.join(process.cwd(), 'data');
    const reviewStatusPath = path.join(dataDir, 'review_status.json');
    let reviewStatus: Record<string, boolean> = {};
    if (fs.existsSync(reviewStatusPath)) {
      const content = fs.readFileSync(reviewStatusPath, 'utf-8');
      reviewStatus = JSON.parse(content);
    }

    if (!fs.existsSync(booksDir)) {
      return NextResponse.json({ books: [] });
    }

    const files = fs.readdirSync(booksDir);
    const epubFiles = files.filter(file => file.endsWith('.epub'));

    const books = epubFiles.map((filename) => {
      const filepath = path.join(booksDir, filename);
      const stats = fs.statSync(filepath);
      const title = filename.replace('.epub', '');

      // Metadata path
      const metadataPath = path.join(metadataDir, `${title}.json`);

      let metadata: Record<string, string> = {};
      if (fs.existsSync(metadataPath)) {
        const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
        metadata = JSON.parse(metadataContent);
      }

      return {
        filename: filename, // Unique identifier
        title: metadata.title || title,
        author: metadata.author || null,
        year: metadata.year || null,
        description: metadata.description || null,
        cover: metadata.cover || null,
        coverUpdated: metadata.cover_updated || null,
        needsReview: reviewStatus[filename] || false, // Use review_status.json instead of metadata
        size: stats.size,
        addedDate: stats.birthtime,
        metadataPath: fs.existsSync(metadataPath) ? metadataPath : null,
      };
    });

    // Sort by latest
    books.sort((a, b) => b.addedDate.getTime() - a.addedDate.getTime());

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error reading books:', error);
    return NextResponse.json({ error: 'Failed to load books' }, { status: 500 });
  }
}
