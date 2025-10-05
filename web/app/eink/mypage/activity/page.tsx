'use client';

import { useEffect, useState } from 'react';

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

export default function EinkActivityPage() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'all'>('12m');
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
    const months = timeRange === '6m' ? 6 : timeRange === '12m' ? 12 : 24;

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
        displayMonth: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`,
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
      .map(([year, count]) => ({ year, count }))
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
      { title: '첫 걸음', target: 1, icon: '▪' },
      { title: '시작', target: 2, icon: '▪' },
      { title: '발견', target: 3, icon: '▪' },
      { title: '탐색', target: 4, icon: '▪' },
      { title: '다섯 권', target: 5, icon: '▪' },
      { title: '호기심', target: 6, icon: '▪' },
      { title: '성장', target: 7, icon: '▪' },
      { title: '발전', target: 8, icon: '▪' },
      { title: '아홉 권', target: 9, icon: '▪' },
      { title: '독서 입문', target: 10, icon: '▪' },
      { title: '꾸준함', target: 12, icon: '▪' },
      { title: '습관 형성', target: 14, icon: '▪' },
      { title: '열다섯 권', target: 15, icon: '▪' },
      { title: '지속', target: 17, icon: '▪' },
      { title: '스무 권', target: 20, icon: '▪' },
      { title: '탐험가', target: 22, icon: '▪' },
      { title: '이십오 권', target: 25, icon: '▪' },
      { title: '책 애호가', target: 27, icon: '▪' },
      { title: '삼십 권', target: 30, icon: '▪' },
      { title: '독서 여행자', target: 32, icon: '▪' },
      { title: '서른다섯 권', target: 35, icon: '▪' },
      { title: '열정', target: 37, icon: '▪' },
      { title: '마흔 권', target: 40, icon: '▪' },
      { title: '헌신', target: 42, icon: '▪' },
      { title: '마흔다섯 권', target: 45, icon: '▪' },
      { title: '거의 쉰 권', target: 47, icon: '▪' },
      { title: '마흔아홉 권', target: 49, icon: '▪' },
      { title: '열정 독자', target: 50, icon: '▪' },
      { title: '지식 수집', target: 52, icon: '▪' },
      { title: '쉰다섯 권', target: 55, icon: '▪' },

      // 56-100권: 빠른 성취감 유지 (20단계)
      { title: '책의 친구', target: 58, icon: '▪' },
      { title: '예순 권', target: 60, icon: '▪' },
      { title: '독서 탐구자', target: 63, icon: '▪' },
      { title: '육십오 권', target: 65, icon: '▪' },
      { title: '지식의 길', target: 68, icon: '▪' },
      { title: '일흔 권', target: 70, icon: '▪' },
      { title: '독서 장인', target: 73, icon: '▪' },
      { title: '일흔다섯 권', target: 75, icon: '▪' },
      { title: '헌신적 독자', target: 78, icon: '▪' },
      { title: '여든 권', target: 80, icon: '▪' },
      { title: '팔십오 권', target: 85, icon: '▪' },
      { title: '거의 백권', target: 90, icon: '▪' },
      { title: '아흔다섯 권', target: 95, icon: '▪' },
      { title: '아흔여덟 권', target: 98, icon: '▪' },
      { title: '백권 달성', target: 100, icon: '▪' },
      { title: '백오 권', target: 105, icon: '▪' },
      { title: '백십 권', target: 110, icon: '▪' },
      { title: '백십오 권', target: 115, icon: '▪' },
      { title: '백이십 권', target: 120, icon: '▪' },
      { title: '백이십오 권', target: 125, icon: '▪' },

      // 130-200권: 보통 간격 (20단계)
      { title: '백삼십 권', target: 130, icon: '▪' },
      { title: '백삼십오 권', target: 135, icon: '▪' },
      { title: '백사십 권', target: 140, icon: '▪' },
      { title: '지식의 숲', target: 145, icon: '▪' },
      { title: '백오십 권', target: 150, icon: '▪' },
      { title: '백오십오 권', target: 155, icon: '▪' },
      { title: '백육십 권', target: 160, icon: '▪' },
      { title: '백육십오 권', target: 165, icon: '▪' },
      { title: '백칠십 권', target: 170, icon: '▪' },
      { title: '백칠십오 권', target: 175, icon: '▪' },
      { title: '거의 이백권', target: 180, icon: '▪' },
      { title: '백팔십오 권', target: 185, icon: '▪' },
      { title: '백구십 권', target: 190, icon: '▪' },
      { title: '백구십오 권', target: 195, icon: '▪' },
      { title: '백구십팔 권', target: 198, icon: '▪' },
      { title: '이백권 달성', target: 200, icon: '▪' },
      { title: '이백십 권', target: 210, icon: '▪' },
      { title: '이백이십 권', target: 220, icon: '▪' },
      { title: '지혜의 길', target: 230, icon: '▪' },
      { title: '이백사십 권', target: 240, icon: '▪' },

      // 250-500권: 넓은 간격 (15단계)
      { title: '이백오십 권', target: 250, icon: '▪' },
      { title: '이백육십 권', target: 260, icon: '▪' },
      { title: '이백칠십 권', target: 270, icon: '▪' },
      { title: '거의 삼백권', target: 280, icon: '▪' },
      { title: '이백구십 권', target: 290, icon: '▪' },
      { title: '삼백권 달성', target: 300, icon: '▪' },
      { title: '삼백이십 권', target: 320, icon: '▪' },
      { title: '삼백사십 권', target: 340, icon: '▪' },
      { title: '삼백육십 권', target: 360, icon: '▪' },
      { title: '삼백팔십 권', target: 380, icon: '▪' },
      { title: '사백권 달성', target: 400, icon: '▪' },
      { title: '사백삼십 권', target: 430, icon: '▪' },
      { title: '사백육십 권', target: 460, icon: '▪' },
      { title: '거의 오백권', target: 480, icon: '▪' },
      { title: '오백권 달성', target: 500, icon: '▪' },

      // 520-1000권: 매우 넓은 간격 (15단계)
      { title: '오백삼십 권', target: 530, icon: '▪' },
      { title: '지식의 바다', target: 560, icon: '▪' },
      { title: '육백권 달성', target: 600, icon: '▪' },
      { title: '육백오십 권', target: 650, icon: '▪' },
      { title: '칠백권 달성', target: 700, icon: '▪' },
      { title: '위대한 여정', target: 750, icon: '▪' },
      { title: '팔백권 달성', target: 800, icon: '▪' },
      { title: '독서 항해자', target: 850, icon: '▪' },
      { title: '구백권 달성', target: 900, icon: '▪' },
      { title: '구백이십 권', target: 920, icon: '▪' },
      { title: '구백사십 권', target: 940, icon: '▪' },
      { title: '구백육십 권', target: 960, icon: '▪' },
      { title: '구백팔십 권', target: 980, icon: '▪' },
      { title: '거의 천권', target: 990, icon: '▪' },
      { title: '천권 달성', target: 1000, icon: '▪' },
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
  const maxAuthorCount = authorStats.length > 0 ? Math.max(...authorStats.map(a => a.count)) : 1;
  const milestones = getMilestones();
  const firstDownloadDate = getFirstDownloadDate();
  const nextMilestone = getNextMilestone();
  const avgMonthly = getAverageMonthlyDownloads();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '0.3px'
        }}>
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{
          fontSize: '26px',
          fontWeight: 700,
          marginBottom: '6px',
          letterSpacing: '-0.5px'
        }}>
          독서 활동 대시보드
        </h1>
        {firstDownloadDate && (
          <p style={{
            fontSize: '13px',
            color: '#666666',
            letterSpacing: '0.2px'
          }}>
            {firstDownloadDate}부터 시작
          </p>
        )}
      </div>

      {/* Time Range Filter */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '20px',
        border: '2px solid #000000',
        padding: '4px',
        borderRadius: '6px'
      }}>
        {[
          { value: '6m' as const, label: '6개월' },
          { value: '12m' as const, label: '12개월' },
          { value: 'all' as const, label: '전체' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTimeRange(value)}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '14px',
              fontWeight: 700,
              background: timeRange === value ? '#000000' : 'transparent',
              color: timeRange === value ? '#ffffff' : '#000000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              letterSpacing: '0.2px'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {downloads.length === 0 ? (
        <div className="eink-card" style={{
          padding: '80px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '12px',
            letterSpacing: '0.2px'
          }}>
            아직 다운로드한 책이 없습니다
          </div>
          <div style={{
            fontSize: '15px',
            color: '#666666',
            letterSpacing: '0.2px'
          }}>
            책을 다운로드하면 여기에 독서 활동이 표시됩니다
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div className="eink-card" style={{ padding: '12px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '6px',
                color: '#666666',
                letterSpacing: '0.8px',
                textTransform: 'uppercase'
              }}>
                총 다운로드
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                marginBottom: '2px'
              }}>
                {downloads.length}권
              </div>
              <div style={{
                fontSize: '11px',
                color: '#666666',
                letterSpacing: '0.2px',
                fontWeight: 600
              }}>
                전체 기간
              </div>
            </div>

            <div className="eink-card" style={{ padding: '12px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '6px',
                color: '#666666',
                letterSpacing: '0.8px',
                textTransform: 'uppercase'
              }}>
                이번 달
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                marginBottom: '2px'
              }}>
                {getThisMonthCount()}권
              </div>
              <div style={{
                fontSize: '11px',
                color: '#666666',
                letterSpacing: '0.2px',
                fontWeight: 600
              }}>
                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
              </div>
            </div>

            <div className="eink-card" style={{ padding: '12px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '6px',
                color: '#666666',
                letterSpacing: '0.8px',
                textTransform: 'uppercase'
              }}>
                월평균
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                marginBottom: '2px'
              }}>
                {avgMonthly}권
              </div>
              <div style={{
                fontSize: '11px',
                color: '#666666',
                letterSpacing: '0.2px',
                fontWeight: 600
              }}>
                권/월
              </div>
            </div>

            <div className="eink-card" style={{ padding: '12px' }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                marginBottom: '6px',
                color: '#666666',
                letterSpacing: '0.8px',
                textTransform: 'uppercase'
              }}>
                최다 다운로드
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                marginBottom: '2px'
              }}>
                {mostActiveMonth.count}권
              </div>
              <div style={{
                fontSize: '11px',
                color: '#666666',
                letterSpacing: '0.2px',
                fontWeight: 600
              }}>
                {mostActiveMonth.displayMonth || '-'}
              </div>
            </div>
          </div>

          {/* Chart with Toggle */}
          <div className="eink-card" style={{
            padding: '16px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '16px',
              letterSpacing: '-0.2px'
            }}>
              독서 여정
            </h3>

            {/* Achievement Summary */}
            <div style={{
              background: '#000000',
              color: '#ffffff',
              border: '2px solid #000000',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                marginBottom: '8px',
                opacity: 0.8
              }}>
                달성한 마일스톤
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                marginBottom: '4px'
              }}>
                {milestones.filter(m => m.achieved).length} / {milestones.length}
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.2px'
              }}>
                {milestones.filter(m => m.achieved).length === 0
                  ? '독서 여정을 시작하세요!'
                  : milestones.filter(m => m.achieved).length === milestones.length
                  ? '완벽한 독서 마스터!'
                  : `${milestones[milestones.filter(m => m.achieved).length - 1]?.title} 달성!`
                }
              </div>
            </div>

            {/* Next Challenge */}
            {nextMilestone && (
              <div style={{
                background: '#f0f0f0',
                border: '2px solid #cccccc',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  marginBottom: '10px',
                  textAlign: 'center'
                }}>
                  ⚡ 다음 도전
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginBottom: '12px'
                }}>
                  <div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      letterSpacing: '0.2px',
                      marginBottom: '2px'
                    }}>
                      {nextMilestone.title}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#666666',
                      fontWeight: 600,
                      letterSpacing: '0.2px'
                    }}>
                      {nextMilestone.target}권 목표
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      letterSpacing: '-0.5px',
                      lineHeight: 1
                    }}>
                      {nextMilestone.remaining}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.2px'
                    }}>
                      권 남음
                    </div>
                  </div>
                </div>
                <div style={{
                  background: '#cccccc',
                  border: '2px solid #000000',
                  height: '16px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div
                    style={{
                      background: '#000000',
                      height: '100%',
                      width: `${nextMilestone.progress}%`
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.2px'
                  }}>
                    {downloads.length}권 완료
                  </div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.2px'
                  }}>
                    {nextMilestone.progress.toFixed(0)}% 달성
                  </div>
                </div>
              </div>
            )}

            {/* Motivation Message */}
            {nextMilestone && nextMilestone.remaining <= 5 && (
              <div style={{
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #000000',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.2px'
                }}>
                  🔥 거의 다 왔습니다! 단 {nextMilestone.remaining}권만 더!
                </div>
              </div>
            )}

            {/* Milestones Grid - 현재 + 앞 2단계만 표시 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '16px'
            }}>
              {(() => {
                const achievedCount = milestones.filter(m => m.achieved).length;
                const visibleMilestones = milestones.slice(
                  Math.max(0, achievedCount - 1),
                  achievedCount + 2
                );

                return visibleMilestones.map((milestone, idx) => {
                  const actualIndex = Math.max(0, achievedCount - 1) + idx;
                  return (
                    <div
                      key={milestone.target}
                      style={{
                        border: milestone.achieved ? '2px solid #000000' : '1px solid #cccccc',
                        background: milestone.achieved ? '#000000' : '#f8f8f8',
                        color: milestone.achieved ? '#ffffff' : '#999999',
                        padding: '10px 6px',
                        textAlign: 'center',
                        borderRadius: '6px',
                        position: 'relative'
                      }}
                    >
                      {milestone.achieved && (
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          fontSize: '10px'
                        }}>
                          ✓
                        </div>
                      )}
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        marginBottom: '3px',
                        letterSpacing: '0.2px'
                      }}>
                        {actualIndex + 1}단계
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        letterSpacing: '0.1px',
                        marginBottom: '2px'
                      }}>
                        {milestone.target}
                      </div>
                      <div style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: '0.2px'
                      }}>
                        {milestone.title}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Stats Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              paddingTop: '16px',
              borderTop: '2px solid #cccccc'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '10px'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#666666',
                  fontWeight: 600,
                  marginBottom: '4px',
                  letterSpacing: '0.2px'
                }}>
                  월평균 페이스
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '-0.3px'
                }}>
                  {avgMonthly}권
                </div>
              </div>
              <div style={{
                textAlign: 'center',
                padding: '10px'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#666666',
                  fontWeight: 600,
                  marginBottom: '4px',
                  letterSpacing: '0.2px'
                }}>
                  {nextMilestone ? `${nextMilestone.title}까지` : '총 달성'}
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '-0.3px'
                }}>
                  {nextMilestone
                    ? `${nextMilestone.remaining}권`
                    : `${milestones.length}개`
                  }
                </div>
              </div>
            </div>

            {!nextMilestone && downloads.length > 0 && (
              <div style={{
                background: '#000000',
                color: '#ffffff',
                border: '3px solid #000000',
                borderRadius: '6px',
                padding: '24px',
                textAlign: 'center',
                marginTop: '16px'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  marginBottom: '8px',
                  letterSpacing: '0.2px'
                }}>
                  🏆 완벽한 달성!
                </div>
                <div style={{
                  fontSize: '14px',
                  letterSpacing: '0.2px',
                  marginBottom: '6px'
                }}>
                  모든 마일스톤을 정복했습니다
                </div>
                <div style={{
                  fontSize: '12px',
                  letterSpacing: '0.2px',
                  opacity: 0.8
                }}>
                  천권을 달성한 진정한 독서가입니다!
                </div>
              </div>
            )}
          </div>

          {authorStats.length > 0 && (
            <div className="eink-card" style={{
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '-0.2px'
                }}>
                  저자 TOP 5
                </h3>
                <div style={{
                  fontSize: '11px',
                  color: '#666666',
                  letterSpacing: '0.2px'
                }}>
                  전체 다운로드 기준
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {authorStats.map((data, index) => (
                  <div key={data.author}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '6px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        border: '2px solid #000000',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </div>
                      <div style={{
                        flex: 1,
                        fontSize: '13px',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.1px'
                      }}>
                        {data.author}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        letterSpacing: '0.2px',
                        flexShrink: 0
                      }}>
                        {data.count}권
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#666666',
                        letterSpacing: '0.2px',
                        flexShrink: 0,
                        width: '40px',
                        textAlign: 'right'
                      }}>
                        {((data.count / downloads.length) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div style={{
                      background: '#e0e0e0',
                      border: '1px solid #999999',
                      height: '10px',
                      borderRadius: '5px',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          background: '#000000',
                          height: '100%',
                          width: `${(data.count / maxAuthorCount) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '2px solid #cccccc'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#666666',
                    marginBottom: '4px',
                    fontWeight: 600,
                    letterSpacing: '0.2px'
                  }}>
                    1위 저자
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.1px'
                  }} title={authorStats[0]?.author}>
                    {authorStats[0]?.author}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#666666',
                    marginBottom: '4px',
                    fontWeight: 600,
                    letterSpacing: '0.2px'
                  }}>
                    1위 다운로드
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.1px'
                  }}>
                    {authorStats[0]?.count}권
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#666666',
                    marginBottom: '4px',
                    fontWeight: 600,
                    letterSpacing: '0.2px'
                  }}>
                    1위 비중
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.1px'
                  }}>
                    {((authorStats[0]?.count / downloads.length) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Milestones */}

          <div className="eink-card" style={{
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '-0.2px'
              }}>
                다운로드 추세
              </h3>
              <div style={{
                display: 'flex',
                gap: '4px',
                border: '2px solid #000000',
                padding: '2px',
                borderRadius: '4px'
              }}>
                <button
                  onClick={() => setChartType('monthly')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: chartType === 'monthly' ? '#000000' : 'transparent',
                    color: chartType === 'monthly' ? '#ffffff' : '#000000',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    letterSpacing: '0.2px'
                  }}
                >
                  월별
                </button>
                <button
                  onClick={() => setChartType('yearly')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: chartType === 'yearly' ? '#000000' : 'transparent',
                    color: chartType === 'yearly' ? '#ffffff' : '#000000',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    letterSpacing: '0.2px'
                  }}
                >
                  연도별
                </button>
              </div>
            </div>

            {chartType === 'monthly' ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {monthlyData.map((data) => (
                  <div key={data.month} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '70px',
                      fontSize: '12px',
                      fontWeight: 600,
                      letterSpacing: '0.1px',
                      flexShrink: 0
                    }}>
                      {data.displayMonth}
                    </div>
                    <div style={{
                      flex: 1,
                      background: '#e0e0e0',
                      border: '1px solid #999999',
                      height: '28px',
                      position: 'relative',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          background: '#000000',
                          height: '100%',
                          width: `${(data.count / maxMonthly) * 100}%`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          padding: '0 8px'
                        }}
                      >
                        {data.count > 0 && (
                          <span style={{
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.2px'
                          }}>
                            {data.count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {yearlyData.map((data) => (
                  <div key={data.year} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '70px',
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '0.1px',
                      flexShrink: 0
                    }}>
                      {data.year}
                    </div>
                    <div style={{
                      flex: 1,
                      background: '#e0e0e0',
                      border: '1px solid #999999',
                      height: '32px',
                      position: 'relative',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          background: '#000000',
                          height: '100%',
                          width: `${(data.count / maxYearly) * 100}%`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          padding: '0 10px'
                        }}
                      >
                        <span style={{
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: 700,
                          letterSpacing: '0.2px'
                        }}>
                          {data.count}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Authors */}
        </>
      )}
    </div>
  );
}
