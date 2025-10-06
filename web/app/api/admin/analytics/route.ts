import { NextResponse } from 'next/server';
import { getUsers, getDownloads } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

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
  // Enhanced professional analytics
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

// Helper: Get week identifier (YYYY-WW format)
function getWeekIdentifier(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
}

// Helper: Calculate days between dates
function daysBetween(date1: Date, date2: Date): number {
  return Math.floor((date2.getTime() - date1.getTime()) / (24 * 60 * 60 * 1000));
}

export async function GET() {
  // TODO: Add admin authentication check

  try {
    const users = getUsers();
    const downloads = getDownloads();

    // Calculate time periods
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User Engagement Metrics
    const approvedUsers = users.filter(u => u.approved);
    const totalUsers = approvedUsers.length;

    const dailyActiveUsers = approvedUsers.filter(u => {
      if (!u.lastLogin) return false;
      return new Date(u.lastLogin) > oneDayAgo;
    }).length;

    const monthlyActiveUsers = approvedUsers.filter(u => {
      if (!u.lastLogin) return false;
      return new Date(u.lastLogin) > oneMonthAgo;
    }).length;

    const activeUserRate = totalUsers > 0 ? (monthlyActiveUsers / totalUsers) * 100 : 0;

    // Download Analytics
    const totalDownloads = downloads.length;

    const downloadsToday = downloads.filter(d => {
      return new Date(d.downloadedAt) > oneDayAgo;
    }).length;

    const downloadsThisWeek = downloads.filter(d => {
      return new Date(d.downloadedAt) > oneWeekAgo;
    }).length;

    const downloadsThisMonth = downloads.filter(d => {
      return new Date(d.downloadedAt) > oneMonthAgo;
    }).length;

    // Downloads by Device Type
    const byDeviceType: Record<string, number> = {};
    downloads.forEach(d => {
      const device = d.deviceType || 'unknown';
      byDeviceType[device] = (byDeviceType[device] || 0) + 1;
    });

    // Downloads by UI Mode
    const byUIMode: Record<string, number> = {};
    downloads.forEach(d => {
      const mode = d.uiMode || 'unknown';
      byUIMode[mode] = (byUIMode[mode] || 0) + 1;
    });

    // Popular Books
    const bookDownloadCounts: Record<number, {
      count: number;
      title?: string;
      author?: string;
    }> = {};

    downloads.forEach(d => {
      if (!bookDownloadCounts[d.bookId]) {
        bookDownloadCounts[d.bookId] = {
          count: 0,
          title: d.bookTitle,
          author: d.bookAuthor,
        };
      }
      bookDownloadCounts[d.bookId].count++;
    });

    const popularBooks = Object.entries(bookDownloadCounts)
      .map(([bookId, data]) => ({
        bookId: parseInt(bookId),
        bookTitle: data.title,
        bookAuthor: data.author,
        downloadCount: data.count,
      }))
      .sort((a, b) => b.downloadCount - a.downloadCount)
      .slice(0, 10); // Top 10

    // Session Analytics
    const sessionIds = new Set(downloads.map(d => d.sessionId).filter(Boolean));
    const totalSessions = sessionIds.size;
    const averageBooksPerSession = totalSessions > 0 ? totalDownloads / totalSessions : 0;

    // ============================================================
    // ENHANCED PROFESSIONAL ANALYTICS
    // ============================================================

    // 1. USER SEGMENTATION (RFM Model)
    const userSegments = {
      powerUsers: 0,
      regularReaders: 0,
      casualReaders: 0,
      atRisk: 0,
      churned: 0,
    };

    approvedUsers.forEach(user => {
      const userDownloads = downloads.filter(d => d.userId === user.id);
      const downloadCount = userDownloads.length;

      if (!user.lastLogin) {
        userSegments.churned++;
        return;
      }

      const daysSinceLastLogin = daysBetween(new Date(user.lastLogin), now);

      if (daysSinceLastLogin > 30) {
        userSegments.churned++;
      } else if (daysSinceLastLogin > 14) {
        userSegments.atRisk++;
      } else if (downloadCount >= 15 && daysSinceLastLogin <= 7) {
        userSegments.powerUsers++;
      } else if (downloadCount >= 5 && daysSinceLastLogin <= 14) {
        userSegments.regularReaders++;
      } else {
        userSegments.casualReaders++;
      }
    });

    const segmentDistribution = {
      'Power Users': userSegments.powerUsers,
      'Regular Readers': userSegments.regularReaders,
      'Casual Readers': userSegments.casualReaders,
      'At Risk': userSegments.atRisk,
      'Churned': userSegments.churned,
    };

    // 2. RETENTION METRICS
    const d1Retention = approvedUsers.filter(u => {
      if (!u.createdAt || !u.lastLogin) return false;
      const signupDate = new Date(u.createdAt);
      const lastLoginDate = new Date(u.lastLogin);
      const daysSinceSignup = daysBetween(signupDate, now);
      const daysBetweenSignupAndLogin = daysBetween(signupDate, lastLoginDate);
      return daysSinceSignup >= 1 && daysBetweenSignupAndLogin <= 1;
    }).length;

    const d7Retention = approvedUsers.filter(u => {
      if (!u.createdAt || !u.lastLogin) return false;
      const signupDate = new Date(u.createdAt);
      const lastLoginDate = new Date(u.lastLogin);
      const daysSinceSignup = daysBetween(signupDate, now);
      const daysBetweenSignupAndLogin = daysBetween(signupDate, lastLoginDate);
      return daysSinceSignup >= 7 && daysBetweenSignupAndLogin <= 7;
    }).length;

    const d30Retention = approvedUsers.filter(u => {
      if (!u.createdAt || !u.lastLogin) return false;
      const signupDate = new Date(u.createdAt);
      const lastLoginDate = new Date(u.lastLogin);
      const daysSinceSignup = daysBetween(signupDate, now);
      const daysBetweenSignupAndLogin = daysBetween(signupDate, lastLoginDate);
      return daysSinceSignup >= 30 && daysBetweenSignupAndLogin <= 30;
    }).length;

    const usersOlderThan1Day = approvedUsers.filter(u =>
      u.createdAt && daysBetween(new Date(u.createdAt), now) >= 1
    ).length;
    const usersOlderThan7Days = approvedUsers.filter(u =>
      u.createdAt && daysBetween(new Date(u.createdAt), now) >= 7
    ).length;
    const usersOlderThan30Days = approvedUsers.filter(u =>
      u.createdAt && daysBetween(new Date(u.createdAt), now) >= 30
    ).length;

    const retentionMetrics = {
      d1Retention: usersOlderThan1Day > 0 ? Math.round((d1Retention / usersOlderThan1Day) * 100) : 0,
      d7Retention: usersOlderThan7Days > 0 ? Math.round((d7Retention / usersOlderThan7Days) * 100) : 0,
      d30Retention: usersOlderThan30Days > 0 ? Math.round((d30Retention / usersOlderThan30Days) * 100) : 0,
    };

    // 3. COHORT ANALYSIS (Last 8 weeks)
    const cohortMap = new Map<string, {
      signups: Set<string>,
      week1Active: Set<string>,
      week2Active: Set<string>,
      week3Active: Set<string>,
      week4Active: Set<string>,
    }>();

    // Initialize cohorts
    approvedUsers.forEach(user => {
      if (!user.createdAt) return;
      const cohortWeek = getWeekIdentifier(new Date(user.createdAt));
      if (!cohortMap.has(cohortWeek)) {
        cohortMap.set(cohortWeek, {
          signups: new Set(),
          week1Active: new Set(),
          week2Active: new Set(),
          week3Active: new Set(),
          week4Active: new Set(),
        });
      }
      cohortMap.get(cohortWeek)!.signups.add(user.id);
    });

    // Calculate cohort retention
    approvedUsers.forEach(user => {
      if (!user.createdAt || !user.lastLogin) return;
      const cohortWeek = getWeekIdentifier(new Date(user.createdAt));
      const cohort = cohortMap.get(cohortWeek);
      if (!cohort) return;

      const signupDate = new Date(user.createdAt);
      const lastLoginDate = new Date(user.lastLogin);
      const weeksSinceSignup = Math.floor(daysBetween(signupDate, lastLoginDate) / 7);

      if (weeksSinceSignup >= 0 && weeksSinceSignup < 1) cohort.week1Active.add(user.id);
      if (weeksSinceSignup >= 1 && weeksSinceSignup < 2) cohort.week2Active.add(user.id);
      if (weeksSinceSignup >= 2 && weeksSinceSignup < 3) cohort.week3Active.add(user.id);
      if (weeksSinceSignup >= 3 && weeksSinceSignup < 4) cohort.week4Active.add(user.id);
    });

    const cohortAnalysis = Array.from(cohortMap.entries())
      .map(([cohortWeek, data]) => ({
        cohortWeek,
        signupCount: data.signups.size,
        week1Retention: data.signups.size > 0 ? Math.round((data.week1Active.size / data.signups.size) * 100) : 0,
        week2Retention: data.signups.size > 0 ? Math.round((data.week2Active.size / data.signups.size) * 100) : 0,
        week3Retention: data.signups.size > 0 ? Math.round((data.week3Active.size / data.signups.size) * 100) : 0,
        week4Retention: data.signups.size > 0 ? Math.round((data.week4Active.size / data.signups.size) * 100) : 0,
      }))
      .sort((a, b) => b.cohortWeek.localeCompare(a.cohortWeek))
      .slice(0, 8); // Last 8 weeks

    // 4. CONTENT ANALYTICS
    const genreDistribution: Record<string, number> = {};
    const uniqueBooks = new Set<number>();

    downloads.forEach(d => {
      uniqueBooks.add(d.bookId);
      const genre = (d as any).genre || 'Unknown';
      genreDistribution[genre] = (genreDistribution[genre] || 0) + 1;
    });

    // Get actual total books count from filesystem
    const booksDir = process.env.BOOKS_DIR || path.join(process.cwd(), '..', 'books');
    let totalBooksInLibrary = 0;
    try {
      if (fs.existsSync(booksDir)) {
        const files = fs.readdirSync(booksDir);
        totalBooksInLibrary = files.filter(file => file.endsWith('.epub')).length;
      }
    } catch (error) {
      console.error('Failed to count books in library:', error);
      totalBooksInLibrary = Object.keys(bookDownloadCounts).length; // Fallback
    }

    // Calculate hit concentration (Pareto principle)
    const sortedBooks = Object.values(bookDownloadCounts)
      .sort((a, b) => b.count - a.count);
    const top20PercentCount = Math.ceil(sortedBooks.length * 0.2);
    const top20Downloads = sortedBooks.slice(0, top20PercentCount)
      .reduce((sum, book) => sum + book.count, 0);
    const hitConcentration = totalDownloads > 0 ? Math.round((top20Downloads / totalDownloads) * 100) : 0;

    const bottom50PercentStart = Math.floor(sortedBooks.length * 0.5);
    const bottom50Downloads = sortedBooks.slice(bottom50PercentStart)
      .reduce((sum, book) => sum + book.count, 0);
    const longTailValue = totalDownloads > 0 ? Math.round((bottom50Downloads / totalDownloads) * 100) : 0;

    // 5. PLATFORM METRICS
    const einkSessions = downloads.filter(d => (d as any).uiMode === 'eink').length;
    const einkAdoptionRate = totalDownloads > 0 ? Math.round((einkSessions / totalDownloads) * 100) : 0;

    const userDevices = new Map<string, Set<string>>();
    downloads.forEach(d => {
      const deviceType = (d as any).deviceType || 'unknown';
      if (!userDevices.has(d.userId)) {
        userDevices.set(d.userId, new Set());
      }
      userDevices.get(d.userId)!.add(deviceType);
    });
    const crossPlatformUsers = Array.from(userDevices.values())
      .filter(devices => devices.size > 1).length;

    const sessionQualityByPlatform: Record<string, { avgDownloadsPerSession: number; sessionCount: number }> = {};
    const platformSessions = new Map<string, Map<string, number>>();

    downloads.forEach(d => {
      const platform = (d as any).uiMode || 'unknown';
      const sessionId = (d as any).sessionId || 'no-session';

      if (!platformSessions.has(platform)) {
        platformSessions.set(platform, new Map());
      }
      const sessions = platformSessions.get(platform)!;
      sessions.set(sessionId, (sessions.get(sessionId) || 0) + 1);
    });

    platformSessions.forEach((sessions, platform) => {
      const sessionCount = sessions.size;
      const totalDownloadsInPlatform = Array.from(sessions.values()).reduce((sum, count) => sum + count, 0);
      sessionQualityByPlatform[platform] = {
        avgDownloadsPerSession: sessionCount > 0 ? Math.round((totalDownloadsInPlatform / sessionCount) * 100) / 100 : 0,
        sessionCount,
      };
    });

    // 6. PREDICTIVE INSIGHTS
    const churnRiskScore = {
      highRisk: userSegments.atRisk,
      mediumRisk: userSegments.casualReaders,
      lowRisk: userSegments.powerUsers + userSegments.regularReaders,
    };

    // Calculate growth rates (week-over-week)
    const oneWeekAgoDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgoDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const usersLastWeek = approvedUsers.filter(u =>
      u.createdAt && new Date(u.createdAt) <= oneWeekAgoDate
    ).length;
    const usersTwoWeeksAgo = approvedUsers.filter(u =>
      u.createdAt && new Date(u.createdAt) <= twoWeeksAgoDate
    ).length;
    const userGrowthRate = usersTwoWeeksAgo > 0
      ? Math.round(((usersLastWeek - usersTwoWeeksAgo) / usersTwoWeeksAgo) * 100)
      : 0;

    const downloadsLastWeek = downloads.filter(d =>
      new Date(d.downloadedAt) <= oneWeekAgoDate
    ).length;
    const downloadsTwoWeeksAgo = downloads.filter(d =>
      new Date(d.downloadedAt) <= twoWeeksAgoDate
    ).length;
    const downloadGrowthRate = downloadsTwoWeeksAgo > 0
      ? Math.round(((downloadsLastWeek - downloadsTwoWeeksAgo) / downloadsTwoWeeksAgo) * 100)
      : 0;

    const analytics: AnalyticsData = {
      userEngagement: {
        totalUsers,
        dailyActiveUsers,
        monthlyActiveUsers,
        activeUserRate: Math.round(activeUserRate * 100) / 100,
      },
      downloads: {
        total: totalDownloads,
        today: downloadsToday,
        thisWeek: downloadsThisWeek,
        thisMonth: downloadsThisMonth,
        byDeviceType,
        byUIMode,
      },
      popularBooks,
      sessionAnalytics: {
        totalSessions,
        averageBooksPerSession: Math.round(averageBooksPerSession * 100) / 100,
      },
      // Enhanced professional analytics
      userSegmentation: {
        ...userSegments,
        segmentDistribution,
      },
      retentionMetrics,
      cohortAnalysis,
      contentAnalytics: {
        genreDistribution,
        catalogCoverage: {
          totalBooks: totalBooksInLibrary,
          downloadedBooks: uniqueBooks.size,
          coveragePercentage: totalBooksInLibrary > 0
            ? Math.round((uniqueBooks.size / totalBooksInLibrary) * 100)
            : 0,
        },
        contentLifecycle: {
          hitConcentration,
          longTailValue,
        },
      },
      platformMetrics: {
        einkAdoptionRate,
        crossPlatformUsers,
        sessionQualityByPlatform,
      },
      predictiveInsights: {
        churnRiskScore,
        growthMomentum: {
          userGrowthRate,
          downloadGrowthRate,
        },
      },
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Failed to generate analytics:', error);
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 });
  }
}
