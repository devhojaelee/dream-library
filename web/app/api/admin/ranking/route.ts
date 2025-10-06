import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getDownloads } from '@/lib/auth';

interface RankingUser {
  username: string;
  email: string;
  totalDownloads: number;
  thisMonthDownloads: number;
  role: string;
}

export async function GET(request: NextRequest) {
  // TODO: 어드민 인증 확인 로직 추가 필요 (현재는 모든 요청 허용)

  try {
    // users.json과 downloads.json 읽기
    const users = getUsers();
    const allDownloads = getDownloads();

    // 이번 달 계산
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 랭킹 데이터 생성
    const rankings: RankingUser[] = users
      .filter((u) => u.approved && u.role !== 'pending') // 승인된 사용자만 (pending 제외)
      .map((u) => {
        // 해당 사용자의 다운로드 필터링
        const userDownloads = allDownloads.filter((d) => d.userId === u.id);
        const totalDownloads = userDownloads.length;

        // 이번 달 다운로드 수 계산
        const thisMonthDownloads = userDownloads.filter((d) => {
          const date = new Date(d.downloadedAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return monthKey === thisMonth;
        }).length;

        return {
          username: u.username,
          email: u.email,
          totalDownloads,
          thisMonthDownloads,
          role: u.role,
        };
      })
      .sort((a, b) => b.totalDownloads - a.totalDownloads); // 전체 다운로드 수로 정렬

    return NextResponse.json({ rankings });
  } catch (error) {
    console.error('Failed to load rankings:', error);
    return NextResponse.json({ error: 'Failed to load rankings' }, { status: 500 });
  }
}
