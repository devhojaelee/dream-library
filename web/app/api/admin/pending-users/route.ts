import { NextResponse } from 'next/server';
import { getPendingUsers } from '@/lib/auth';

export async function GET() {
  try {
    // TODO: 어드민 인증 확인 로직 추가 필요 (현재는 모든 요청 허용)

    const pendingUsers = getPendingUsers();

    return NextResponse.json({
      success: true,
      users: pendingUsers.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get pending users error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
