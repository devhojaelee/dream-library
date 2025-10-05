import { NextRequest, NextResponse } from 'next/server';
import { approveUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // TODO: 어드민 인증 확인 로직 추가 필요

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const success = approveUser(userId);

    if (!success) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: '사용자가 승인되었습니다' });
  } catch (error) {
    console.error('Approve user error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
