import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const filename = formData.get('filename') as string;
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const year = formData.get('year') as string;
    const description = formData.get('description') as string;
    const coverFile = formData.get('coverImage') as File | null;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const booksDir = process.env.BOOKS_DIR || path.join(process.cwd(), '..', 'books');
    const metadataDir = path.join(booksDir, 'metadata');
    const coversDir = path.join(booksDir, 'covers');

    // Create directories if they don't exist
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true });
    }
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true });
    }

    const baseFilename = filename.replace('.epub', '');
    const metadataPath = path.join(metadataDir, `${baseFilename}.json`);

    // Read existing metadata if it exists
    let metadata: Record<string, string> = {};
    if (fs.existsSync(metadataPath)) {
      const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
      metadata = JSON.parse(metadataContent);
    }

    // Update metadata
    if (title) metadata.title = title;
    if (author) metadata.author = author;
    if (year) metadata.year = year;
    if (description) metadata.description = description;

    // Handle cover image upload
    if (coverFile && coverFile.size > 0) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      if (!allowedTypes.includes(coverFile.type)) {
        return NextResponse.json(
          { error: 'Invalid image format. Allowed: JPG, PNG, WEBP' },
          { status: 400 }
        );
      }

      // Max file size: 5MB
      if (coverFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Image too large. Max size: 5MB' },
          { status: 400 }
        );
      }

      // Get file extension
      const ext = coverFile.type.split('/')[1];
      const coverFilename = `${baseFilename}.${ext}`;
      const coverPath = path.join(coversDir, coverFilename);

      // Save image file
      const bytes = await coverFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      fs.writeFileSync(coverPath, buffer);

      // Update metadata with cover filename
      metadata.cover = coverFilename;
    }

    // Save metadata
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Book metadata updated successfully',
      metadata,
    });
  } catch (error) {
    console.error('Error updating book metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update book metadata' },
      { status: 500 }
    );
  }
}
