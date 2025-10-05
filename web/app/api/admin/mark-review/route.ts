import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { filename, needsReview } = await request.json();

    if (!filename || typeof needsReview !== 'boolean') {
      return NextResponse.json(
        { error: 'filename과 needsReview가 필요합니다' },
        { status: 400 }
      );
    }

    const booksDir = process.env.BOOKS_DIR || path.join(process.cwd(), '..', 'books');
    const metadataDir = path.join(booksDir, 'metadata');

    const baseFilename = filename.replace('.epub', '');
    const metadataPath = path.join(metadataDir, `${baseFilename}.json`);

    // 기존 메타데이터 읽기
    let metadata: Record<string, string | boolean | number> = {};
    if (fs.existsSync(metadataPath)) {
      const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
      metadata = JSON.parse(metadataContent);
    }

    // needs_review 필드 업데이트
    metadata.needs_review = needsReview;

    // 메타데이터 저장
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true });
    }

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return NextResponse.json({
      success: true,
      message: needsReview ? '검토 필요로 표시했습니다' : '검토 완료로 표시했습니다',
    });
  } catch (error) {
    console.error('Error marking review status:', error);
    return NextResponse.json(
      { error: '검토 상태 변경 실패' },
      { status: 500 }
    );
  }
}
