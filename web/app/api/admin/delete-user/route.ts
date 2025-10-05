import { NextRequest, NextResponse } from 'next/server';
import { rejectUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // TODO: 어드민 인증 확인 로직 추가 필요

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다' }, { status: 400 });
    }

    const success = rejectUser(userId);

    if (!success) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: '사용자가 삭제되었습니다' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
