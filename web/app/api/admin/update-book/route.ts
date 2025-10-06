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
    const coverImageUrl = formData.get('coverImageUrl') as string | null;

    console.log('Update book request:', { filename, title, author, year, coverImageUrl });

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

      // Update metadata with cover filename and timestamp
      metadata.cover = coverFilename;
      metadata.cover_updated = Date.now().toString();
    } else if (coverImageUrl) {
      // Handle cover image download from URL (네이버 검색 결과)
      console.log('Downloading cover from URL:', coverImageUrl);
      try {
        const imgResponse = await fetch(coverImageUrl);
        console.log('Image fetch response status:', imgResponse.status);

        if (imgResponse.ok) {
          const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
          console.log('Image downloaded, size:', imgBuffer.length);

          // Detect image type from content
          let ext = 'jpg';
          const contentType = imgResponse.headers.get('content-type');
          if (contentType?.includes('png')) {
            ext = 'png';
          } else if (contentType?.includes('webp')) {
            ext = 'webp';
          }

          const coverFilename = `${baseFilename}.${ext}`;
          const coverPath = path.join(coversDir, coverFilename);

          // Save image file
          fs.writeFileSync(coverPath, imgBuffer);
          console.log('Cover saved successfully:', coverFilename);

          // Update metadata with cover filename and timestamp
          metadata.cover = coverFilename;
          metadata.cover_updated = Date.now().toString();
        } else {
          console.error('Image fetch failed with status:', imgResponse.status);
        }
      } catch (err) {
        console.error('Failed to download cover image from URL:', err);
        // Don't fail the entire request if image download fails
      }
    }

    // Save metadata
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // Clear review status when book is edited (신고 마크 해제)
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const reviewStatusPath = path.join(dataDir, 'review_status.json');

      if (fs.existsSync(reviewStatusPath)) {
        const reviewStatus = JSON.parse(fs.readFileSync(reviewStatusPath, 'utf-8'));

        // Remove this book from review list
        if (reviewStatus[filename]) {
          delete reviewStatus[filename];
          fs.writeFileSync(reviewStatusPath, JSON.stringify(reviewStatus, null, 2));
          console.log(`Cleared review status for: ${filename}`);
        }
      }
    } catch (err) {
      console.error('Failed to clear review status:', err);
      // Don't fail the entire request if review status update fails
    }

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
