'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import encouragementsData from '@/data/encouragements.json';

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
  downloadedAt?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  downloadedBooks: number[];
  downloadHistory?: { bookId: number; downloadedAt: string }[];
}

export default function EinkHome() {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [hideDownloaded, setHideDownloaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [encouragementMsg, setEncouragementMsg] = useState('');
  const [downloadStatus, setDownloadStatus] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [booksPerPage, setBooksPerPage] = useState(10);
  const router = useRouter();

  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Calculate columns and adjust books per page for E-ink (simpler grid)
  const calculateBooksPerPage = useCallback(() => {
    if (typeof window === 'undefined') return 10;

    const width = window.innerWidth;
    let columns = 2; // default

    if (width >= 1024) columns = 5; // large screens
    else if (width >= 768) columns = 4; // tablets
    else if (width >= 480) columns = 3; // larger phones
    else columns = 2; // small phones

    const rows = 3; // Show ~3 rows for E-ink (less scrolling)
    const booksToShow = columns * rows;

    setBooksPerPage(booksToShow);
    return booksToShow;
  }, []);

  useEffect(() => {
    // Calculate initial books per page based on viewport
    calculateBooksPerPage();

    // Recalculate on window resize (for E-ink devices with rotation)
    const handleResize = () => {
      calculateBooksPerPage();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateBooksPerPage]);

  useEffect(() => {
    // Load download status (E-ink: no real-time countdown, only initial value)
    fetch('/api/download-status')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'waiting' && data.waitUntil) {
          const now = new Date().getTime();
          const waitUntil = new Date(data.waitUntil).getTime();
          const remaining = waitUntil - now;

          if (remaining > 0) {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

            setDownloadStatus({ hours, minutes, seconds });
          }
        }
      })
      .catch(err => console.error('Failed to fetch download status:', err));

    // Load user data
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);

          // 이번 달 다운로드 수 계산
          const now = new Date();
          const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const monthlyCount = (data.user.downloadHistory || []).filter((download: { downloadedAt: string }) => {
            const date = new Date(download.downloadedAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return monthKey === thisMonth;
          }).length;

          // 격려 메시지 한 번만 설정
          const tier = encouragementsData.tiers.find(t => monthlyCount >= t.min && monthlyCount <= t.max);
          if (tier && tier.messages.length > 0) {
            const randomIndex = Math.floor(Math.random() * tier.messages.length);
            const message = tier.messages[randomIndex].replace('{count}', String(monthlyCount));
            setEncouragementMsg(message);
          }
        }
      })
      .catch(err => console.error('Error loading user:', err));

    // Load books - shuffle once on mount
    fetch('/api/books')
      .then(res => res.json())
      .then((data: { books: Book[] }) => {
        const shuffled = shuffleArray(data.books || []);
        setAllBooks(shuffled);
        setDisplayedBooks(shuffled.slice(0, booksPerPage));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading books:', err);
        setLoading(false);
      });
  }, []);

  // Filter books based on hideDownloaded, search query, and showRecentOnly
  useEffect(() => {
    let filteredBooks = allBooks;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredBooks = filteredBooks.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.filename.toLowerCase().includes(query)
      );
    }

    // Apply recent-only filter (last 7 days)
    if (showRecentOnly) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      filteredBooks = filteredBooks.filter(book => {
        if (!book.downloadedAt) return false;
        const downloadedDate = new Date(book.downloadedAt);
        return downloadedDate > sevenDaysAgo;
      });
    }

    // Apply downloaded filter
    if (hideDownloaded && user) {
      filteredBooks = filteredBooks.filter(book => !user.downloadedBooks.includes(book.id));
    }

    setDisplayedBooks(filteredBooks.slice(0, booksPerPage));
    setPage(1);
  }, [hideDownloaded, allBooks, user, searchQuery, showRecentOnly, booksPerPage]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Force full page reload to clear all state
    window.location.reload();
  };

  const isDownloaded = (bookId: number) => {
    return user?.downloadedBooks?.includes(bookId) || false;
  };

  const getFilteredBooks = () => {
    let filteredBooks = allBooks;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredBooks = filteredBooks.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.filename.toLowerCase().includes(query)
      );
    }

    // Apply recent-only filter (last 7 days)
    if (showRecentOnly) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      filteredBooks = filteredBooks.filter(book => {
        if (!book.downloadedAt) return false;
        const downloadedDate = new Date(book.downloadedAt);
        return downloadedDate > sevenDaysAgo;
      });
    }

    // Apply downloaded filter
    if (hideDownloaded && user) {
      filteredBooks = filteredBooks.filter(book => !user.downloadedBooks.includes(book.id));
    }

    return filteredBooks;
  };

  const loadNextPage = () => {
    const nextPage = page + 1;
    const startIndex = (nextPage - 1) * booksPerPage;
    const endIndex = startIndex + booksPerPage;

    const filteredBooks = getFilteredBooks();
    const newBooks = filteredBooks.slice(startIndex, endIndex);
    setDisplayedBooks(newBooks);
    setPage(nextPage);
    window.scrollTo(0, 0);
  };

  const loadPrevPage = () => {
    if (page <= 1) return;

    const prevPage = page - 1;
    const startIndex = (prevPage - 1) * booksPerPage;
    const endIndex = startIndex + booksPerPage;

    const filteredBooks = getFilteredBooks();
    const newBooks = filteredBooks.slice(startIndex, endIndex);
    setDisplayedBooks(newBooks);
    setPage(prevPage);
    window.scrollTo(0, 0);
  };

  const hasMore = page * booksPerPage < getFilteredBooks().length;
  const hasPrev = page > 1;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // 이번 달 다운로드 수 계산
  const getThisMonthDownloads = (): number => {
    if (!user?.downloadHistory) return 0;

    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return user.downloadHistory.filter(download => {
      const date = new Date(download.downloadedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === thisMonth;
    }).length;
  };

  if (loading) {
    return (
      <div className="eink-mode" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: 600,
          letterSpacing: '0.3px'
        }}>
          책을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="eink-mode" style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: '#000000'
    }}>
      {/* Header */}
      <header className="eink-header">
        <div style={{ padding: '20px 16px' }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Mobile: Stack layout, Desktop: Horizontal layout */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
            className="md:flex-row md:justify-between md:items-center">
              <div
                onClick={() => window.location.href = '/eink'}
                style={{ cursor: 'pointer' }}
              >
                <h1 style={{ margin: 0 }}>
                  Dream Library
                </h1>
                <p style={{
                  fontSize: '14px',
                  margin: '4px 0 0 0',
                  color: '#666666',
                  fontWeight: 500,
                  letterSpacing: '0.5px'
                }}>
                  E-READER MODE
                </p>
              </div>

              <div className="eink-header-buttons" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Link
                  href="/"
                  className="eink-button"
                  style={{ textDecoration: 'none' }}
                >
                  일반 모드
                </Link>

                {user ? (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="eink-button"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>👤 마이페이지</span>
                      <span>▼</span>
                    </button>

                    {isUserMenuOpen && (
                      <>
                        <div
                          style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 60,
                          }}
                          onClick={() => setIsUserMenuOpen(false)}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            marginTop: '8px',
                            minWidth: '220px',
                            backgroundColor: 'white',
                            border: '1px solid #cccccc',
                            borderRadius: '8px',
                            zIndex: 70,
                            overflow: 'hidden'
                          }}
                        >
                          <div style={{
                            padding: '16px',
                            fontWeight: 600,
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '15px',
                            letterSpacing: '0.2px'
                          }}>
                            {user.username} 님
                          </div>
                          <Link
                            href="/eink/mypage"
                            className="eink-menu-item"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            마이페이지
                          </Link>
                          {user.role === 'admin' && (
                            <Link
                              href="/admin"
                              className="eink-menu-item"
                              style={{ fontWeight: 600 }}
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              🔧 관리자 페이지
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              handleLogout();
                            }}
                            className="eink-menu-item"
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontSize: '16px'
                            }}
                          >
                            로그아웃
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/eink/auth"
                    className="eink-button-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    로그인
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Encouragement Banner */}
        {user && (encouragementMsg || downloadStatus) && (
          <div className="eink-banner">
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '15px',
              fontWeight: 500,
              letterSpacing: '0.2px',
              textAlign: 'center'
            }}
            className="md:flex-row md:gap-[10px]">
              {encouragementMsg && (
                <span>이번 달 {getThisMonthDownloads()}권 다운로드</span>
              )}
              {encouragementMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎉</span>
                  <span>{encouragementMsg}</span>
                </div>
              )}
              {downloadStatus && (
                <>
                  {encouragementMsg && <span style={{ margin: '0 6px', opacity: 0.5 }}>|</span>}
                  <span>
                    {downloadStatus.hours > 0
                      ? `${downloadStatus.hours}시간`
                      : `${downloadStatus.minutes}분`
                    } 후 신작 10권 입고
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px 16px'
      }}>

        {/* Search Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="책 제목, 저자, 파일명으로 검색..."
              className="eink-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '8px',
                  minHeight: '36px',
                  minWidth: '36px',
                  fontWeight: 600
                }}
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <p style={{
              marginTop: '10px',
              fontSize: '15px',
              color: '#666666',
              letterSpacing: '0.2px'
            }}>
              &quot;{searchQuery}&quot; 검색 결과: {getFilteredBooks().length}권
            </p>
          )}
        </div>

        <div style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h2 style={{ marginBottom: '6px' }}>
              전체 도서 ({getFilteredBooks().length}권)
            </h2>
            <p style={{
              fontSize: '15px',
              color: '#666666',
              margin: 0,
              letterSpacing: '0.2px'
            }}>
              {page}페이지 / 총 {Math.ceil(getFilteredBooks().length / booksPerPage)}페이지
            </p>
          </div>

          {/* Filter Toggles */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowRecentOnly(!showRecentOnly)}
              className={showRecentOnly ? 'eink-button-primary' : 'eink-button'}
            >
              {showRecentOnly ? '✓' : '○'} 최근 일주일 신작
            </button>
            {user && user.downloadedBooks.length > 0 && (
              <button
                onClick={() => setHideDownloaded(!hideDownloaded)}
                className={hideDownloaded ? 'eink-button-primary' : 'eink-button'}
              >
                {hideDownloaded ? '✓' : '○'} 다운로드 완료 제외
              </button>
            )}
          </div>
        </div>

        {allBooks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px'
          }}>
            <div style={{
              fontSize: '16px',
              color: '#666666',
              letterSpacing: '0.2px'
            }}>
              등록된 책이 없습니다.
            </div>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              {displayedBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/eink/book/${book.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="eink-card">
                    {/* Book Cover */}
                    <div style={{
                      aspectRatio: '2/3',
                      background: '#f8f8f8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      borderBottom: '1px solid #e0e0e0'
                    }}>
                      {book.cover ? (
                        <img
                          src={`/api/covers/${book.cover}${book.coverUpdated ? `?v=${book.coverUpdated}` : ''}`}
                          alt={book.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: '40px', opacity: 0.3 }}>📖</div>
                      )}
                      {/* Downloaded Badge */}
                      {isDownloaded(book.id) && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: '#000000',
                          color: '#ffffff',
                          padding: '6px 10px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: '4px',
                          letterSpacing: '0.2px'
                        }}>
                          ✓ 다운로드 완료
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="eink-card-content">
                      <h3 style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        color: '#000000',
                        lineHeight: '1.4',
                        letterSpacing: '-0.2px',
                        minHeight: '42px'
                      }}>
                        {book.title}
                      </h3>
                      {book.author && (
                        <p style={{
                          fontSize: '13px',
                          marginBottom: '8px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: '#666666',
                          letterSpacing: '0.1px'
                        }}>
                          {book.author}
                        </p>
                      )}
                      {user && (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px',
                          marginTop: '10px',
                          paddingTop: '10px',
                          borderTop: '1px solid #f0f0f0'
                        }}>
                          <span className="eink-badge">EPUB</span>
                          <span style={{
                            fontWeight: 600,
                            color: '#333333',
                            letterSpacing: '0.2px'
                          }}>
                            {formatFileSize(book.size)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '32px'
            }}>
              {hasPrev && (
                <button
                  onClick={loadPrevPage}
                  className="eink-button"
                >
                  ← 이전
                </button>
              )}

              {hasMore && (
                <button
                  onClick={loadNextPage}
                  className="eink-button"
                >
                  다음 →
                </button>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: '#ffffff',
        borderTop: '1px solid #e0e0e0',
        marginTop: '60px',
        padding: '24px 16px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
          fontSize: '13px',
          color: '#999999',
          letterSpacing: '0.3px'
        }}>
          E-READER OPTIMIZED VERSION
        </div>
      </footer>
    </div>
  );
}
