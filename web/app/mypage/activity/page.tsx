'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Download {
  userId: string;
  bookId: number;
  downloadedAt: string;
  book?: {
    title: string;
    author: string | null;
    year: string | null;
  } | null;
}

interface MonthlyData {
  month: string;
  count: number;
  displayMonth: string;
}

interface YearlyData {
  year: string;
  count: number;
}

interface AuthorData {
  author: string;
  count: number;
}

interface Milestone {
  title: string;
  target: number;
  achieved: boolean;
  icon: string;
}

const COLORS = {
  primary: '#4F46E5', // indigo-600
  secondary: '#818CF8', // indigo-400
  accent: '#06B6D4', // cyan-500
  success: '#10B981', // green-500
  warning: '#F59E0B', // amber-500
  gradient: ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
};

export default function ActivityPage() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m' | 'all'>('12m');
  const [chartType, setChartType] = useState<'monthly' | 'yearly'>('monthly');

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

  // 월별 데이터 집계
  const getMonthlyData = (): MonthlyData[] => {
    const monthlyMap = new Map<string, number>();
    const months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : timeRange === '12m' ? 12 : 24;

    downloads.forEach(download => {
      const date = new Date(download.downloadedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
    });

    const result: MonthlyData[] = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        month: monthKey,
        displayMonth: `${date.getMonth() + 1}월`,
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
      .map(([year, count]) => ({ year: `${year}`, count }))
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

  // 가장 활발했던 달 찾기
  const mostActiveMonth = monthlyData.reduce((prev, current) =>
    current.count > prev.count ? current : prev
  , { month: '', displayMonth: '', count: 0 });

  // 저자별 통계 (TOP 5)
  const getAuthorStats = (): AuthorData[] => {
    const authorMap = new Map<string, number>();

    downloads.forEach(download => {
      const author = download.book?.author;
      if (author && author.trim() !== '') {
        authorMap.set(author, (authorMap.get(author) || 0) + 1);
      }
    });

    return Array.from(authorMap.entries())
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // 독서 마일스톤 계산 (정확히 100단계, 1000권까지, 듀오링고 스타일)
  const getMilestones = (): Milestone[] => {
    const totalBooks = downloads.length;

    const milestones = [
      // 1-50권: 초반 빠른 성취감 (30단계)
      { title: '첫 걸음', target: 1, icon: '🌱' },
      { title: '시작', target: 2, icon: '🚀' },
      { title: '발견', target: 3, icon: '🔍' },
      { title: '탐색', target: 4, icon: '🧭' },
      { title: '다섯 권', target: 5, icon: '✨' },
      { title: '호기심', target: 6, icon: '💡' },
      { title: '성장', target: 7, icon: '🌿' },
      { title: '발전', target: 8, icon: '📈' },
      { title: '아홉 권', target: 9, icon: '⭐' },
      { title: '독서 입문', target: 10, icon: '📚' },
      { title: '꾸준함', target: 12, icon: '💪' },
      { title: '습관 형성', target: 14, icon: '🎯' },
      { title: '열다섯 권', target: 15, icon: '🌟' },
      { title: '지속', target: 17, icon: '🔥' },
      { title: '스무 권', target: 20, icon: '🎉' },
      { title: '탐험가', target: 22, icon: '🗺️' },
      { title: '이십오 권', target: 25, icon: '💫' },
      { title: '책 애호가', target: 27, icon: '📖' },
      { title: '삼십 권', target: 30, icon: '🌈' },
      { title: '독서 여행자', target: 32, icon: '✈️' },
      { title: '서른다섯 권', target: 35, icon: '🎨' },
      { title: '열정', target: 37, icon: '❤️' },
      { title: '마흔 권', target: 40, icon: '🏃' },
      { title: '헌신', target: 42, icon: '💎' },
      { title: '마흔다섯 권', target: 45, icon: '🌸' },
      { title: '거의 쉰 권', target: 47, icon: '🔜' },
      { title: '마흔아홉 권', target: 49, icon: '⚡' },
      { title: '열정 독자', target: 50, icon: '🔥' },
      { title: '지식 수집', target: 52, icon: '📦' },
      { title: '쉰다섯 권', target: 55, icon: '✅' },

      // 56-100권: 빠른 성취감 유지 (20단계)
      { title: '책의 친구', target: 58, icon: '🤝' },
      { title: '예순 권', target: 60, icon: '🎪' },
      { title: '독서 탐구자', target: 63, icon: '🔬' },
      { title: '육십오 권', target: 65, icon: '🌺' },
      { title: '지식의 길', target: 68, icon: '🛤️' },
      { title: '일흔 권', target: 70, icon: '🎭' },
      { title: '독서 장인', target: 73, icon: '⚒️' },
      { title: '일흔다섯 권', target: 75, icon: '🌻' },
      { title: '헌신적 독자', target: 78, icon: '🙏' },
      { title: '여든 권', target: 80, icon: '🎨' },
      { title: '팔십오 권', target: 85, icon: '🌙' },
      { title: '거의 백권', target: 90, icon: '🔜' },
      { title: '아흔다섯 권', target: 95, icon: '⚡' },
      { title: '아흔여덟 권', target: 98, icon: '💫' },
      { title: '백권 달성', target: 100, icon: '💯' },
      { title: '백오 권', target: 105, icon: '🎯' },
      { title: '백십 권', target: 110, icon: '🌟' },
      { title: '백십오 권', target: 115, icon: '✨' },
      { title: '백이십 권', target: 120, icon: '🎪' },
      { title: '백이십오 권', target: 125, icon: '🏆' },

      // 130-200권: 보통 간격 (20단계)
      { title: '백삼십 권', target: 130, icon: '🌈' },
      { title: '백삼십오 권', target: 135, icon: '🎨' },
      { title: '백사십 권', target: 140, icon: '🌸' },
      { title: '지식의 숲', target: 145, icon: '🌲' },
      { title: '백오십 권', target: 150, icon: '🎉' },
      { title: '백오십오 권', target: 155, icon: '💎' },
      { title: '백육십 권', target: 160, icon: '🎭' },
      { title: '백육십오 권', target: 165, icon: '🌺' },
      { title: '백칠십 권', target: 170, icon: '🔥' },
      { title: '백칠십오 권', target: 175, icon: '⭐' },
      { title: '거의 이백권', target: 180, icon: '🔜' },
      { title: '백팔십오 권', target: 185, icon: '💫' },
      { title: '백구십 권', target: 190, icon: '⚡' },
      { title: '백구십오 권', target: 195, icon: '✨' },
      { title: '백구십팔 권', target: 198, icon: '🌟' },
      { title: '이백권 달성', target: 200, icon: '🎊' },
      { title: '이백십 권', target: 210, icon: '🌈' },
      { title: '이백이십 권', target: 220, icon: '🎯' },
      { title: '지혜의 길', target: 230, icon: '🧠' },
      { title: '이백사십 권', target: 240, icon: '💡' },

      // 250-500권: 넓은 간격 (15단계)
      { title: '이백오십 권', target: 250, icon: '🌟' },
      { title: '이백육십 권', target: 260, icon: '🎨' },
      { title: '이백칠십 권', target: 270, icon: '🌸' },
      { title: '거의 삼백권', target: 280, icon: '🔜' },
      { title: '이백구십 권', target: 290, icon: '⚡' },
      { title: '삼백권 달성', target: 300, icon: '🎉' },
      { title: '삼백이십 권', target: 320, icon: '💎' },
      { title: '삼백사십 권', target: 340, icon: '🌺' },
      { title: '삼백육십 권', target: 360, icon: '🎭' },
      { title: '삼백팔십 권', target: 380, icon: '🔥' },
      { title: '사백권 달성', target: 400, icon: '🏆' },
      { title: '사백삼십 권', target: 430, icon: '⭐' },
      { title: '사백육십 권', target: 460, icon: '💫' },
      { title: '거의 오백권', target: 480, icon: '🔜' },
      { title: '오백권 달성', target: 500, icon: '👑' },

      // 520-1000권: 매우 넓은 간격 (15단계)
      { title: '오백삼십 권', target: 530, icon: '🌈' },
      { title: '지식의 바다', target: 560, icon: '🌊' },
      { title: '육백권 달성', target: 600, icon: '💎' },
      { title: '육백오십 권', target: 650, icon: '✨' },
      { title: '칠백권 달성', target: 700, icon: '🎯' },
      { title: '위대한 여정', target: 750, icon: '🗺️' },
      { title: '팔백권 달성', target: 800, icon: '🏆' },
      { title: '독서 항해자', target: 850, icon: '⛵' },
      { title: '구백권 달성', target: 900, icon: '🌟' },
      { title: '구백이십 권', target: 920, icon: '💫' },
      { title: '구백사십 권', target: 940, icon: '⚡' },
      { title: '구백육십 권', target: 960, icon: '✨' },
      { title: '구백팔십 권', target: 980, icon: '🔥' },
      { title: '거의 천권', target: 990, icon: '🔜' },
      { title: '천권 달성', target: 1000, icon: '🎖️' },
    ];

    return milestones.map(m => ({
      ...m,
      achieved: totalBooks >= m.target,
    }));
  };

  // 첫 다운로드 날짜
  const getFirstDownloadDate = (): string | null => {
    if (downloads.length === 0) return null;

    const sortedDownloads = [...downloads].sort((a, b) =>
      new Date(a.downloadedAt).getTime() - new Date(b.downloadedAt).getTime()
    );

    const firstDate = new Date(sortedDownloads[0].downloadedAt);
    return firstDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 다음 마일스톤까지 남은 권수
  const getNextMilestone = (): { target: number; remaining: number; title: string; progress: number } | null => {
    const totalBooks = downloads.length;
    const milestones = getMilestones();

    const nextMilestone = milestones.find(m => !m.achieved);
    if (!nextMilestone) return null;

    return {
      target: nextMilestone.target,
      remaining: nextMilestone.target - totalBooks,
      title: nextMilestone.title,
      progress: (totalBooks / nextMilestone.target) * 100,
    };
  };

  // 평균 월별 다운로드
  const getAverageMonthlyDownloads = (): number => {
    if (downloads.length === 0) return 0;

    const sortedDownloads = [...downloads].sort((a, b) =>
      new Date(a.downloadedAt).getTime() - new Date(b.downloadedAt).getTime()
    );

    const firstDate = new Date(sortedDownloads[0].downloadedAt);
    const now = new Date();
    const monthsDiff = Math.max(1,
      (now.getFullYear() - firstDate.getFullYear()) * 12 +
      (now.getMonth() - firstDate.getMonth()) + 1
    );

    return Math.round(downloads.length / monthsDiff);
  };

  const authorStats = getAuthorStats();
  const milestones = getMilestones();
  const firstDownloadDate = getFirstDownloadDate();
  const nextMilestone = getNextMilestone();
  const avgMonthly = getAverageMonthlyDownloads();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-600 text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">독서 활동 대시보드</h1>
          {firstDownloadDate && (
            <p className="text-sm text-gray-500 mt-1">
              {firstDownloadDate}부터 시작
            </p>
          )}
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          {[
            { value: '3m' as const, label: '3개월' },
            { value: '6m' as const, label: '6개월' },
            { value: '12m' as const, label: '12개월' },
            { value: 'all' as const, label: '전체' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {downloads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 border border-gray-200 text-center">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            아직 다운로드한 책이 없습니다
          </h3>
          <p className="text-gray-500">
            책을 다운로드하면 여기에 독서 활동이 표시됩니다
          </p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg shadow-md p-3 border border-gray-300 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">총 다운로드</div>
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-base shadow-sm">
                  📚
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">{downloads.length}권</div>
              <div className="text-xs font-medium text-gray-600 mt-0.5">전체 기간</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-3 border border-gray-300 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">이번 달</div>
                <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-base shadow-sm">
                  📅
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">{getThisMonthCount()}권</div>
              <div className="text-xs font-medium text-gray-600 mt-0.5">
                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-3 border border-gray-300 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">월평균</div>
                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-base shadow-sm">
                  📊
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">{avgMonthly}권</div>
              <div className="text-xs font-medium text-gray-600 mt-0.5">권/월</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-3 border border-gray-300 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">최다 다운로드</div>
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-base shadow-sm">
                  🔥
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">{mostActiveMonth.count}권</div>
              <div className="text-xs font-medium text-gray-600 mt-0.5">{mostActiveMonth.displayMonth || '-'}</div>
            </div>
          </div>

          {/* Time-based Chart with Toggle */}
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">다운로드 추세</h3>
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartType('monthly')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    chartType === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  월별
                </button>
                <button
                  onClick={() => setChartType('yearly')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    chartType === 'yearly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  연도별
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              {chartType === 'monthly' ? (
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="displayMonth"
                    stroke="#6B7280"
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis
                    stroke="#6B7280"
                    style={{ fontSize: '11px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ fontWeight: 600, color: '#111827' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="다운로드 수"
                  />
                </LineChart>
              ) : (
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="year"
                    stroke="#6B7280"
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis
                    stroke="#6B7280"
                    style={{ fontSize: '11px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ fontWeight: 600, color: '#111827' }}
                  />
                  <Bar
                    dataKey="count"
                    fill={COLORS.primary}
                    radius={[6, 6, 0, 0]}
                    name="다운로드 수"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Top Authors */}
          {authorStats.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">저자 TOP 5</h3>
                <div className="text-xs text-gray-500">전체 다운로드 기준</div>
              </div>

              <div className="space-y-4">
                {authorStats.map((data, index) => {
                  const maxAuthorCount = Math.max(...authorStats.map(a => a.count));
                  return (
                    <div key={data.author} className="group">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                          'bg-gradient-to-br from-indigo-500 to-purple-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                          {data.author}
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {data.count}권
                        </div>
                        <div className="text-xs font-medium text-gray-500 w-12 text-right">
                          {((data.count / downloads.length) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-500 ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                            index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                            index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800' :
                            index === 3 ? 'bg-gradient-to-r from-indigo-500 to-purple-600' :
                            'bg-gradient-to-r from-purple-500 to-pink-600'
                          }`}
                          style={{ width: `${(data.count / maxAuthorCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-200">
                <div className="text-center bg-yellow-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 font-medium mb-1">1위 저자</div>
                  <div className="text-sm font-bold text-gray-900 truncate" title={authorStats[0]?.author}>
                    {authorStats[0]?.author}
                  </div>
                </div>
                <div className="text-center bg-indigo-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 font-medium mb-1">1위 다운로드</div>
                  <div className="text-sm font-bold text-indigo-600">
                    {authorStats[0]?.count}권
                  </div>
                </div>
                <div className="text-center bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 font-medium mb-1">1위 비중</div>
                  <div className="text-sm font-bold text-purple-600">
                    {((authorStats[0]?.count / downloads.length) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 독서 여정 */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">독서 여정</h3>
              <div className="text-sm font-semibold text-gray-500">
                {milestones.filter(m => m.achieved).length} / {milestones.length} 달성
              </div>
            </div>

            {/* Progress Overview */}
            <div className="bg-gray-50 rounded-lg p-5 mb-5 border border-gray-100">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                    현재 단계
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {milestones.filter(m => m.achieved).length === 0
                      ? '시작 전'
                      : milestones[milestones.filter(m => m.achieved).length - 1]?.title
                    }
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                    총 다운로드
                  </div>
                  <div className="text-2xl font-bold text-slate-700">
                    {downloads.length}권
                  </div>
                </div>
              </div>

              {/* Overall Progress Bar */}
              <div className="relative">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-slate-700 transition-all duration-700"
                    style={{ width: `${(milestones.filter(m => m.achieved).length / milestones.length) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-gray-600">0</span>
                  <span className="text-xs font-medium text-gray-600">{milestones.length}</span>
                </div>
              </div>
            </div>

            {/* Next Milestone - Gamified but Professional */}
            {nextMilestone && (
              <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-5 mb-5 overflow-hidden shadow-md">
                {/* Subtle decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {milestones[milestones.filter(m => m.achieved).length]?.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-white opacity-80 uppercase tracking-wider mb-1">
                        다음 목표
                      </div>
                      <div className="text-xl font-bold text-white">
                        {nextMilestone.title}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">
                        {nextMilestone.remaining}
                      </div>
                      <div className="text-xs font-semibold text-white opacity-80">
                        권 남음
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-white bg-opacity-20 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-500"
                        style={{ width: `${nextMilestone.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-white text-xs font-medium opacity-90">
                      <span>{downloads.length} / {nextMilestone.target}</span>
                      <span>{nextMilestone.progress.toFixed(0)}%</span>
                    </div>
                  </div>

                  {nextMilestone.remaining <= 5 && (
                    <div className="mt-3 bg-yellow-400 bg-opacity-90 rounded-lg px-3 py-2">
                      <p className="text-xs font-bold text-gray-900 text-center">
                        🔥 거의 다 왔어요! 단 {nextMilestone.remaining}권!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Milestone Cards - Balanced */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {(() => {
                const achievedCount = milestones.filter(m => m.achieved).length;
                const visibleMilestones = milestones.slice(
                  Math.max(0, achievedCount - 1),
                  achievedCount + 2
                );

                return visibleMilestones.map((milestone, idx) => {
                  const actualIndex = Math.max(0, achievedCount - 1) + idx;
                  const isNext = !milestone.achieved && idx === visibleMilestones.findIndex(m => !m.achieved);

                  return (
                    <div
                      key={milestone.target}
                      className={`relative rounded-lg p-3 text-center transition-all duration-300 ${
                        milestone.achieved
                          ? 'bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                          : isNext
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-500'
                          : 'bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      {milestone.achieved && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-400 flex items-center justify-center shadow-md">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {isNext && (
                        <div className="absolute -top-1.5 -right-1.5 bg-slate-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                          NEXT
                        </div>
                      )}
                      <div className={`text-[10px] font-semibold mb-1 ${
                        milestone.achieved ? 'text-white opacity-80' :
                        isNext ? 'text-amber-700' : 'text-gray-500'
                      }`}>
                        {actualIndex + 1}단계
                      </div>
                      <div className="text-2xl mb-1">{milestone.icon}</div>
                      <div className={`text-base font-bold ${
                        milestone.achieved ? 'text-white' :
                        isNext ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {milestone.target}
                      </div>
                      <div className={`text-[10px] font-semibold ${
                        milestone.achieved ? 'text-white opacity-90' :
                        isNext ? 'text-amber-700' : 'text-gray-400'
                      }`}>
                        {milestone.title}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-gray-200">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  월평균 페이스
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {avgMonthly}
                </div>
                <div className="text-xs font-medium text-gray-500 mt-1">
                  권/월
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  {nextMilestone ? '다음 목표까지' : '전체 달성'}
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {nextMilestone ? nextMilestone.remaining : milestones.length}
                </div>
                <div className="text-xs font-medium text-gray-500 mt-1">
                  {nextMilestone ? '권' : '개'}
                </div>
              </div>
            </div>

            {!nextMilestone && downloads.length > 0 && (
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-200 rounded-lg p-6 text-center mt-5">
                <div className="text-5xl mb-3">🏆</div>
                <div className="text-xl font-bold text-gray-900 mb-2">
                  모든 마일스톤 달성!
                </div>
                <div className="text-sm text-gray-600">
                  천권을 달성한 진정한 독서가입니다
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
