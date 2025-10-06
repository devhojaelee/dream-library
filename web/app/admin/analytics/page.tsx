'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  userEngagement: {
    totalUsers: number;
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    activeUserRate: number;
  };
  downloads: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byDeviceType: Record<string, number>;
    byUIMode: Record<string, number>;
  };
  popularBooks: Array<{
    bookId: number;
    bookTitle?: string;
    bookAuthor?: string;
    downloadCount: number;
  }>;
  sessionAnalytics: {
    totalSessions: number;
    averageBooksPerSession: number;
  };
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        const data = await res.json();
        if (data.analytics) {
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">분석 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">분석 대시보드</h1>
        <p className="text-gray-600">사용자 활동 및 다운로드 통계</p>
      </div>

      {/* User Engagement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">총 사용자</div>
          <div className="text-3xl font-bold text-gray-900">{analytics.userEngagement.totalUsers}</div>
          <div className="text-xs text-gray-500 mt-1">승인된 사용자</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">일일 활성 사용자</div>
          <div className="text-3xl font-bold text-blue-600">{analytics.userEngagement.dailyActiveUsers}</div>
          <div className="text-xs text-gray-500 mt-1">24시간 내 로그인</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">월간 활성 사용자</div>
          <div className="text-3xl font-bold text-green-600">{analytics.userEngagement.monthlyActiveUsers}</div>
          <div className="text-xs text-gray-500 mt-1">30일 내 로그인</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-600 mb-1">활성 사용자 비율</div>
          <div className="text-3xl font-bold text-purple-600">{analytics.userEngagement.activeUserRate}%</div>
          <div className="text-xs text-gray-500 mt-1">MAU / 총 사용자</div>
        </div>
      </div>

      {/* Download Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">다운로드 통계</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{analytics.downloads.total}</div>
            <div className="text-sm text-gray-600 mt-1">전체</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analytics.downloads.today}</div>
            <div className="text-sm text-gray-600 mt-1">오늘</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analytics.downloads.thisWeek}</div>
            <div className="text-sm text-gray-600 mt-1">이번 주</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{analytics.downloads.thisMonth}</div>
            <div className="text-sm text-gray-600 mt-1">이번 달</div>
          </div>
        </div>
      </div>

      {/* Device & UI Mode Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Type */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">기기별 다운로드</h2>
          <div className="space-y-3">
            {Object.entries(analytics.downloads.byDeviceType).map(([device, count]) => {
              const total = analytics.downloads.total;
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={device}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 capitalize">{device}</span>
                    <span className="text-gray-600">{count}회 ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* UI Mode */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">UI 모드별 다운로드</h2>
          <div className="space-y-3">
            {Object.entries(analytics.downloads.byUIMode).map(([mode, count]) => {
              const total = analytics.downloads.total;
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const modeName = mode === 'eink' ? 'E-ink 모드' : mode === 'standard' ? '일반 모드' : mode;
              return (
                <div key={mode}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{modeName}</span>
                    <span className="text-gray-600">{count}회 ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popular Books */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">인기 책 TOP 10</h2>
        {analytics.popularBooks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">다운로드된 책이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">순위</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">제목</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">저자</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">다운로드</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.popularBooks.map((book, index) => (
                  <tr key={book.bookId} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      <span className="font-bold text-gray-900">{index + 1}</span>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {book.bookTitle || `책 ID ${book.bookId}`}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {book.bookAuthor || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {book.downloadCount}회
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Analytics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">세션 분석</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{analytics.sessionAnalytics.totalSessions}</div>
            <div className="text-sm text-gray-600 mt-1">총 세션 수</div>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">{analytics.sessionAnalytics.averageBooksPerSession}</div>
            <div className="text-sm text-gray-600 mt-1">세션당 평균 다운로드</div>
          </div>
        </div>
      </div>
    </div>
  );
}
