import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/auth';

export async function GET() {
  try {
    // TODO: 어드민 인증 확인 로직 추가 필요 (현재는 모든 요청 허용)

    const users = getUsers();

    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        approved: u.approved,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
