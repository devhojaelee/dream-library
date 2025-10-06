import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ReviewStatus {
  [filename: string]: boolean; // filename -> needs_review
}

export async function POST(request: NextRequest) {
  try {
    const { filename, needsReview } = await request.json();

    if (!filename || typeof needsReview !== 'boolean') {
      return NextResponse.json(
        { error: 'filename과 needsReview가 필요합니다' },
        { status: 400 }
      );
    }

    // Use writable data directory instead of read-only books directory
    const dataDir = path.join(process.cwd(), 'data');
    const reviewStatusPath = path.join(dataDir, 'review_status.json');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Read existing review status
    let reviewStatus: ReviewStatus = {};
    if (fs.existsSync(reviewStatusPath)) {
      const content = fs.readFileSync(reviewStatusPath, 'utf-8');
      reviewStatus = JSON.parse(content);
    }

    // Update review status
    if (needsReview) {
      reviewStatus[filename] = true;
    } else {
      delete reviewStatus[filename]; // Remove if not needed for review
    }

    // Save review status
    fs.writeFileSync(reviewStatusPath, JSON.stringify(reviewStatus, null, 2));

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
