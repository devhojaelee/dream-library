import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  downloadHistory?: { bookId: number; downloadedAt: string }[];
}

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
    // users.json 읽기
    const usersData = fs.readFileSync(USERS_FILE, 'utf-8');
    const users: User[] = JSON.parse(usersData);

    // 이번 달 계산
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 랭킹 데이터 생성
    const rankings: RankingUser[] = users
      .filter((u) => u.role !== 'pending') // pending 사용자 제외
      .map((u) => {
        const downloadHistory = u.downloadHistory || [];
        const totalDownloads = downloadHistory.length;

        // 이번 달 다운로드 수 계산
        const thisMonthDownloads = downloadHistory.filter((d) => {
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
