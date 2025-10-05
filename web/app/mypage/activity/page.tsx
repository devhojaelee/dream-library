'use client';

import { useEffect, useState } from 'react';

interface Download {
  userId: string;
  bookId: number;
  downloadedAt: string;
}

interface MonthlyData {
  month: string;
  count: number;
}

interface YearlyData {
  year: string;
  count: number;
}

export default function ActivityPage() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDownloads = async () => {
      try {
        const res = await fetch('/api/downloads/history');
        const data = await res.json();
        if (data.downloads) {
          setDownloads(data.downloads);
        }
      } catch (error) {
        console.error('Failed to load downloads:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDownloads();
  }, []);

  // 월별 데이터 집계 (최근 12개월)
  const getMonthlyData = (): MonthlyData[] => {
    const monthlyMap = new Map<string, number>();

    downloads.forEach(download => {
      const date = new Date(download.downloadedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
    });

    // 최근 12개월 생성
    const result: MonthlyData[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        month: `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
        count: monthlyMap.get(monthKey) || 0,
      });
    }

    return result;
  };

  // 연도별 데이터 집계
  const getYearlyData = (): YearlyData[] => {
    const yearlyMap = new Map<string, number>();

    downloads.forEach(download => {
      const date = new Date(download.downloadedAt);
      const year = String(date.getFullYear());
      yearlyMap.set(year, (yearlyMap.get(year) || 0) + 1);
    });

    return Array.from(yearlyMap.entries())
      .map(([year, count]) => ({ year: `${year}년`, count }))
      .sort((a, b) => a.year.localeCompare(b.year));
  };

  // 이번 달 다운로드 수
  const getThisMonthCount = (): number => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return downloads.filter(download => {
      const date = new Date(download.downloadedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === thisMonth;
    }).length;
  };

  const monthlyData = getMonthlyData();
  const yearlyData = getYearlyData();
  const maxMonthly = Math.max(...monthlyData.map(d => d.count), 1);
  const maxYearly = Math.max(...yearlyData.map(d => d.count), 1);

  // 가장 활발했던 달 찾기
  const mostActiveMonth = monthlyData.reduce((prev, current) =>
    current.count > prev.count ? current : prev
  , { month: '', count: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-800 text-lg font-medium">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">독서 활동</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-300">
          <div className="text-sm font-semibold text-gray-600 mb-2">총 다운로드</div>
          <div className="text-3xl font-bold text-purple-600">{downloads.length}권</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-300">
          <div className="text-sm font-semibold text-gray-600 mb-2">이번 달</div>
          <div className="text-3xl font-bold text-blue-600">{getThisMonthCount()}권</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-300">
          <div className="text-sm font-semibold text-gray-600 mb-2">가장 활발했던 달</div>
          {mostActiveMonth.count > 0 ? (
            <>
              <div className="text-3xl font-bold text-green-600 mb-1">{mostActiveMonth.count}권</div>
              <div className="text-sm font-semibold text-gray-700">{mostActiveMonth.month}</div>
            </>
          ) : (
            <div className="text-3xl font-bold text-green-600">0권</div>
          )}
        </div>
      </div>

      {downloads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 border border-gray-300 text-center">
          <div className="text-gray-500 text-lg">아직 다운로드한 책이 없습니다.</div>
          <div className="text-gray-400 text-sm mt-2">책을 다운로드하면 여기에 독서 활동이 표시됩니다.</div>
        </div>
      ) : (
        <>
          {/* Monthly Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-300 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">월별 다운로드 (최근 12개월)</h3>
            <div className="space-y-3">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-700 font-medium">{data.month}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full flex items-center justify-end px-3 transition-all duration-500"
                      style={{ width: `${(data.count / maxMonthly) * 100}%` }}
                    >
                      {data.count > 0 && (
                        <span className="text-white text-sm font-semibold">{data.count}권</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Yearly Chart */}
          {yearlyData.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-300">
              <h3 className="text-lg font-bold text-gray-900 mb-6">연도별 다운로드</h3>
              <div className="space-y-3">
                {yearlyData.map((data) => (
                  <div key={data.year} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-700 font-medium">{data.year}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-10 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end px-4 transition-all duration-500"
                        style={{ width: `${(data.count / maxYearly) * 100}%` }}
                      >
                        <span className="text-white text-base font-semibold">{data.count}권</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
