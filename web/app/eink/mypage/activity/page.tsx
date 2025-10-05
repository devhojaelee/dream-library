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

export default function EinkActivityPage() {
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px'
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 600
        }}>
          로딩 중...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 700,
        marginBottom: '16px'
      }}>
        독서 활동
      </h2>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: '#ffffff',
          border: '2px solid #000000',
          padding: '16px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '8px'
          }}>
            총 다운로드
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 700
          }}>
            {downloads.length}권
          </div>
        </div>
        <div style={{
          background: '#ffffff',
          border: '2px solid #000000',
          padding: '16px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '8px'
          }}>
            이번 달
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 700
          }}>
            {getThisMonthCount()}권
          </div>
        </div>
        <div style={{
          background: '#ffffff',
          border: '2px solid #000000',
          padding: '16px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '8px'
          }}>
            가장 활발했던 달
          </div>
          {mostActiveMonth.count > 0 ? (
            <>
              <div style={{
                fontSize: '32px',
                fontWeight: 700,
                marginBottom: '4px'
              }}>
                {mostActiveMonth.count}권
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 600
              }}>
                {mostActiveMonth.month}
              </div>
            </>
          ) : (
            <div style={{
              fontSize: '32px',
              fontWeight: 700
            }}>
              0권
            </div>
          )}
        </div>
      </div>

      {downloads.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '2px solid #000000',
          padding: '48px 16px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '8px'
          }}>
            아직 다운로드한 책이 없습니다.
          </div>
          <div style={{ fontSize: '16px' }}>
            책을 다운로드하면 여기에 독서 활동이 표시됩니다.
          </div>
        </div>
      ) : (
        <>
          {/* Monthly Chart */}
          <div style={{
            background: '#ffffff',
            border: '2px solid #000000',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '22px',
              fontWeight: 700,
              marginBottom: '16px'
            }}>
              월별 다운로드 (최근 12개월)
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {monthlyData.map((data) => (
                <div key={data.month} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '120px',
                    fontSize: '14px',
                    fontWeight: 600
                  }}>
                    {data.month}
                  </div>
                  <div style={{
                    flex: 1,
                    background: '#f0f0f0',
                    border: '1px solid #000000',
                    height: '40px',
                    position: 'relative'
                  }}>
                    <div
                      style={{
                        background: '#000000',
                        height: '100%',
                        width: `${(data.count / maxMonthly) * 100}%`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        padding: '0 12px'
                      }}
                    >
                      {data.count > 0 && (
                        <span style={{
                          color: '#ffffff',
                          fontSize: '16px',
                          fontWeight: 700
                        }}>
                          {data.count}권
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Yearly Chart */}
          {yearlyData.length > 0 && (
            <div style={{
              background: '#ffffff',
              border: '2px solid #000000',
              padding: '16px'
            }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px'
              }}>
                연도별 다운로드
              </h3>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {yearlyData.map((data) => (
                  <div key={data.year} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '120px',
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      {data.year}
                    </div>
                    <div style={{
                      flex: 1,
                      background: '#f0f0f0',
                      border: '1px solid #000000',
                      height: '44px',
                      position: 'relative'
                    }}>
                      <div
                        style={{
                          background: '#000000',
                          height: '100%',
                          width: `${(data.count / maxYearly) * 100}%`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          padding: '0 12px'
                        }}
                      >
                        <span style={{
                          color: '#ffffff',
                          fontSize: '18px',
                          fontWeight: 700
                        }}>
                          {data.count}권
                        </span>
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
