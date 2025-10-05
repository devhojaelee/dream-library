'use client';

import { useEffect, useState } from 'react';

interface RankingUser {
  username: string;
  email: string;
  totalDownloads: number;
  thisMonthDownloads: number;
  role: string;
}

export default function AdminRankingPage() {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRankings = async () => {
      try {
        const res = await fetch('/api/admin/ranking');
        const data = await res.json();
        if (data.rankings) {
          setRankings(data.rankings);
        }
      } catch (error) {
        console.error('Failed to load rankings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRankings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">사용자 랭킹</h1>
        <p className="text-gray-600">다운로드 수 기반 사용자 랭킹입니다.</p>
      </div>

      {rankings.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-lg mb-2">📊</div>
          <p className="text-gray-600">등록된 사용자가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    순위
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    사용자명
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    전체 다운로드
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    이번 달
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    권한
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rankings.map((user, index) => {
                  const rank = index + 1;
                  let rankEmoji = '';
                  let rankClass = '';

                  if (rank === 1) {
                    rankEmoji = '🥇';
                    rankClass = 'bg-yellow-50';
                  } else if (rank === 2) {
                    rankEmoji = '🥈';
                    rankClass = 'bg-gray-50';
                  } else if (rank === 3) {
                    rankEmoji = '🥉';
                    rankClass = 'bg-orange-50';
                  }

                  return (
                    <tr key={user.email} className={`hover:bg-gray-50 transition-colors ${rankClass}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-lg font-bold text-gray-700">{rank}</span>
                          {rankEmoji && <span className="text-xl">{rankEmoji}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-semibold text-blue-600">
                            {user.totalDownloads}
                          </span>
                          <span className="text-xs text-gray-500">권</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-semibold text-purple-600">
                            {user.thisMonthDownloads}
                          </span>
                          <span className="text-xs text-gray-500">권</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {user.role === 'admin' ? '관리자' : '일반'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 통계 요약 */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                총 <span className="font-semibold text-gray-900">{rankings.length}</span>명의 사용자
              </div>
              <div className="text-gray-600">
                전체 다운로드:{' '}
                <span className="font-semibold text-blue-600">
                  {rankings.reduce((sum, u) => sum + u.totalDownloads, 0)}
                </span>
                권
              </div>
              <div className="text-gray-600">
                이번 달 다운로드:{' '}
                <span className="font-semibold text-purple-600">
                  {rankings.reduce((sum, u) => sum + u.thisMonthDownloads, 0)}
                </span>
                권
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
