'use client';

import { useEffect, useState } from 'react';

interface ActivityEvent {
  id: string;
  userId: string;
  username: string;
  activityType: 'login' | 'download' | 'signup';
  timestamp: string;
  metadata: {
    bookTitle?: string;
    bookId?: number;
    deviceType?: string;
    uiMode?: string;
    sessionId?: string;
  };
}

interface UserActivity {
  userId: string;
  username: string;
  email: string;
  totalSessions: number;
  totalDownloads: number;
  avgSessionDuration: number;
  lastActivity: string;
  firstActivity: string;
  activityTimeline: Array<{
    date: string;
    logins: number;
    downloads: number;
  }>;
  devicePreferences: Record<string, number>;
  uiModePreferences: Record<string, number>;
  engagementScore: number;
  engagementScoreBreakdown: {
    downloadScore: number;
    recencyScore: number;
    sessionScore: number;
    diversityScore: number;
    total: number;
    explanation: {
      downloads: string;
      recency: string;
      sessions: string;
      diversity: string;
    };
  };
  downloadHistory: Array<{
    bookId: number;
    bookTitle?: string;
    bookAuthor?: string;
    downloadedAt: string;
    deviceType?: string;
    uiMode?: string;
  }>;
  behaviorPattern: 'power_user' | 'binge_reader' | 'casual' | 'explorer' | 'inactive';
}

interface TrackingData {
  recentActivity: ActivityEvent[];
  userActivities: UserActivity[];
  activityHeatmap: {
    hourlyPattern: number[][];
    peakHours: Array<{ hour: number; day: number; count: number }>;
    quietHours: Array<{ hour: number; day: number; count: number }>;
  };
  sessionAnalytics: {
    avgSessionLength: number;
    sessionsPerUser: number;
    totalUniqueSessions: number;
    sessionDistribution: Record<string, number>;
    topSessions: Array<{
      sessionId: string;
      userId: string;
      username: string;
      downloadCount: number;
      startTime: string;
      endTime: string;
      duration: number;
    }>;
  };
  userJourney: {
    signups: number;
    firstLogin: number;
    firstDownload: number;
    secondDownload: number;
    tenthDownload: number;
    returnUsers: number;
    conversionRates: {
      signupToFirstDownload: number;
      firstToSecondDownload: number;
      activationRate: number;
    };
  };
  behaviorPatterns: {
    bingeReaders: number;
    casualReaders: number;
    explorers: number;
    powerUsers: number;
  };
  timeMetrics: {
    dailyActiveUsers: number[];
    weeklyActiveUsers: number[];
    monthlyTrends: Array<{
      date: string;
      users: number;
      downloads: number;
      sessions: number;
    }>;
  };
}

export default function TrackingPage() {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isDesktop, setIsDesktop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);

  useEffect(() => {
    const loadTracking = async () => {
      try {
        const res = await fetch('/api/admin/tracking');
        const data = await res.json();
        if (data.tracking) {
          setTracking(data.tracking);
        }
      } catch (error) {
        console.error('Failed to load tracking data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTracking();

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize();
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signup': return '✨';
      case 'login': return '🔑';
      case 'download': return '📥';
      default: return '•';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'signup': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'login': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'download': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getBehaviorLabel = (pattern: string) => {
    switch (pattern) {
      case 'power_user': return { label: '파워 유저', color: 'bg-purple-100 text-purple-800' };
      case 'binge_reader': return { label: '몰아 읽기', color: 'bg-indigo-100 text-indigo-800' };
      case 'explorer': return { label: '탐험가', color: 'bg-blue-100 text-blue-800' };
      case 'casual': return { label: '캐주얼', color: 'bg-green-100 text-green-800' };
      case 'inactive': return { label: '비활성', color: 'bg-gray-100 text-gray-800' };
      default: return { label: pattern, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDayName = (dayIndex: number) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[dayIndex];
  };

  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) return { icon: '↑', color: 'text-green-600' };
    if (current < previous) return { icon: '↓', color: 'text-red-600' };
    return { icon: '→', color: 'text-gray-600' };
  };

  const getSessionIntensityColor = (downloadCount: number) => {
    if (downloadCount >= 5) return 'bg-purple-50 border-purple-200 text-purple-900';
    if (downloadCount >= 3) return 'bg-blue-50 border-blue-200 text-blue-900';
    return 'bg-green-50 border-green-200 text-green-900';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">추적 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">추적 데이터를 불러올 수 없습니다</h3>
          <p className="text-gray-600 text-sm">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  const filteredUsers = tracking.userActivities.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* ========== HEADER ========== */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-8 md:py-12 mb-6 md:mb-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-5xl md:text-6xl">🔍</span>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold">사용자 활동 추적</h1>
              <p className="text-white/90 text-sm md:text-base mt-1">실시간 활동 모니터링 및 행동 패턴 분석</p>
            </div>
          </div>
          <div className="mt-4 text-white/80 text-sm">
            마지막 업데이트: {new Date().toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6 md:space-y-8 overflow-x-hidden">

        {/* ========== DESKTOP: 3-COLUMN HERO ========== */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {/* Real-time Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              실시간 활동
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden">
              {tracking.recentActivity.slice(0, 15).map(activity => (
                <div key={activity.id} className={`p-3 rounded-lg border ${getActivityColor(activity.activityType)}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{getActivityIcon(activity.activityType)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{activity.username}</div>
                      <div className="text-xs opacity-80 line-clamp-2 md:line-clamp-1">
                        {activity.activityType === 'download' && activity.metadata.bookTitle
                          ? activity.metadata.bookTitle
                          : activity.activityType === 'signup'
                          ? '새로 가입함'
                          : '로그인함'}
                      </div>
                      <div className="text-xs opacity-60 mt-1">{formatTimestamp(activity.timestamp)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">총 세션</div>
              <div className="text-4xl font-bold text-gray-900">{tracking.sessionAnalytics.totalUniqueSessions}</div>
              <div className="text-xs text-gray-500 mt-2">
                사용자당 평균 {tracking.sessionAnalytics.sessionsPerUser.toFixed(1)}회
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">평균 세션 길이</div>
              <div className="text-4xl font-bold text-gray-900">{tracking.sessionAnalytics.avgSessionLength}<span className="text-xl text-gray-500">분</span></div>
              <div className="text-xs text-gray-500 mt-2">
                활동 기준 추정치
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">재방문 사용자</div>
              <div className="text-4xl font-bold text-gray-900">{tracking.userJourney.returnUsers}</div>
              <div className="text-xs text-gray-500 mt-2">
                1일 이상 경과 후 재로그인
              </div>
            </div>
          </div>

          {/* Behavior Patterns */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">행동 패턴 분포</h2>
            <div className="space-y-3">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-purple-900">파워 유저</div>
                    <div className="text-xs text-purple-700 mt-1">15권 이상, 주 1회 활동</div>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">{tracking.behaviorPatterns.powerUsers}</div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-indigo-900">몰아 읽기</div>
                    <div className="text-xs text-indigo-700 mt-1">세션당 5권 이상</div>
                  </div>
                  <div className="text-3xl font-bold text-indigo-600">{tracking.behaviorPatterns.bingeReaders}</div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-blue-900">탐험가</div>
                    <div className="text-xs text-blue-700 mt-1">많은 세션, 적은 다운로드</div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{tracking.behaviorPatterns.explorers}</div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-green-900">캐주얼</div>
                    <div className="text-xs text-green-700 mt-1">가끔씩 이용</div>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{tracking.behaviorPatterns.casualReaders}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== MOBILE: SIMPLIFIED HERO ========== */}
        <div className="lg:hidden space-y-4">
          {/* Recent Activity - Top 5 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              최근 활동
            </h2>
            <div className="space-y-2">
              {tracking.recentActivity.slice(0, 5).map(activity => (
                <div key={activity.id} className={`p-3 rounded-lg border ${getActivityColor(activity.activityType)}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{getActivityIcon(activity.activityType)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{activity.username}</div>
                      <div className="text-xs opacity-80 line-clamp-2 md:line-clamp-1">
                        {activity.activityType === 'download' && activity.metadata.bookTitle
                          ? activity.metadata.bookTitle
                          : activity.activityType === 'signup'
                          ? '새로 가입함'
                          : '로그인함'}
                      </div>
                      <div className="text-xs opacity-60 mt-1">{formatTimestamp(activity.timestamp)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Activity Table - Moved here for better UX */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900">👥 사용자 활동 상세</h2>
                <input
                  type="text"
                  placeholder="사용자 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold placeholder:text-gray-900"
                />
              </div>
            </div>

            {/* Mobile: Card View */}
            <div className="lg:hidden p-4 space-y-3">
              {filteredUsers.slice(0, 5).map(user => {
                const behavior = getBehaviorLabel(user.behaviorPattern);

                return (
                  <div
                    key={user.userId}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer active:bg-gray-200 transition"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{user.username}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${behavior.color}`}>
                        {behavior.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">세션</div>
                        <div className="text-lg font-bold text-gray-900">{user.totalSessions}</div>
                        <div className="text-xs text-gray-500">{user.avgSessionDuration}분</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">다운로드</div>
                        <div className="text-lg font-bold text-indigo-600">{user.totalDownloads}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">참여도</div>
                        <div className="text-lg font-bold text-gray-900">{user.engagementScore}</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        마지막 활동: {formatTimestamp(user.lastActivity)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredUsers.length > 5 && (
              <div className="lg:hidden p-4 text-center border-t border-gray-200">
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                  더 보기 ({filteredUsers.length - 5}명 더 있음)
                </button>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">총 세션</div>
              <div className="text-2xl font-bold text-gray-900">{tracking.sessionAnalytics.totalUniqueSessions}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">평균 길이</div>
              <div className="text-2xl font-bold text-gray-900">{tracking.sessionAnalytics.avgSessionLength}분</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">재방문</div>
              <div className="text-2xl font-bold text-gray-900">{tracking.userJourney.returnUsers}</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="text-xs font-medium text-gray-600 mb-1">파워 유저</div>
              <div className="text-2xl font-bold text-gray-900">{tracking.behaviorPatterns.powerUsers}</div>
            </div>
          </div>
        </div>

        {/* ========== ACTIVITY HEATMAP (Desktop Only) ========== */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">활동 히트맵 (요일별 × 시간대별)</h2>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex gap-1 mb-2">
                <div className="w-12"></div>
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="w-8 text-xs text-center text-gray-600">
                    {i}
                  </div>
                ))}
              </div>

              {tracking.activityHeatmap.hourlyPattern.map((dayData, dayIndex) => {
                const maxCount = Math.max(...tracking.activityHeatmap.hourlyPattern.flat());

                return (
                  <div key={dayIndex} className="flex gap-1 mb-1">
                    <div className="w-12 text-xs flex items-center text-gray-700 font-medium">
                      {dayOfWeek[dayIndex]}
                    </div>
                    {dayData.map((count, hourIndex) => {
                      const intensity = maxCount > 0 ? count / maxCount : 0;
                      const bgColor =
                        intensity === 0 ? 'bg-gray-100' :
                        intensity < 0.25 ? 'bg-blue-200' :
                        intensity < 0.5 ? 'bg-blue-400' :
                        intensity < 0.75 ? 'bg-blue-600' :
                        'bg-blue-800';

                      return (
                        <div
                          key={hourIndex}
                          className={`w-8 h-8 rounded ${bgColor} flex items-center justify-center text-xs font-semibold ${
                            intensity > 0.5 ? 'text-white' : 'text-gray-700'
                          }`}
                          title={`${dayOfWeek[dayIndex]} ${hourIndex}시: ${count}회`}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span>활동 없음</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <span>낮음</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span>높음</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-800 rounded"></div>
              <span>매우 높음</span>
            </div>
          </div>

          {tracking.activityHeatmap.peakHours.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-semibold text-blue-900 mb-2">📈 피크 시간대</div>
              <div className="flex flex-wrap gap-2">
                {tracking.activityHeatmap.peakHours.slice(0, 3).map((peak, idx) => (
                  <div key={idx} className="px-3 py-1 bg-blue-100 rounded-full text-xs font-medium text-blue-800">
                    {getDayName(peak.day)} {peak.hour}시 ({peak.count}회)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========== USER JOURNEY FUNNEL ========== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <button
            onClick={() => toggleSection('userJourney')}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition lg:cursor-default lg:hover:bg-white"
          >
            <h2 className="text-lg font-bold text-gray-900">🎯 사용자 여정 퍼널</h2>
            <span className="lg:hidden text-gray-400">
              {expandedSections.has('userJourney') ? '▼' : '▶'}
            </span>
          </button>

          <div className={`${expandedSections.has('userJourney') || isDesktop ? 'block' : 'hidden'} p-6 pt-0`}>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Funnel Visualization */}
              <div className="md:col-span-2">
                <div className="space-y-3">
                  <div className="relative">
                    <div className="bg-purple-500 text-white rounded-lg p-3 md:p-4 flex items-center justify-between">
                      <span className="font-semibold text-sm md:text-base">가입</span>
                      <span className="text-xl md:text-2xl font-bold">{tracking.userJourney.signups}</span>
                    </div>
                  </div>

                  <div className="relative pl-2 md:pl-4">
                    <div className="bg-indigo-500 text-white rounded-lg p-3 md:p-4 flex items-center justify-between w-full max-w-full md:w-auto" style={{ minWidth: '80%' }}>
                      <span className="font-semibold text-sm md:text-base">첫 로그인</span>
                      <span className="text-xl md:text-2xl font-bold">{tracking.userJourney.firstLogin}</span>
                    </div>
                    <div className="absolute -left-2 md:-left-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 bg-white px-1 rounded">
                      {tracking.userJourney.signups > 0 ? Math.round((tracking.userJourney.firstLogin / tracking.userJourney.signups) * 100) : 0}%
                    </div>
                  </div>

                  <div className="relative pl-4 md:pl-8">
                    <div className="bg-blue-500 text-white rounded-lg p-3 md:p-4 flex items-center justify-between w-full max-w-full md:w-auto" style={{ minWidth: '70%' }}>
                      <span className="font-semibold text-sm md:text-base">첫 다운로드</span>
                      <span className="text-xl md:text-2xl font-bold">{tracking.userJourney.firstDownload}</span>
                    </div>
                    <div className="absolute -left-2 md:-left-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 bg-white px-1 rounded">
                      {tracking.userJourney.conversionRates.signupToFirstDownload}%
                    </div>
                  </div>

                  <div className="relative pl-6 md:pl-12">
                    <div className="bg-cyan-500 text-white rounded-lg p-3 md:p-4 flex items-center justify-between w-full max-w-full md:w-auto" style={{ minWidth: '60%' }}>
                      <span className="font-semibold text-sm md:text-base">2번째 다운로드</span>
                      <span className="text-xl md:text-2xl font-bold">{tracking.userJourney.secondDownload}</span>
                    </div>
                    <div className="absolute -left-2 md:-left-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 bg-white px-1 rounded">
                      {tracking.userJourney.conversionRates.activationRate}%
                    </div>
                  </div>

                  <div className="relative pl-8 md:pl-16">
                    <div className="bg-teal-500 text-white rounded-lg p-3 md:p-4 flex items-center justify-between w-full max-w-full md:w-auto" style={{ minWidth: '50%' }}>
                      <span className="font-semibold text-sm md:text-base">10번째 다운로드</span>
                      <span className="text-xl md:text-2xl font-bold">{tracking.userJourney.tenthDownload}</span>
                    </div>
                    <div className="absolute -left-2 md:-left-2 top-1/2 -translate-y-1/2 text-xs text-gray-600 bg-white px-1 rounded">
                      {tracking.userJourney.signups > 0 ? Math.round((tracking.userJourney.tenthDownload / tracking.userJourney.signups) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Rates */}
              <div className="space-y-3">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs font-medium text-green-800 mb-1">가입 → 첫 다운로드</div>
                  <div className="text-3xl font-bold text-green-600">{tracking.userJourney.conversionRates.signupToFirstDownload}%</div>
                  <div className="text-xs text-green-700 mt-1">전환율</div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs font-medium text-blue-800 mb-1">첫 → 두번째 다운로드</div>
                  <div className="text-3xl font-bold text-blue-600">{tracking.userJourney.conversionRates.firstToSecondDownload}%</div>
                  <div className="text-xs text-blue-700 mt-1">재사용률</div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-xs font-medium text-purple-800 mb-1">활성화율</div>
                  <div className="text-3xl font-bold text-purple-600">{tracking.userJourney.conversionRates.activationRate}%</div>
                  <div className="text-xs text-purple-700 mt-1">2회 이상 사용</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: User Activity Table */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-lg font-bold text-gray-900">👥 사용자 활동 상세</h2>
              <input
                type="text"
                placeholder="사용자 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold placeholder:text-gray-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">사용자</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">세션</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">다운로드</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">참여도</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">패턴</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">마지막 활동</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.slice(0, 20).map(user => {
                  const behavior = getBehaviorLabel(user.behaviorPattern);

                  return (
                    <tr key={user.userId} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedUser(user)}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{user.username}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-semibold text-gray-900">{user.totalSessions}</div>
                        <div className="text-xs text-gray-500">{user.avgSessionDuration}분</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-bold text-indigo-600">{user.totalDownloads}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${user.engagementScore}%` }}></div>
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{user.engagementScore}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${behavior.color}`}>
                          {behavior.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">{formatTimestamp(user.lastActivity)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length > 20 && (
            <div className="p-4 text-center border-t border-gray-200">
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                더 보기 ({filteredUsers.length - 20}명 더 있음)
              </button>
            </div>
          )}
        </div>

        {/* ========== MOBILE: More Insights Sections ========== */}
        <div className="lg:hidden space-y-4">
          {/* Monthly Trends - Priority 1: Business Growth KPI */}
          {/* Monthly Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('monthlyTrends')}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-900">📊 월간 트렌드</h2>
                <p className="text-sm text-gray-600 mt-1">
                  최근 3개월 활동 추이
                </p>
              </div>
              <span className="text-gray-400 text-xl">
                {expandedSections.has('monthlyTrends') ? '▼' : '▶'}
              </span>
            </button>

            {expandedSections.has('monthlyTrends') && (
              <div className="px-6 pb-6">
                {/* Mobile: Vertical Cards (Last 3 months) */}
                <div className="space-y-3">
                  {tracking.timeMetrics.monthlyTrends.slice(-3).map((month, idx, arr) => {
                    const prevMonth = idx > 0 ? arr[idx - 1] : null;
                    const userTrend = prevMonth ? getTrendIndicator(month.users, prevMonth.users) : null;
                    const downloadTrend = prevMonth ? getTrendIndicator(month.downloads, prevMonth.downloads) : null;

                    return (
                      <div key={month.date} className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                        <div className="text-base font-bold text-gray-900 mb-3">
                          {new Date(month.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                              사용자
                              {userTrend && <span className={userTrend.color}>{userTrend.icon}</span>}
                            </div>
                            <div className="text-xl font-bold text-gray-900">{month.users}</div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                              다운로드
                              {downloadTrend && <span className={downloadTrend.color}>{downloadTrend.icon}</span>}
                            </div>
                            <div className="text-xl font-bold text-indigo-600">{month.downloads}</div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-600 mb-1">세션</div>
                            <div className="text-xl font-bold text-purple-600">{month.sessions}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {tracking.timeMetrics.monthlyTrends.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    월간 트렌드 데이터가 없습니다
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Power Sessions - Priority 2: Core User Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('powerSessions')}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-900">⚡ 파워 세션</h2>
                <p className="text-sm text-gray-600 mt-1">
                  최근 3개 고강도 활동 세션
                </p>
              </div>
              <span className="text-gray-400 text-xl">
                {expandedSections.has('powerSessions') ? '▼' : '▶'}
              </span>
            </button>

            {expandedSections.has('powerSessions') && (
              <div className="px-6 pb-6 space-y-3">
                {tracking.sessionAnalytics.topSessions.slice(0, 3).map((session) => (
                  <div
                    key={session.sessionId}
                    className={`p-4 rounded-lg border ${getSessionIntensityColor(session.downloadCount)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{session.username}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {new Date(session.startTime).toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-2xl font-bold">{session.downloadCount}</div>
                        <div className="text-xs opacity-75">다운로드</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2 py-1 bg-white/50 rounded">
                        ⏱️ {formatDuration(session.duration)}
                      </span>
                      <span className="opacity-75">
                        세션 ID: {session.sessionId.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                ))}

                {tracking.sessionAnalytics.topSessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    파워 세션 데이터가 없습니다
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Peak Activity Times - Priority 3: Operational Insights */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => toggleSection('peakActivity')}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition"
            >
              <div>
                <h2 className="text-lg font-bold text-gray-900">📈 피크 활동 시간대</h2>
                <p className="text-sm text-gray-600 mt-1">
                  가장 활발한 시간: {tracking.activityHeatmap.peakHours.slice(0, 1).map(p => `${getDayName(p.day)} ${p.hour}시`).join(', ')}
                </p>
              </div>
              <span className="text-gray-400 text-xl">
                {expandedSections.has('peakActivity') ? '▼' : '▶'}
              </span>
            </button>

            {expandedSections.has('peakActivity') && (
              <div className="px-6 pb-6 space-y-4">
                {/* Peak Hours */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-semibold text-blue-900 mb-3">🔥 활동 피크 시간 (Top 3)</div>
                  <div className="space-y-2">
                    {tracking.activityHeatmap.peakHours.slice(0, 3).map((peak, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                        <span className="text-sm font-medium text-gray-900">
                          {getDayName(peak.day)} {peak.hour}:00
                        </span>
                        <span className="text-sm font-bold text-blue-600">{peak.count}회</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quiet Hours */}
                {tracking.activityHeatmap.quietHours.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm font-semibold text-gray-900 mb-3">😴 조용한 시간대</div>
                    <div className="flex flex-wrap gap-2">
                      {tracking.activityHeatmap.quietHours.slice(0, 2).map((quiet, idx) => (
                        <div key={idx} className="px-3 py-1 bg-gray-200 rounded-full text-xs font-medium text-gray-700">
                          {getDayName(quiet.day)} {quiet.hour}시
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info: Full heatmap available on desktop */}
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-xs text-indigo-800">
                    💻 전체 24시간 히트맵은 데스크톱에서 확인하세요
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== USER DETAIL MODAL ========== */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedUser.username}</h3>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="text-xs font-medium text-indigo-800 mb-1">총 다운로드</div>
                  <div className="text-3xl font-bold text-indigo-600">{selectedUser.totalDownloads}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-xs font-medium text-purple-800 mb-1">총 세션</div>
                  <div className="text-3xl font-bold text-purple-600">{selectedUser.totalSessions}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs font-medium text-blue-800 mb-1">참여도 점수</div>
                  <div className="text-3xl font-bold text-blue-600">{selectedUser.engagementScore}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs font-medium text-green-800 mb-1">평균 세션</div>
                  <div className="text-3xl font-bold text-green-600">{selectedUser.avgSessionDuration}분</div>
                </div>
              </div>

              {/* Device & UI Preferences */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">선호 기기 및 UI</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-2">기기 선호도</div>
                    {Object.entries(selectedUser.devicePreferences).map(([device, count]) => {
                      const deviceMap: Record<string, string> = {
                        'desktop': 'PC',
                        'mobile': '모바일',
                        'tablet': '태블릿',
                        'eink': '전자책 단말기',
                        'unknown': '알 수 없음'
                      };
                      const deviceText = deviceMap[device] || device;

                      return (
                        <div key={device} className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">{deviceText}</span>
                          <span className="font-semibold text-gray-900">{count}회</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-2">UI 모드</div>
                    {Object.entries(selectedUser.uiModePreferences).map(([mode, count]) => {
                      const uiModeMap: Record<string, string> = {
                        'standard': '일반 화면',
                        'eink': '전자책 모드',
                        'unknown': '알 수 없음'
                      };
                      const modeText = uiModeMap[mode] || mode;

                      return (
                        <div key={mode} className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">{modeText}</span>
                          <span className="font-semibold text-gray-900">{count}회</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Engagement Score Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">참여도 점수 상세 (총 {selectedUser.engagementScore}점)</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-indigo-900">📚 다운로드 활동</span>
                      <span className="text-lg font-bold text-indigo-600">{selectedUser.engagementScoreBreakdown.downloadScore}점</span>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-2 mb-1">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(selectedUser.engagementScoreBreakdown.downloadScore / 40) * 100}%` }}></div>
                    </div>
                    <p className="text-xs text-indigo-700">{selectedUser.engagementScoreBreakdown.explanation.downloads}</p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-purple-900">⏰ 최근성</span>
                      <span className="text-lg font-bold text-purple-600">{selectedUser.engagementScoreBreakdown.recencyScore}점</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2 mb-1">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${(selectedUser.engagementScoreBreakdown.recencyScore / 30) * 100}%` }}></div>
                    </div>
                    <p className="text-xs text-purple-700">{selectedUser.engagementScoreBreakdown.explanation.recency}</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-900">🔄 세션 활동</span>
                      <span className="text-lg font-bold text-blue-600">{selectedUser.engagementScoreBreakdown.sessionScore}점</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mb-1">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(selectedUser.engagementScoreBreakdown.sessionScore / 20) * 100}%` }}></div>
                    </div>
                    <p className="text-xs text-blue-700">{selectedUser.engagementScoreBreakdown.explanation.sessions}</p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-green-900">📱 다양성</span>
                      <span className="text-lg font-bold text-green-600">{selectedUser.engagementScoreBreakdown.diversityScore}점</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2 mb-1">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(selectedUser.engagementScoreBreakdown.diversityScore / 10) * 100}%` }}></div>
                    </div>
                    <p className="text-xs text-green-700">{selectedUser.engagementScoreBreakdown.explanation.diversity}</p>
                  </div>
                </div>
              </div>

              {/* Download History */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">다운로드 히스토리 (최근 20개)</h4>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {selectedUser.downloadHistory.slice(0, 20).map((download, idx) => {
                    // Map device types to Korean
                    const deviceMap: Record<string, string> = {
                      'desktop': 'PC',
                      'mobile': '모바일',
                      'tablet': '태블릿',
                      'unknown': '알 수 없음'
                    };

                    // Map UI modes to Korean
                    const uiModeMap: Record<string, string> = {
                      'standard': '일반 화면',
                      'eink': '전자책 모드',
                      'unknown': '알 수 없음'
                    };

                    const deviceText = deviceMap[download.deviceType || 'unknown'] || download.deviceType || '알 수 없음';
                    const uiModeText = uiModeMap[download.uiMode || 'unknown'] || download.uiMode || '알 수 없음';
                    const combinedLabel = `${deviceText} · ${uiModeText}`;

                    return (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 line-clamp-2 md:line-clamp-1">
                              {download.bookTitle || `책 ID ${download.bookId}`}
                            </div>
                            {download.bookAuthor && (
                              <div className="text-xs text-gray-600 truncate">{download.bookAuthor}</div>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-gray-500">
                                {new Date(download.downloadedAt).toLocaleString('ko-KR', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                                {combinedLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {selectedUser.downloadHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      다운로드 기록이 없습니다
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Timeline - Last 7 days */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">최근 7일 활동</h4>
                <div className="space-y-2">
                  {selectedUser.activityTimeline.slice(-7).map(day => (
                    <div key={day.date} className="flex items-center gap-3">
                      <div className="text-xs text-gray-600 w-24">{new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</div>
                      <div className="flex-1 flex gap-2">
                        {day.logins > 0 && (
                          <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            🔑 {day.logins}
                          </div>
                        )}
                        {day.downloads > 0 && (
                          <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            📥 {day.downloads}
                          </div>
                        )}
                        {day.logins === 0 && day.downloads === 0 && (
                          <div className="text-xs text-gray-400">활동 없음</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Behavior Pattern */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">행동 패턴 분류</h4>
                <div className={`inline-block px-4 py-2 rounded-full text-lg font-bold ${getBehaviorLabel(selectedUser.behaviorPattern).color}`}>
                  {getBehaviorLabel(selectedUser.behaviorPattern).label}
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  {selectedUser.behaviorPattern === 'power_user' && '높은 참여도와 활동 빈도를 보이는 핵심 사용자입니다.'}
                  {selectedUser.behaviorPattern === 'binge_reader' && '한 번에 많은 책을 다운로드하는 몰아읽기 패턴을 보입니다.'}
                  {selectedUser.behaviorPattern === 'explorer' && '다양한 책을 탐색하지만 다운로드는 적은 탐험가형 사용자입니다.'}
                  {selectedUser.behaviorPattern === 'casual' && '가끔씩 서비스를 이용하는 캐주얼 사용자입니다.'}
                  {selectedUser.behaviorPattern === 'inactive' && '30일 이상 활동이 없는 비활성 사용자입니다.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
