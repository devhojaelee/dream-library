'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Book {
  id: number;
  title: string;
  filename: string;
  size: number;
  addedDate: string;
  cover: string | null;
  coverUpdated?: string | null;
  description: string | null;
  author: string | null;
  year: string | null;
  needsReview: boolean;
}

interface User {
  id: string;
  username: string;
  downloadedBooks: number[];
  downloadHistory?: { bookId: number; downloadedAt: string }[];
}

export default function EinkBookDetail() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    // Load user
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
      })
      .catch(err => console.error('Error loading user:', err));

    // Load book
    fetch('/api/books')
      .then(res => res.json())
      .then(data => {
        const foundBook = data.books.find((b: Book) => b.id === parseInt(params.id as string));
        setBook(foundBook || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading book:', err);
        setLoading(false);
      });
  }, [params.id]);

  const isDownloaded = book && user?.downloadedBooks?.includes(book.id);

  const getDownloadDate = (): string | null => {
    if (!book || !user?.downloadHistory) return null;
    const record = user.downloadHistory.find(d => d.bookId === book.id);
    return record?.downloadedAt || null;
  };

  const downloadDate = getDownloadDate();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Enhanced tracking utilities
  const detectDeviceType = (): string => {
    if (typeof window === 'undefined') return 'desktop';

    const ua = navigator.userAgent.toLowerCase();

    // Check for E-ink devices
    if (ua.includes('kindle') || ua.includes('kobo') || ua.includes('boox') || ua.includes('remarkable')) {
      return 'eink';
    }

    // Check for tablets
    if (ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile'))) {
      return 'tablet';
    }

    // Check for mobile
    if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
      return 'mobile';
    }

    return 'desktop';
  };

  const getOrCreateSessionId = (): string => {
    if (typeof window === 'undefined') return '';

    const SESSION_KEY = 'dream_library_session_id';
    let sessionId = sessionStorage.getItem(SESSION_KEY);

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    return sessionId;
  };

  const handleDownload = () => {
    if (book) {
      // Collect tracking data
      const deviceType = detectDeviceType();
      const uiMode = 'eink'; // This is the E-ink optimized UI
      const sessionId = getOrCreateSessionId();

      // Build URL with tracking params
      const params = new URLSearchParams({
        bookId: book.id.toString(),
        deviceType,
        uiMode,
        sessionId,
      });

      window.location.href = `/api/download/${encodeURIComponent(book.filename)}?${params.toString()}`;

      setTimeout(() => {
        router.refresh();
        window.location.reload();
      }, 1000);
    }
  };

  const toggleDownloadStatus = async () => {
    if (!book || !user) {
      alert('다운로드 기록을 관리하려면 로그인이 필요합니다');
      return;
    }

    try {
      const newStatus = !isDownloaded;

      // Collect tracking data (same as handleDownload)
      const deviceType = detectDeviceType();
      const uiMode = 'eink'; // This is the E-ink UI
      const sessionId = getOrCreateSessionId();

      const res = await fetch('/api/download-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          status: newStatus,
          filename: book.filename,
          deviceType,
          uiMode,
          sessionId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser({
          ...user,
          downloadedBooks: newStatus
            ? [...user.downloadedBooks, book.id]
            : user.downloadedBooks.filter(id => id !== book.id)
        });
      } else {
        alert(`상태 업데이트에 실패했습니다: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Toggle error:', error);
      alert('상태 업데이트에 실패했습니다');
    }
  };

  const toggleReportStatus = async () => {
    if (!book || !user) return;

    try {
      setReporting(true);
      const newStatus = !book.needsReview;

      const res = await fetch('/api/admin/mark-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: book.filename,
          needsReview: newStatus,
        }),
      });

      if (res.ok) {
        setBook({ ...book, needsReview: newStatus });
      }
    } catch (error) {
      console.error('Report error:', error);
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          color: '#000000',
          fontSize: '20px',
          fontWeight: 600
        }}>
          불러오는 중...
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            color: '#000000',
            fontSize: '20px',
            fontWeight: 600,
            marginBottom: '16px'
          }}>
            책을 찾을 수 없습니다
          </div>
          <Link
            href="/eink"
            className="eink-button"
            style={{ textDecoration: 'none' }}
          >
            ← 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="eink-mode" style={{
      minHeight: '100vh',
      background: '#f5f5f5',
      color: '#000000'
    }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #cccccc',
        padding: '20px 16px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <Link
            href="/eink"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#000000',
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: 600,
              padding: '12px 16px',
              border: '1px solid #cccccc',
              borderRadius: '8px',
              background: '#ffffff',
              minHeight: '48px'
            }}
          >
            <span style={{ fontSize: '20px' }}>←</span>
            <span>Dream Library로 돌아가기</span>
          </Link>
        </div>
      </header>

      {/* Book Detail */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px 16px'
      }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid #cccccc',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px'
          }}>
            {/* Book Cover */}
            <div style={{
              width: '100%',
              maxWidth: '350px',
              margin: '0 auto',
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              border: '1px solid #d0d0d0',
              borderRadius: '8px',
              position: 'relative'
            }}>
              {book.cover ? (
                <img
                  src={`/api/covers/${book.cover}${book.coverUpdated ? `?v=${book.coverUpdated}` : ''}`}
                  alt={book.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '500px',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <div style={{ fontSize: '80px' }}>📖</div>
              )}
              {isDownloaded && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: '#000000',
                  color: '#ffffff',
                  padding: '8px 12px',
                  fontSize: '18px',
                  fontWeight: 700,
                  borderRadius: '6px'
                }}>
                  ✓
                </div>
              )}
            </div>

            {/* Book Info */}
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 700,
                marginBottom: '24px',
                wordBreak: 'keep-all',
                lineHeight: 1.3
              }}>
                {book.title}
              </h1>

              {/* Book Metadata */}
              <div style={{
                background: '#f5f5f5',
                border: '1px solid #d0d0d0',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}>
                  {book.author && (
                    <div style={{ fontSize: '18px', lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 700, marginBottom: '4px', color: '#555555' }}>저자</div>
                      <div style={{ fontWeight: 600 }}>{book.author}</div>
                    </div>
                  )}

                  {book.year && (
                    <div style={{ fontSize: '18px', lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 700, marginBottom: '4px', color: '#555555' }}>출판년도</div>
                      <div>{book.year}</div>
                    </div>
                  )}

                  {user && (
                    <>
                      <div style={{ fontSize: '18px', lineHeight: 1.5 }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#555555' }}>파일형식</div>
                        <div style={{
                          display: 'inline-block',
                          background: '#000000',
                          color: '#ffffff',
                          padding: '6px 14px',
                          fontWeight: 700,
                          fontSize: '16px',
                          borderRadius: '4px'
                        }}>
                          EPUB
                        </div>
                      </div>

                      <div style={{ fontSize: '18px', lineHeight: 1.5 }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px', color: '#555555' }}>파일크기</div>
                        <div>{formatFileSize(book.size)}</div>
                      </div>
                    </>
                  )}

                  <div style={{ fontSize: '18px', lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px', color: '#555555' }}>등록일</div>
                    <div>{new Date(book.addedDate).toLocaleDateString('ko-KR')}</div>
                  </div>

                  {user && (
                    <div style={{ fontSize: '16px', lineHeight: 1.5, wordBreak: 'break-all' }}>
                      <div style={{ fontWeight: 700, marginBottom: '4px', color: '#555555' }}>파일명</div>
                      <div>{book.filename}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Download Section */}
              {user && (
                <div style={{
                  background: '#f5f5f5',
                  border: '1px solid #d0d0d0',
                  borderRadius: '8px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    marginBottom: '20px',
                    letterSpacing: '0.05em'
                  }}>
                    다운로드
                  </h3>

                  {/* Downloaded Status Badge */}
                  {isDownloaded && (
                    <div style={{
                      marginBottom: '16px',
                      padding: '20px',
                      border: '1px solid #d0d0d0',
                      borderRadius: '8px',
                      background: '#f5f5f5'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ fontSize: '24px' }}>✓</span>
                        <span>다운로드 완료</span>
                      </div>
                      {downloadDate && (
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#333333',
                          marginLeft: '34px'
                        }}>
                          {new Date(downloadDate).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    {/* Main Download Button */}
                    <button
                      onClick={handleDownload}
                      style={{
                        width: '100%',
                        background: '#000000',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '18px 24px',
                        fontSize: '20px',
                        fontWeight: 700,
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '24px' }}>⬇</span>
                      <span>EPUB 다운로드</span>
                    </button>

                    {/* Toggle Download Status Button */}
                    <button
                      onClick={toggleDownloadStatus}
                      style={{
                        width: '100%',
                        background: isDownloaded ? '#e8e8e8' : '#ffffff',
                        color: '#000000',
                        border: '1px solid #cccccc',
                        borderRadius: '8px',
                        padding: '16px 24px',
                        fontSize: '18px',
                        fontWeight: 600,
                        minHeight: '56px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>
                        {isDownloaded ? '✓' : '☐'}
                      </span>
                      <span>
                        {isDownloaded ? '다운로드 완료 표시 해제' : '다운로드 완료로 표시'}
                      </span>
                    </button>

                    {/* Info Text */}
                    <p style={{
                      fontSize: '14px',
                      color: '#555555',
                      textAlign: 'center',
                      marginTop: '8px',
                      lineHeight: 1.5
                    }}>
                      다운로드 완료 표시는 읽은 책을 관리하는 데 도움이 됩니다
                    </p>
                  </div>
                </div>
              )}

              {/* Report Section */}
              {user && (
                <div style={{
                  background: '#f5f5f5',
                  border: '1px solid #d0d0d0',
                  borderRadius: '8px',
                  padding: '24px',
                  marginBottom: '24px'
                }}>
                  {book.needsReview && (
                    <div style={{
                      marginBottom: '20px',
                      padding: '20px',
                      border: '1px solid #cccccc',
                      borderRadius: '8px',
                      background: '#f0f0f0'
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#000000',
                        lineHeight: 1.5
                      }}>
                        이 책의 정보에 오류가 있다고 신고되었습니다. 관리자가 확인 중입니다.
                      </div>
                    </div>
                  )}
                  <button
                    onClick={toggleReportStatus}
                    disabled={reporting}
                    style={{
                      width: '100%',
                      background: book.needsReview ? '#e8e8e8' : '#ffffff',
                      color: '#000000',
                      border: '1px solid #cccccc',
                      borderRadius: '8px',
                      padding: '16px 24px',
                      fontSize: '18px',
                      fontWeight: 600,
                      minHeight: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      cursor: reporting ? 'not-allowed' : 'pointer',
                      opacity: reporting ? 0.6 : 1
                    }}
                  >
                    <span>
                      {reporting ? '처리 중...' : book.needsReview ? '검토 요청됨 (취소)' : '🚨 정보 오류 신고'}
                    </span>
                  </button>
                </div>
              )}

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  marginBottom: '16px'
                }}>
                  책 소개
                </h2>
                <div style={{
                  fontSize: '18px',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'keep-all'
                }}>
                  {book.description || '아직 등록된 책 소개가 없습니다.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
