import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getDownloads } from '@/lib/auth';

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

export async function GET(request: NextRequest) {
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
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Failed to generate analytics:', error);
    return NextResponse.json({ error: 'Failed to generate analytics' }, { status: 500 });
  }
}
