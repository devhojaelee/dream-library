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
  userSegmentation: {
    powerUsers: number;
    regularReaders: number;
    casualReaders: number;
    atRisk: number;
    churned: number;
    segmentDistribution: Record<string, number>;
  };
  retentionMetrics: {
    d1Retention: number;
    d7Retention: number;
    d30Retention: number;
  };
  cohortAnalysis: Array<{
    cohortWeek: string;
    signupCount: number;
    week1Retention: number;
    week2Retention: number;
    week3Retention: number;
    week4Retention: number;
  }>;
  contentAnalytics: {
    genreDistribution: Record<string, number>;
    catalogCoverage: {
      totalBooks: number;
      downloadedBooks: number;
      coveragePercentage: number;
    };
    contentLifecycle: {
      hitConcentration: number;
      longTailValue: number;
    };
  };
  platformMetrics: {
    einkAdoptionRate: number;
    crossPlatformUsers: number;
    sessionQualityByPlatform: Record<string, {
      avgDownloadsPerSession: number;
      sessionCount: number;
    }>;
  };
  predictiveInsights: {
    churnRiskScore: {
      highRisk: number;
      mediumRisk: number;
      lowRisk: number;
    };
    growthMomentum: {
      userGrowthRate: number;
      downloadGrowthRate: number;
    };
  };
}

type SystemHealth = 'healthy' | 'warning' | 'critical';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isDesktop, setIsDesktop] = useState(false);

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

    // Check if desktop on client side
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Calculate system health
  const getSystemHealth = (): SystemHealth => {
    if (!analytics?.predictiveInsights?.churnRiskScore) return 'warning';

    const criticalIssues = analytics.predictiveInsights.churnRiskScore.highRisk;
    const retentionHealth = analytics.retentionMetrics.d7Retention;

    if (criticalIssues >= 5 || retentionHealth < 40) return 'critical';
    if (criticalIssues >= 2 || retentionHealth < 60) return 'warning';
    return 'healthy';
  };

  const getTrendIndicator = (value: number) => {
    if (value > 0) return { icon: '↑', color: 'text-green-600', bg: 'bg-green-50' };
    if (value < 0) return { icon: '↓', color: 'text-red-600', bg: 'bg-red-50' };
    return { icon: '→', color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터 로딩중...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center max-w-md">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">분석 데이터를 불러올 수 없습니다</h3>
          <p className="text-gray-600 text-sm">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  const systemHealth = getSystemHealth();
  const healthConfig = {
    healthy: {
      icon: '🟢',
      text: '정상 운영',
      subtext: '모든 지표 안정',
      bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
      border: 'border-green-200'
    },
    warning: {
      icon: '🟡',
      text: '주의 필요',
      subtext: '일부 지표 확인 필요',
      bg: 'bg-gradient-to-r from-yellow-500 to-amber-600',
      border: 'border-yellow-200'
    },
    critical: {
      icon: '🔴',
      text: '즉시 조치 필요',
      subtext: '긴급 조치 필요',
      bg: 'bg-gradient-to-r from-red-500 to-rose-600',
      border: 'border-red-200'
    }
  };

  const config = healthConfig[systemHealth];
  const userGrowthTrend = getTrendIndicator(analytics.predictiveInsights?.growthMomentum?.userGrowthRate ?? 0);
  const downloadGrowthTrend = getTrendIndicator(analytics.predictiveInsights?.growthMomentum?.downloadGrowthRate ?? 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* ========== HERO: 운영 현황 ========== */}
      <div className={`${config.bg} text-white px-6 py-8 md:py-12 mb-6 md:mb-8 shadow-lg`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl md:text-6xl">{config.icon}</span>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold">{config.text}</h1>
                  <p className="text-white/90 text-sm md:text-base mt-1">{config.subtext}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 text-white/80 text-sm">
              마지막 업데이트: {new Date().toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8 overflow-x-hidden">

        {/* ========== DESKTOP: 주요 알림 + 핵심 지표 ========== */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {/* 주요 알림 - 1/3 width */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🚨 주요 알림 (Critical Alerts)</h2>
            <div className="space-y-3">
              {analytics.predictiveInsights?.churnRiskScore?.highRisk > 0 && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-red-900">이탈 고위험군 (High Risk)</div>
                      <div className="text-xs text-red-700 mt-1">즉시 조치 필요</div>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {analytics.predictiveInsights?.churnRiskScore?.highRisk ?? 0}
                    </div>
                  </div>
                </div>
              )}

              {analytics.retentionMetrics?.d7Retention < 60 && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-amber-900">리텐션 저조</div>
                      <div className="text-xs text-amber-700 mt-1">D7 목표치 미달 (60%)</div>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                      {analytics.retentionMetrics.d7Retention}%
                    </div>
                  </div>
                </div>
              )}

              {analytics.predictiveInsights?.churnRiskScore?.highRisk === 0 && analytics.retentionMetrics?.d7Retention >= 60 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <div className="text-3xl mb-2">✓</div>
                  <div className="text-sm font-medium text-green-900">문제 없음</div>
                  <div className="text-xs text-green-700 mt-1">모든 지표 정상 범위</div>
                </div>
              )}
            </div>
          </div>

          {/* 핵심 지표 - 2/3 width */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {/* MAU */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">월간 활성 사용자 (MAU)</div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-gray-900">{analytics.userEngagement.monthlyActiveUsers}</div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${userGrowthTrend.bg} ${userGrowthTrend.color}`}>
                  <span>{userGrowthTrend.icon}</span>
                  <span>{Math.abs(analytics.predictiveInsights.growthMomentum.userGrowthRate)}%</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                전체의 {analytics.userEngagement.activeUserRate.toFixed(1)}%
              </div>
            </div>

            {/* DAU */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">일간 활성 사용자 (DAU)</div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-gray-900">{analytics.userEngagement.dailyActiveUsers}</div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                최근 24시간
              </div>
            </div>

            {/* Downloads */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">총 다운로드 (Total Downloads)</div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-gray-900">{analytics.downloads.total.toLocaleString()}</div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${downloadGrowthTrend.bg} ${downloadGrowthTrend.color}`}>
                  <span>{downloadGrowthTrend.icon}</span>
                  <span>{Math.abs(analytics.predictiveInsights.growthMomentum.downloadGrowthRate)}%</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                이번 주 {analytics.downloads.thisWeek}건
              </div>
            </div>

            {/* Retention */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">D7 리텐션</div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-gray-900">{analytics.retentionMetrics.d7Retention}%</div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                D1: {analytics.retentionMetrics.d1Retention}% | D30: {analytics.retentionMetrics.d30Retention}%
              </div>
            </div>
          </div>
        </div>

        {/* ========== MOBILE: 상태 + 주요 지표 ========== */}
        <div className="lg:hidden space-y-4">
          {/* Critical Alert */}
          {analytics.predictiveInsights?.churnRiskScore?.highRisk > 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="text-3xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-900 mb-1">주의 필요</h3>
                  <p className="text-sm text-red-700 mb-3">
                    {analytics.predictiveInsights?.churnRiskScore?.highRisk ?? 0}명이 이탈 위험 상태입니다
                  </p>
                  <button className="w-full bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition">
                    자세히 보기 →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">📊 주요 지표</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <div className="text-sm text-gray-600">MAU</div>
                  <div className="text-2xl font-bold text-gray-900">{analytics.userEngagement.monthlyActiveUsers}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${userGrowthTrend.bg} ${userGrowthTrend.color}`}>
                  {userGrowthTrend.icon} {Math.abs(analytics.predictiveInsights.growthMomentum.userGrowthRate)}%
                </div>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <div className="text-sm text-gray-600">DAU</div>
                  <div className="text-2xl font-bold text-gray-900">{analytics.userEngagement.dailyActiveUsers}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">D7 리텐션</div>
                  <div className="text-2xl font-bold text-gray-900">{analytics.retentionMetrics.d7Retention}%</div>
                </div>
                <div className={`text-sm font-semibold ${analytics.retentionMetrics.d7Retention >= 60 ? 'text-green-600' : 'text-amber-600'}`}>
                  {analytics.retentionMetrics.d7Retention >= 60 ? '양호' : '개선필요'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 콘텐츠 성과 - Responsive */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h2 className="text-base lg:text-lg font-bold text-gray-900 mb-3 lg:mb-4">📚 콘텐츠 성과</h2>
          <div>
            {/* Desktop: 2-column grid */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">인기 도서 TOP 5</h3>
                <div className="space-y-2">
                  {analytics.popularBooks.slice(0, 5).map((book, idx) => (
                    <div key={book.bookId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                      <div className="text-lg font-bold text-gray-400 w-6">{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2 md:line-clamp-1">
                          {book.bookTitle || `책 ID ${book.bookId}`}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{book.bookAuthor || '저자 미상'}</div>
                      </div>
                      <div className="text-sm font-semibold text-indigo-600">{book.downloadCount}회</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">콘텐츠 지표 (Content Metrics)</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="text-xs font-medium text-gray-700">히트 집중도 (Hit Concentration)</span>
                        <p className="text-xs text-gray-500 mt-0.5">상위 20% 책이 차지하는 비중</p>
                      </div>
                      <span className="text-lg font-bold text-amber-600">{analytics.contentAnalytics.contentLifecycle.hitConcentration}%</span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-2">
                      <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${analytics.contentAnalytics.contentLifecycle.hitConcentration}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">인기 도서에 다운로드가 얼마나 집중되어 있는지 측정</p>
                  </div>

                  <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <span className="text-xs font-medium text-gray-700">롱테일 기여도 (Long Tail Value)</span>
                        <p className="text-xs text-gray-500 mt-0.5">하위 50% 책의 기여도</p>
                      </div>
                      <span className="text-lg font-bold text-teal-600">{analytics.contentAnalytics.contentLifecycle.longTailValue}%</span>
                    </div>
                    <div className="w-full bg-teal-200 rounded-full h-2">
                      <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${analytics.contentAnalytics.contentLifecycle.longTailValue}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">비인기 도서의 전체 다운로드 기여도 측정</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-medium text-gray-700">카탈로그 커버리지 (Catalog Coverage)</span>
                        <p className="text-xs text-gray-500 mt-0.5">전체 책 중 다운로드된 비율</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{analytics.contentAnalytics.catalogCoverage.coveragePercentage}%</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      전체 {analytics.contentAnalytics.catalogCoverage.totalBooks}권 중 {analytics.contentAnalytics.catalogCoverage.downloadedBooks}권 다운로드됨
                    </p>
                    <p className="text-xs text-gray-500 mt-1">보유 도서의 실제 활용도 측정</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: Single column - always expanded */}
            <div className="lg:hidden space-y-4">
              {/* 인기 도서 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 px-1">📖 인기 도서</h3>
                <div className="space-y-2">
                  {analytics.popularBooks.slice(0, 5).map((book, idx) => (
                    <div key={book.bookId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-lg font-bold text-indigo-600 w-6">{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-900 line-clamp-2">
                          {book.bookTitle || `책 ID ${book.bookId}`}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{book.bookAuthor || '저자 미상'}</div>
                      </div>
                      <div className="text-sm font-bold text-indigo-600 whitespace-nowrap">{book.downloadCount}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 콘텐츠 지표 */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 px-1">📊 콘텐츠 지표</h3>
                <div className="space-y-2">
                  {/* Hit Concentration */}
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="mb-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-gray-700">히트 집중도</div>
                          <div className="text-xs text-gray-500">Hit Concentration</div>
                        </div>
                        <div className="text-xl font-bold text-amber-600">{analytics.contentAnalytics.contentLifecycle.hitConcentration}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-1.5 mb-1.5">
                      <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${analytics.contentAnalytics.contentLifecycle.hitConcentration}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-600">상위 20% 인기 도서 다운로드 비중</p>
                  </div>

                  {/* Long Tail */}
                  <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="mb-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-gray-700">롱테일 기여</div>
                          <div className="text-xs text-gray-500">Long Tail Value</div>
                        </div>
                        <div className="text-xl font-bold text-teal-600">{analytics.contentAnalytics.contentLifecycle.longTailValue}%</div>
                      </div>
                    </div>
                    <div className="w-full bg-teal-200 rounded-full h-1.5 mb-1.5">
                      <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${analytics.contentAnalytics.contentLifecycle.longTailValue}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-600">하위 50% 비인기 도서 기여도</p>
                  </div>

                  {/* Catalog Coverage */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="mb-1.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-gray-700">카탈로그 커버리지</div>
                          <div className="text-xs text-gray-500">Catalog Coverage</div>
                        </div>
                        <div className="text-xl font-bold text-blue-600">{analytics.contentAnalytics.catalogCoverage.coveragePercentage}%</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">
                      {analytics.contentAnalytics.catalogCoverage.downloadedBooks}/{analytics.contentAnalytics.catalogCoverage.totalBooks}권 다운로드됨
                    </p>
                    <p className="text-xs text-gray-500">보유 도서의 실제 활용도</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== 사용자 세그먼트 (Desktop & Mobile) ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">👥 사용자 세그먼트 (User Segments)</h2>

          {/* Desktop: 5-column grid */}
          <div className="hidden md:grid md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">{analytics.userSegmentation.powerUsers}</div>
              <div className="text-sm text-gray-700 mt-2 font-semibold">파워 유저</div>
              <div className="text-xs text-gray-600 mt-1">Power Users</div>
              <div className="text-xs text-gray-500 mt-1">15권 이상</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{analytics.userSegmentation.regularReaders}</div>
              <div className="text-sm text-gray-700 mt-2 font-semibold">일반 사용자</div>
              <div className="text-xs text-gray-600 mt-1">Regular Users</div>
              <div className="text-xs text-gray-500 mt-1">5-14권</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600">{analytics.userSegmentation.casualReaders}</div>
              <div className="text-sm text-gray-700 mt-2 font-semibold">라이트 유저</div>
              <div className="text-xs text-gray-600 mt-1">Light Users</div>
              <div className="text-xs text-gray-500 mt-1">1-4권</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-3xl font-bold text-amber-600">{analytics.userSegmentation.atRisk}</div>
              <div className="text-sm text-gray-700 mt-2 font-semibold">이탈 위험군</div>
              <div className="text-xs text-gray-600 mt-1">At Risk</div>
              <div className="text-xs text-gray-500 mt-1">2-4주 비활동</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-3xl font-bold text-gray-600">{analytics.userSegmentation.churned}</div>
              <div className="text-sm text-gray-700 mt-2 font-semibold">이탈 사용자</div>
              <div className="text-xs text-gray-600 mt-1">Churned</div>
              <div className="text-xs text-gray-500 mt-1">4주 이상 비활동</div>
            </div>
          </div>

          {/* Mobile: 2-column grid - compact */}
          <div className="grid grid-cols-2 md:hidden gap-2 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-xl font-bold text-purple-600">{analytics.userSegmentation.powerUsers}</div>
              <div className="text-xs text-gray-700 mt-0.5 font-semibold">파워</div>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xl font-bold text-blue-600">{analytics.userSegmentation.regularReaders}</div>
              <div className="text-xs text-gray-700 mt-0.5 font-semibold">일반</div>
            </div>
            <div className="p-2 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xl font-bold text-green-600">{analytics.userSegmentation.casualReaders}</div>
              <div className="text-xs text-gray-700 mt-0.5 font-semibold">라이트</div>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-xl font-bold text-amber-600">{analytics.userSegmentation.atRisk}</div>
              <div className="text-xs text-gray-700 mt-0.5 font-semibold">이탈위험</div>
            </div>
          </div>

          {/* Segment distribution bar */}
          <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
            {(() => {
              const total = analytics.userEngagement.totalUsers;
              const segments = [
                { label: 'Power', value: analytics.userSegmentation.powerUsers, color: 'bg-purple-500' },
                { label: 'Regular', value: analytics.userSegmentation.regularReaders, color: 'bg-blue-500' },
                { label: 'Casual', value: analytics.userSegmentation.casualReaders, color: 'bg-green-500' },
                { label: 'At Risk', value: analytics.userSegmentation.atRisk, color: 'bg-amber-500' },
                { label: 'Churned', value: analytics.userSegmentation.churned, color: 'bg-gray-400' },
              ];

              let offset = 0;
              return segments.map((seg) => {
                const width = (seg.value / total) * 100;
                const left = offset;
                offset += width;
                return (
                  <div
                    key={seg.label}
                    className={`absolute top-0 h-full ${seg.color} transition-all`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`${seg.label}: ${seg.value} (${width.toFixed(1)}%)`}
                  />
                );
              });
            })()}
          </div>
        </div>

        {/* ========== 상세 섹션 (Mobile: 접기 가능) ========== */}

        {/* 이탈 위험 분석 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h2 className="text-base lg:text-lg font-bold text-gray-900 mb-3 lg:mb-4">⚠️ 이탈 위험 분석</h2>
          <div className="space-y-2 lg:space-y-3">
            {/* 고위험군 */}
            <div className="p-3 lg:p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-semibold text-red-700">🔴 고위험군</span>
                  <div className="text-xs text-red-600 mt-0.5">즉시 조치 필요</div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-red-600">{analytics.predictiveInsights?.churnRiskScore?.highRisk ?? 0}</div>
              </div>
              <div className="border-t border-red-200 pt-2 space-y-1.5">
                <p className="text-xs text-red-700">2~4주 비활동 • 이탈확률 70%+</p>
                <p className="text-xs text-red-600 font-medium">→ 재참여 이메일, 추천 알림</p>
              </div>
            </div>

            {/* 중위험군 */}
            <div className="p-3 lg:p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-semibold text-amber-700">🟡 중위험군</span>
                  <div className="text-xs text-amber-600 mt-0.5">모니터링 필요</div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-amber-600">{analytics.predictiveInsights?.churnRiskScore?.mediumRisk ?? 0}</div>
              </div>
              <div className="border-t border-amber-200 pt-2 space-y-1.5">
                <p className="text-xs text-amber-700">다운로드 1-4권 • 리텐션 40%</p>
                <p className="text-xs text-amber-600 font-medium">→ 온보딩 개선, 장르별 추천</p>
              </div>
            </div>

            {/* 정상 사용자 */}
            <div className="p-3 lg:p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-semibold text-green-700">🟢 정상 사용자</span>
                  <div className="text-xs text-green-600 mt-0.5">안정적 활동</div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-green-600">{analytics.predictiveInsights?.churnRiskScore?.lowRisk ?? 0}</div>
              </div>
              <div className="border-t border-green-200 pt-2 space-y-1.5">
                <p className="text-xs text-green-700">5권 이상 • 리텐션 85%+</p>
                <p className="text-xs text-green-600 font-medium">→ 품질 유지, VIP 프로그램</p>
              </div>
            </div>
          </div>
        </div>

        {/* 코호트 리텐션 - Responsive */}
        {analytics.cohortAnalysis.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <h2 className="text-base lg:text-lg font-bold text-gray-900 mb-3 lg:mb-4">📈 코호트 리텐션</h2>
            <div>
              {/* Desktop: Table view */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">가입 주차</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">가입자</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">1주차</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">2주차</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">3주차</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">4주차</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {analytics.cohortAnalysis.map((cohort) => (
                      <tr key={cohort.cohortWeek} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{cohort.cohortWeek}</td>
                        <td className="py-3 px-4 text-center text-gray-600">{cohort.signupCount}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            cohort.week1Retention >= 70 ? 'bg-green-100 text-green-800' :
                            cohort.week1Retention >= 40 ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {cohort.week1Retention}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            cohort.week2Retention >= 60 ? 'bg-green-100 text-green-800' :
                            cohort.week2Retention >= 30 ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {cohort.week2Retention}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            cohort.week3Retention >= 50 ? 'bg-green-100 text-green-800' :
                            cohort.week3Retention >= 25 ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {cohort.week3Retention}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            cohort.week4Retention >= 40 ? 'bg-green-100 text-green-800' :
                            cohort.week4Retention >= 20 ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {cohort.week4Retention}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: Card view */}
              <div className="lg:hidden space-y-3">
                <div className="text-xs text-gray-500 mb-2">가입 코호트별 주차 경과 리텐션</div>
                {analytics.cohortAnalysis.slice(0, 3).map((cohort) => {
                  const getRetentionColor = (value: number, thresholds: [number, number]) => {
                    if (value >= thresholds[0]) return 'bg-green-50 border-green-200 text-green-800';
                    if (value >= thresholds[1]) return 'bg-amber-50 border-amber-200 text-amber-800';
                    return 'bg-red-50 border-red-200 text-red-800';
                  };

                  return (
                    <div key={cohort.cohortWeek} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      {/* Header */}
                      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold text-gray-900">{cohort.cohortWeek}</div>
                          <div className="text-xs text-gray-600">가입 {cohort.signupCount}명</div>
                        </div>
                      </div>

                      {/* Retention Grid */}
                      <div className="p-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2 rounded-lg border ${getRetentionColor(cohort.week1Retention, [70, 40])}`}>
                            <div className="text-xs font-semibold mb-0.5">+1주</div>
                            <div className="text-xl font-bold">{cohort.week1Retention}%</div>
                          </div>
                          <div className={`p-2 rounded-lg border ${getRetentionColor(cohort.week2Retention, [60, 30])}`}>
                            <div className="text-xs font-semibold mb-0.5">+2주</div>
                            <div className="text-xl font-bold">{cohort.week2Retention}%</div>
                          </div>
                          <div className={`p-2 rounded-lg border ${getRetentionColor(cohort.week3Retention, [50, 25])}`}>
                            <div className="text-xs font-semibold mb-0.5">+3주</div>
                            <div className="text-xl font-bold">{cohort.week3Retention}%</div>
                          </div>
                          <div className={`p-2 rounded-lg border ${getRetentionColor(cohort.week4Retention, [40, 20])}`}>
                            <div className="text-xs font-semibold mb-0.5">+4주</div>
                            <div className="text-xl font-bold">{cohort.week4Retention}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Show more button if more than 3 cohorts */}
                {analytics.cohortAnalysis.length > 3 && (
                  <div className="text-center">
                    <button
                      onClick={() => toggleSection('allCohorts')}
                      className="w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition border border-gray-300"
                    >
                      {expandedSections.has('allCohorts') ? '접기 ▲' : `${analytics.cohortAnalysis.length - 3}개 더 보기 ▼`}
                    </button>
                    {expandedSections.has('allCohorts') && (
                      <div className="mt-3 space-y-3">
                        {analytics.cohortAnalysis.slice(3).map((cohort) => {
                          const getRetentionColor = (value: number, thresholds: [number, number]) => {
                            if (value >= thresholds[0]) return 'bg-green-50 border-green-200 text-green-800';
                            if (value >= thresholds[1]) return 'bg-amber-50 border-amber-200 text-amber-800';
                            return 'bg-red-50 border-red-200 text-red-800';
                          };

                          return (
                            <div key={cohort.cohortWeek} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                              <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-bold text-gray-900">{cohort.cohortWeek}</div>
                                  <div className="text-xs text-gray-600">가입 {cohort.signupCount}명</div>
                                </div>
                              </div>
                              <div className="p-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className={`p-2 rounded-lg border ${getRetentionColor(cohort.week1Retention, [70, 40])}`}>
                                    <div className="text-xs font-semibold mb-0.5">+1주</div>
                                    <div className="text-xl font-bold">{cohort.week1Retention}%</div>
                                  </div>
                                  <div className={`p-2 rounded-lg border ${getRetentionColor(cohort.week2Retention, [60, 30])}`}>
                                    <div className="text-xs font-semibold mb-0.5">+2주</div>
                                    <div className="text-xl font-bold">{cohort.week2Retention}%</div>
                                  </div>
                                  <div className={`p-2 rounded-lg border ${getRetentionColor(cohort.week3Retention, [50, 25])}`}>
                                    <div className="text-xs font-semibold mb-0.5">+3주</div>
                                    <div className="text-xl font-bold">{cohort.week3Retention}%</div>
                                  </div>
                                  <div className={`p-2 rounded-lg border ${getRetentionColor(cohort.week4Retention, [40, 20])}`}>
                                    <div className="text-xs font-semibold mb-0.5">+4주</div>
                                    <div className="text-xl font-bold">{cohort.week4Retention}%</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
