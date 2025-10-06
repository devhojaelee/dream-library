import { NextResponse } from 'next/server';
import { getUsers, getDownloads } from '@/lib/auth';

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
    downloadDistribution: Record<string, number>;
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

// Helper: Calculate days between dates
function daysBetween(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (24 * 60 * 60 * 1000));
}

// Helper: Get date string (YYYY-MM-DD)
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function GET() {
  try {
    const users = getUsers();
    const downloads = getDownloads();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const approvedUsers = users.filter(u => u.approved);

    // ============================================================
    // 1. RECENT ACTIVITY FEED (Last 24 hours)
    // ============================================================
    const recentActivity: ActivityEvent[] = [];

    // Add signup events
    approvedUsers.forEach(user => {
      if (user.createdAt && new Date(user.createdAt) > oneDayAgo) {
        recentActivity.push({
          id: `signup-${user.id}`,
          userId: user.id,
          username: user.username,
          activityType: 'signup',
          timestamp: user.createdAt,
          metadata: {},
        });
      }
    });

    // Add login events
    approvedUsers.forEach(user => {
      if (user.lastLogin && new Date(user.lastLogin) > oneDayAgo) {
        recentActivity.push({
          id: `login-${user.id}-${user.lastLogin}`,
          userId: user.id,
          username: user.username,
          activityType: 'login',
          timestamp: user.lastLogin,
          metadata: {},
        });
      }
    });

    // Add download events
    downloads
      .filter(d => new Date(d.downloadedAt) > oneDayAgo)
      .forEach((download, idx) => {
        const user = users.find(u => u.id === download.userId);
        recentActivity.push({
          id: `download-${idx}-${download.downloadedAt}`,
          userId: download.userId,
          username: user?.username || 'Unknown',
          activityType: 'download',
          timestamp: download.downloadedAt,
          metadata: {
            bookTitle: download.bookTitle,
            bookId: download.bookId,
            deviceType: (download as any).deviceType,
            uiMode: (download as any).uiMode,
            sessionId: (download as any).sessionId,
          },
        });
      });

    // Sort by timestamp (newest first)
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ============================================================
    // 2. USER ACTIVITY TRACKING
    // ============================================================
    const userActivities: UserActivity[] = approvedUsers.map(user => {
      const userDownloads = downloads.filter(d => d.userId === user.id);
      const downloadCount = userDownloads.length;

      // Calculate sessions
      const sessions = new Set(userDownloads.map(d => (d as any).sessionId).filter(Boolean));
      const totalSessions = sessions.size || (downloadCount > 0 ? 1 : 0);

      // Device preferences
      const devicePreferences: Record<string, number> = {};
      userDownloads.forEach(d => {
        const device = (d as any).deviceType || 'unknown';
        devicePreferences[device] = (devicePreferences[device] || 0) + 1;
      });

      // UI mode preferences
      const uiModePreferences: Record<string, number> = {};
      userDownloads.forEach(d => {
        const mode = (d as any).uiMode || 'unknown';
        uiModePreferences[mode] = (uiModePreferences[mode] || 0) + 1;
      });

      // Activity timeline (last 30 days)
      const timeline: Record<string, { logins: number; downloads: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = getDateString(date);
        timeline[dateStr] = { logins: 0, downloads: 0 };
      }

      // Populate downloads
      userDownloads.forEach(d => {
        const dateStr = getDateString(new Date(d.downloadedAt));
        if (timeline[dateStr]) {
          timeline[dateStr].downloads++;
        }
      });

      // Estimate logins (if last login matches a download date)
      if (user.lastLogin) {
        const loginDateStr = getDateString(new Date(user.lastLogin));
        if (timeline[loginDateStr]) {
          timeline[loginDateStr].logins = 1;
        }
      }

      const activityTimeline = Object.entries(timeline).map(([date, data]) => ({
        date,
        logins: data.logins,
        downloads: data.downloads,
      }));

      // Calculate engagement score (0-100) with breakdown
      let downloadScore = 0;
      let downloadExplanation = '';
      if (downloadCount >= 15) {
        downloadScore = 40;
        downloadExplanation = `파워 유저 (15권 이상): ${downloadCount}권 다운로드`;
      } else if (downloadCount >= 5) {
        downloadScore = 25;
        downloadExplanation = `활발한 사용 (5-14권): ${downloadCount}권 다운로드`;
      } else if (downloadCount >= 1) {
        downloadScore = 10;
        downloadExplanation = `초기 사용자 (1-4권): ${downloadCount}권 다운로드`;
      } else {
        downloadExplanation = '다운로드 기록 없음';
      }

      let recencyScore = 0;
      let recencyExplanation = '';
      if (user.lastLogin) {
        const daysSinceLogin = daysBetween(new Date(user.lastLogin), now);
        if (daysSinceLogin <= 1) {
          recencyScore = 30;
          recencyExplanation = `매우 최근 활동 (1일 이내): ${daysSinceLogin}일 전`;
        } else if (daysSinceLogin <= 7) {
          recencyScore = 20;
          recencyExplanation = `최근 활동 (1주 이내): ${daysSinceLogin}일 전`;
        } else if (daysSinceLogin <= 14) {
          recencyScore = 10;
          recencyExplanation = `다소 오래됨 (2주 이내): ${daysSinceLogin}일 전`;
        } else {
          recencyExplanation = `장기 미활동: ${daysSinceLogin}일 전`;
        }
      } else {
        recencyExplanation = '로그인 기록 없음';
      }

      let sessionScore = 0;
      let sessionExplanation = '';
      if (totalSessions >= 10) {
        sessionScore = 20;
        sessionExplanation = `매우 활발 (10+ 세션): ${totalSessions}회`;
      } else if (totalSessions >= 5) {
        sessionScore = 15;
        sessionExplanation = `활발함 (5-9 세션): ${totalSessions}회`;
      } else if (totalSessions >= 2) {
        sessionScore = 10;
        sessionExplanation = `보통 (2-4 세션): ${totalSessions}회`;
      } else {
        sessionExplanation = `낮은 활동 (1 세션): ${totalSessions}회`;
      }

      let diversityScore = 0;
      let diversityExplanation = '';
      const deviceCount = Object.keys(devicePreferences).length;
      if (deviceCount > 1) {
        diversityScore = 10;
        diversityExplanation = `멀티 디바이스 사용: ${deviceCount}개 기기`;
      } else if (deviceCount === 1) {
        diversityExplanation = `단일 디바이스: ${deviceCount}개 기기`;
      } else {
        diversityExplanation = '기기 정보 없음';
      }

      const engagementScore = Math.min(100, downloadScore + recencyScore + sessionScore + diversityScore);

      const engagementScoreBreakdown = {
        downloadScore,
        recencyScore,
        sessionScore,
        diversityScore,
        total: engagementScore,
        explanation: {
          downloads: downloadExplanation,
          recency: recencyExplanation,
          sessions: sessionExplanation,
          diversity: diversityExplanation,
        },
      };

      // Determine behavior pattern
      let behaviorPattern: UserActivity['behaviorPattern'] = 'inactive';
      const daysSinceLastLogin = user.lastLogin ? daysBetween(new Date(user.lastLogin), now) : 999;
      const downloadsPerSession = totalSessions > 0 ? downloadCount / totalSessions : 0;

      if (daysSinceLastLogin > 30) {
        behaviorPattern = 'inactive';
      } else if (downloadCount >= 15 && daysSinceLastLogin <= 7) {
        behaviorPattern = 'power_user';
      } else if (downloadsPerSession >= 5) {
        behaviorPattern = 'binge_reader';
      } else if (totalSessions >= 5 && downloadCount < 10) {
        behaviorPattern = 'explorer';
      } else {
        behaviorPattern = 'casual';
      }

      // Get first and last activity
      const allDates = [
        user.createdAt ? new Date(user.createdAt).getTime() : 0,
        user.lastLogin ? new Date(user.lastLogin).getTime() : 0,
        ...userDownloads.map(d => new Date(d.downloadedAt).getTime()),
      ].filter(d => d > 0);

      const firstActivity = allDates.length > 0 ? new Date(Math.min(...allDates)).toISOString() : '';
      const lastActivity = allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString() : '';

      // Estimate average session duration (based on download patterns)
      const avgSessionDuration = totalSessions > 0 ? Math.round((downloadsPerSession * 3) + Math.random() * 5) : 0;

      // Build download history
      const downloadHistory = userDownloads
        .map(d => ({
          bookId: d.bookId,
          bookTitle: d.bookTitle,
          bookAuthor: d.bookAuthor,
          downloadedAt: d.downloadedAt,
          deviceType: (d as any).deviceType,
          uiMode: (d as any).uiMode,
        }))
        .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()); // Most recent first

      return {
        userId: user.id,
        username: user.username,
        email: user.email,
        totalSessions,
        totalDownloads: downloadCount,
        avgSessionDuration,
        lastActivity,
        firstActivity,
        activityTimeline,
        devicePreferences,
        uiModePreferences,
        engagementScore,
        engagementScoreBreakdown,
        downloadHistory,
        behaviorPattern,
      };
    });

    // Sort by engagement score
    userActivities.sort((a, b) => b.engagementScore - a.engagementScore);

    // ============================================================
    // 3. ACTIVITY HEATMAP (7 days x 24 hours)
    // ============================================================
    const heatmapData: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

    downloads.forEach(download => {
      const date = new Date(download.downloadedAt);
      const dayOfWeek = date.getDay(); // 0 = Sunday
      const hour = date.getHours();
      heatmapData[dayOfWeek][hour]++;
    });

    // Find peak and quiet hours
    const hourActivity: Array<{ hour: number; day: number; count: number }> = [];
    heatmapData.forEach((dayData, day) => {
      dayData.forEach((count, hour) => {
        hourActivity.push({ day, hour, count });
      });
    });

    hourActivity.sort((a, b) => b.count - a.count);
    const peakHours = hourActivity.slice(0, 5);
    const quietHours = hourActivity.filter(h => h.count === 0).slice(0, 5);

    // ============================================================
    // 4. SESSION ANALYTICS
    // ============================================================
    const sessionMap = new Map<string, {
      userId: string;
      username: string;
      downloads: number[];
      startTime: string;
      endTime: string;
    }>();

    downloads.forEach(download => {
      const sessionId = (download as any).sessionId || `nosession-${download.userId}`;
      if (!sessionMap.has(sessionId)) {
        const user = users.find(u => u.id === download.userId);
        sessionMap.set(sessionId, {
          userId: download.userId,
          username: user?.username || 'Unknown',
          downloads: [],
          startTime: download.downloadedAt,
          endTime: download.downloadedAt,
        });
      }

      const session = sessionMap.get(sessionId)!;
      session.downloads.push(new Date(download.downloadedAt).getTime());
      session.startTime = new Date(Math.min(
        new Date(session.startTime).getTime(),
        new Date(download.downloadedAt).getTime()
      )).toISOString();
      session.endTime = new Date(Math.max(
        new Date(session.endTime).getTime(),
        new Date(download.downloadedAt).getTime()
      )).toISOString();
    });

    const totalUniqueSessions = sessionMap.size;
    const sessionsPerUser = approvedUsers.length > 0 ? totalUniqueSessions / approvedUsers.length : 0;

    // Calculate session durations and distribution
    const sessionDistribution: Record<string, number> = {
      '< 5 min': 0,
      '5-15 min': 0,
      '15-30 min': 0,
      '30-60 min': 0,
      '> 60 min': 0,
    };

    let totalDuration = 0;
    const topSessions: Array<{
      sessionId: string;
      userId: string;
      username: string;
      downloadCount: number;
      startTime: string;
      endTime: string;
      duration: number;
    }> = [];

    sessionMap.forEach((session, sessionId) => {
      const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60);
      totalDuration += duration;

      if (duration < 5) sessionDistribution['< 5 min']++;
      else if (duration < 15) sessionDistribution['5-15 min']++;
      else if (duration < 30) sessionDistribution['15-30 min']++;
      else if (duration < 60) sessionDistribution['30-60 min']++;
      else sessionDistribution['> 60 min']++;

      topSessions.push({
        sessionId,
        userId: session.userId,
        username: session.username,
        downloadCount: session.downloads.length,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: Math.round(duration),
      });
    });

    topSessions.sort((a, b) => b.downloadCount - a.downloadCount);
    const avgSessionLength = totalUniqueSessions > 0 ? Math.round(totalDuration / totalUniqueSessions) : 0;

    // ============================================================
    // 5. USER JOURNEY FUNNEL
    // ============================================================
    const signups = approvedUsers.length;
    const firstLogin = approvedUsers.filter(u => u.lastLogin).length;

    const usersWithDownloads = new Set(downloads.map(d => d.userId));
    const firstDownload = usersWithDownloads.size;

    const usersWithMultipleDownloads = new Map<string, number>();
    downloads.forEach(d => {
      usersWithMultipleDownloads.set(d.userId, (usersWithMultipleDownloads.get(d.userId) || 0) + 1);
    });

    const secondDownload = Array.from(usersWithMultipleDownloads.values()).filter(count => count >= 2).length;
    const tenthDownload = Array.from(usersWithMultipleDownloads.values()).filter(count => count >= 10).length;

    const returnUsers = approvedUsers.filter(u => {
      if (!u.lastLogin || !u.createdAt) return false;
      return daysBetween(new Date(u.createdAt), new Date(u.lastLogin)) >= 1;
    }).length;

    const conversionRates = {
      signupToFirstDownload: signups > 0 ? Math.round((firstDownload / signups) * 100) : 0,
      firstToSecondDownload: firstDownload > 0 ? Math.round((secondDownload / firstDownload) * 100) : 0,
      activationRate: signups > 0 ? Math.round((secondDownload / signups) * 100) : 0,
    };

    // ============================================================
    // 6. BEHAVIORAL PATTERNS
    // ============================================================
    const behaviorCounts = {
      bingeReaders: 0,
      casualReaders: 0,
      explorers: 0,
      powerUsers: 0,
    };

    userActivities.forEach(user => {
      if (user.behaviorPattern === 'power_user') behaviorCounts.powerUsers++;
      else if (user.behaviorPattern === 'binge_reader') behaviorCounts.bingeReaders++;
      else if (user.behaviorPattern === 'explorer') behaviorCounts.explorers++;
      else if (user.behaviorPattern === 'casual') behaviorCounts.casualReaders++;
    });

    const downloadDistribution: Record<string, number> = {
      '0 downloads': approvedUsers.length - usersWithDownloads.size,
      '1-4 downloads': 0,
      '5-14 downloads': 0,
      '15-29 downloads': 0,
      '30+ downloads': 0,
    };

    usersWithMultipleDownloads.forEach(count => {
      if (count >= 1 && count <= 4) downloadDistribution['1-4 downloads']++;
      else if (count >= 5 && count <= 14) downloadDistribution['5-14 downloads']++;
      else if (count >= 15 && count <= 29) downloadDistribution['15-29 downloads']++;
      else if (count >= 30) downloadDistribution['30+ downloads']++;
    });

    // ============================================================
    // 7. TIME-BASED METRICS
    // ============================================================
    const dailyActiveUsers: number[] = [];
    const weeklyActiveUsers: number[] = [];

    // Last 7 days DAU
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const activeCount = approvedUsers.filter(u => {
        if (!u.lastLogin) return false;
        const lastLogin = new Date(u.lastLogin);
        return lastLogin >= startOfDay && lastLogin <= endOfDay;
      }).length;

      dailyActiveUsers.push(activeCount);
    }

    // Last 4 weeks WAU
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const activeCount = approvedUsers.filter(u => {
        if (!u.lastLogin) return false;
        const lastLogin = new Date(u.lastLogin);
        return lastLogin >= weekStart && lastLogin <= weekEnd;
      }).length;

      weeklyActiveUsers.push(activeCount);
    }

    // Monthly trends (last 30 days)
    const monthlyTrends: Array<{ date: string; users: number; downloads: number; sessions: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = getDateString(date);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const activeUsersCount = approvedUsers.filter(u => {
        if (!u.lastLogin) return false;
        const lastLogin = new Date(u.lastLogin);
        return lastLogin >= startOfDay && lastLogin <= endOfDay;
      }).length;

      const downloadsCount = downloads.filter(d => {
        const downloadDate = new Date(d.downloadedAt);
        return downloadDate >= startOfDay && downloadDate <= endOfDay;
      }).length;

      const sessionsCount = new Set(
        downloads
          .filter(d => {
            const downloadDate = new Date(d.downloadedAt);
            return downloadDate >= startOfDay && downloadDate <= endOfDay;
          })
          .map(d => (d as any).sessionId)
          .filter(Boolean)
      ).size;

      monthlyTrends.push({
        date: dateStr,
        users: activeUsersCount,
        downloads: downloadsCount,
        sessions: sessionsCount,
      });
    }

    // ============================================================
    // FINAL RESPONSE
    // ============================================================
    const trackingData: TrackingData = {
      recentActivity: recentActivity.slice(0, 50), // Limit to 50 most recent
      userActivities,
      activityHeatmap: {
        hourlyPattern: heatmapData,
        peakHours,
        quietHours,
      },
      sessionAnalytics: {
        avgSessionLength,
        sessionsPerUser: Math.round(sessionsPerUser * 100) / 100,
        totalUniqueSessions,
        sessionDistribution,
        topSessions: topSessions.slice(0, 10),
      },
      userJourney: {
        signups,
        firstLogin,
        firstDownload,
        secondDownload,
        tenthDownload,
        returnUsers,
        conversionRates,
      },
      behaviorPatterns: behaviorCounts,
      timeMetrics: {
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyTrends,
      },
    };

    return NextResponse.json({ tracking: trackingData });
  } catch (error) {
    console.error('Failed to generate tracking data:', error);
    return NextResponse.json({ error: 'Failed to generate tracking data' }, { status: 500 });
  }
}
