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

export default function AnalyticsPage() {
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
      <div className="bg-white rounded-lg border border-gray-200 p-8 md:p-12 text-center">
        <div className="text-gray-400 text-lg mb-2">📊</div>
        <p className="text-gray-600">분석 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">통계</h1>
        <p className="text-sm md:text-base text-gray-600">사용자 활동 및 다운로드 분석</p>
      </div>

      {/* KPI Overview Cards - Grid responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Users */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="text-xs md:text-sm font-medium text-gray-600 mb-1 md:mb-2">총 사용자</div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{analytics.userEngagement.totalUsers}</div>
          <div className="text-xs text-gray-500">승인된 사용자</div>
        </div>

        {/* DAU */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="text-xs md:text-sm font-medium text-gray-600 mb-1 md:mb-2">일일 활성 사용자</div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{analytics.userEngagement.dailyActiveUsers}</div>
          <div className="text-xs text-gray-500">24시간 내</div>
        </div>

        {/* MAU */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="text-xs md:text-sm font-medium text-gray-600 mb-1 md:mb-2">월간 활성 사용자</div>
          <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">{analytics.userEngagement.monthlyActiveUsers}</div>
          <div className="text-xs text-gray-500">30일 내</div>
        </div>

        {/* Active Rate */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <div className="text-xs md:text-sm font-medium text-gray-600 mb-1 md:mb-2">활성 사용자 비율</div>
          <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">{analytics.userEngagement.activeUserRate}%</div>
          <div className="text-xs text-gray-500">MAU / 총</div>
        </div>
      </div>

      {/* Download Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <h2 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">다운로드 통계</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center p-3 md:p-4 bg-gray-50 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-gray-900">{analytics.downloads.total}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">전체</div>
          </div>
          <div className="text-center p-3 md:p-4 bg-blue-50 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-blue-600">{analytics.downloads.today}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">오늘</div>
          </div>
          <div className="text-center p-3 md:p-4 bg-green-50 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-green-600">{analytics.downloads.thisWeek}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">이번 주</div>
          </div>
          <div className="text-center p-3 md:p-4 bg-purple-50 rounded-lg">
            <div className="text-xl md:text-2xl font-bold text-purple-600">{analytics.downloads.thisMonth}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">이번 달</div>
          </div>
        </div>
      </div>

      {/* Device & UI Mode Distribution - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Device Type */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <h2 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">기기별 다운로드</h2>
          {Object.keys(analytics.downloads.byDeviceType).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">데이터가 없습니다.</p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {Object.entries(analytics.downloads.byDeviceType)
                .sort(([, a], [, b]) => b - a)
                .map(([device, count]) => {
                  const total = analytics.downloads.total;
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  const deviceName = device === 'desktop' ? '데스크톱' :
                                     device === 'mobile' ? '모바일' :
                                     device === 'tablet' ? '태블릿' :
                                     device === 'eink' ? 'E-ink' : device;
                  return (
                    <div key={device}>
                      <div className="flex justify-between text-xs md:text-sm mb-1 md:mb-2">
                        <span className="font-medium text-gray-700">{deviceName}</span>
                        <span className="text-gray-600">{count}회 ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 md:h-2.5">
                        <div
                          className="bg-blue-600 h-2 md:h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* UI Mode */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
          <h2 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">UI 모드별 다운로드</h2>
          {Object.keys(analytics.downloads.byUIMode).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">데이터가 없습니다.</p>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {Object.entries(analytics.downloads.byUIMode)
                .sort(([, a], [, b]) => b - a)
                .map(([mode, count]) => {
                  const total = analytics.downloads.total;
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  const modeName = mode === 'eink' ? 'E-ink 모드' :
                                   mode === 'standard' ? '일반 모드' : mode;
                  return (
                    <div key={mode}>
                      <div className="flex justify-between text-xs md:text-sm mb-1 md:mb-2">
                        <span className="font-medium text-gray-700">{modeName}</span>
                        <span className="text-gray-600">{count}회 ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 md:h-2.5">
                        <div
                          className="bg-green-600 h-2 md:h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Popular Books - Desktop Table, Mobile Cards */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <h2 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">인기 책 TOP 10</h2>
        {analytics.popularBooks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">다운로드된 책이 없습니다.</p>
        ) : (
          <>
            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">순위</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">제목</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">저자</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">다운로드</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.popularBooks.map((book, index) => {
                    const rank = index + 1;
                    let rankBadge = '';
                    if (rank === 1) rankBadge = '🥇';
                    else if (rank === 2) rankBadge = '🥈';
                    else if (rank === 3) rankBadge = '🥉';

                    return (
                      <tr key={book.bookId} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{rank}</span>
                            {rankBadge && <span className="text-lg">{rankBadge}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {book.bookTitle || `책 ID ${book.bookId}`}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {book.bookAuthor || '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {book.downloadCount}회
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: Cards */}
            <div className="md:hidden space-y-3">
              {analytics.popularBooks.map((book, index) => {
                const rank = index + 1;
                let rankBadge = '';
                if (rank === 1) rankBadge = '🥇';
                else if (rank === 2) rankBadge = '🥈';
                else if (rank === 3) rankBadge = '🥉';

                return (
                  <div key={book.bookId} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-gray-900">{rank}</span>
                        {rankBadge && <span className="text-xl">{rankBadge}</span>}
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {book.downloadCount}회
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {book.bookTitle || `책 ID ${book.bookId}`}
                    </div>
                    <div className="text-xs text-gray-600">
                      {book.bookAuthor || '저자 미상'}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Session Analytics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <h2 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">세션 분석</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="text-center p-3 md:p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-xl md:text-2xl font-bold text-orange-600">{analytics.sessionAnalytics.totalSessions}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">총 세션 수</div>
            <div className="text-xs text-gray-500 mt-0.5">고유 방문</div>
          </div>
          <div className="text-center p-3 md:p-4 bg-pink-50 rounded-lg border border-pink-200">
            <div className="text-xl md:text-2xl font-bold text-pink-600">{analytics.sessionAnalytics.averageBooksPerSession}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">세션당 평균 다운로드</div>
            <div className="text-xs text-gray-500 mt-0.5">권/세션</div>
          </div>
        </div>
      </div>
    </div>
  );
}
