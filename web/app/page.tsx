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

interface ShootingStar {
  id: number;
  x: number;
  y: number;
}

export default function Home() {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [hideDownloaded, setHideDownloaded] = useState(false);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [encouragementMsg, setEncouragementMsg] = useState('');
  const [downloadStatus, setDownloadStatus] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [booksPerPage, setBooksPerPage] = useState(() => {
    // Calculate initial books per page before first render
    if (typeof window === 'undefined') return 20;

    const width = window.innerWidth;
    const height = window.innerHeight;
    let columns = 2;

    if (width >= 1280) columns = 5;
    else if (width >= 1024) columns = 4;
    else if (width >= 768) columns = 3;
    else if (width >= 360) columns = 3;
    else columns = 2;

    // Calculate rows based on viewport height
    // Approximate: 320px per book card (280px card + 40px gap)
    const headerHeight = 250; // header + banner + search + title
    const availableHeight = height - headerHeight;
    const estimatedRows = Math.max(Math.floor(availableHeight / 320), 4);

    let booksToShow = columns * estimatedRows;

    // Ensure minimum books based on screen size
    if (width >= 1024) {
      booksToShow = Math.max(booksToShow, 20);
    } else {
      booksToShow = Math.max(booksToShow, 10);
    }

    return booksToShow;
  });
  const [autoLoadEnabled, setAutoLoadEnabled] = useState(true);
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

  // Calculate columns and adjust books per page to fill grid perfectly
  const calculateBooksPerPage = useCallback(() => {
    if (typeof window === 'undefined') return 20;

    const width = window.innerWidth;
    const height = window.innerHeight;
    let columns = 2;

    if (width >= 1280) columns = 5;
    else if (width >= 1024) columns = 4;
    else if (width >= 768) columns = 3;
    else if (width >= 360) columns = 3;
    else columns = 2;

    // Calculate rows based on viewport height
    const headerHeight = 250;
    const availableHeight = height - headerHeight;
    const estimatedRows = Math.max(Math.floor(availableHeight / 320), 4);

    let booksToShow = columns * estimatedRows;

    // Ensure minimum books based on screen size
    if (width >= 1024) {
      booksToShow = Math.max(booksToShow, 20);
    } else {
      booksToShow = Math.max(booksToShow, 10);
    }

    setBooksPerPage(booksToShow);
    return booksToShow;
  }, []);

  useEffect(() => {
    // Calculate initial books per page based on viewport
    calculateBooksPerPage();

    // Recalculate on window resize
    const handleResize = () => {
      calculateBooksPerPage();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateBooksPerPage]);

  useEffect(() => {
    // Load download status
    const fetchDownloadStatus = async () => {
      try {
        const response = await fetch('/api/download-status');
        const data = await response.json();

        if (data.status === 'waiting' && data.waitUntil) {
          const updateCountdown = () => {
            const now = new Date().getTime();
            const waitUntil = new Date(data.waitUntil).getTime();
            const remaining = waitUntil - now;

            if (remaining <= 0) {
              setDownloadStatus(null);
              return;
            }

            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

            setDownloadStatus({ hours, minutes, seconds });
          };

          updateCountdown();
          const interval = setInterval(updateCountdown, 1000);
          return () => clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to fetch download status:', error);
      }
    };

    fetchDownloadStatus();

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

    // Load books
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

  // Fill incomplete last row based on screen columns
  useEffect(() => {
    if (!autoLoadEnabled || displayedBooks.length === 0) return;

    const fillLastRow = () => {
      // Calculate columns based on current screen size
      const width = window.innerWidth;
      let columns = 2;

      if (width >= 1280) columns = 5;
      else if (width >= 1024) columns = 4;
      else if (width >= 768) columns = 3;
      else if (width >= 360) columns = 3;
      else columns = 2;

      const remainder = displayedBooks.length % columns;
      const filteredBooks = getFilteredBooks();
      const hasMore = displayedBooks.length < filteredBooks.length;

      // If last row is incomplete (remainder > 0) and more books available
      if (remainder > 0 && hasMore) {
        const booksToAdd = columns - remainder; // Fill only the incomplete row
        const newCount = Math.min(displayedBooks.length + booksToAdd, filteredBooks.length);
        const nextBatch = filteredBooks.slice(0, newCount);
        setDisplayedBooks(nextBatch);
      } else {
        // Stop auto-loading once row is complete or no more books
        setAutoLoadEnabled(false);
      }
    };

    // Small delay to ensure DOM is updated
    const timer = setTimeout(fillLastRow, 100);
    return () => clearTimeout(timer);
  }, [displayedBooks, autoLoadEnabled]);

  // Filter books based on hideDownloaded, showRecentOnly and search query
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

    // Apply downloaded filter
    if (hideDownloaded && user) {
      filteredBooks = filteredBooks.filter(book => !user.downloadedBooks.includes(book.id));
    }

    // Apply recent books filter (last 7 days)
    if (showRecentOnly) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      filteredBooks = filteredBooks.filter(book => {
        if (!book.addedDate) return false;
        const addedDate = new Date(book.addedDate);
        return addedDate > sevenDaysAgo;
      });
    }

    setDisplayedBooks(filteredBooks.slice(0, booksPerPage));
    setPage(1);
    setAutoLoadEnabled(true); // Re-enable auto-load when filters change
  }, [hideDownloaded, showRecentOnly, allBooks, user, searchQuery, booksPerPage]);

  // Create shooting stars dynamically based on viewport
  const createShootingStar = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const x = Math.random() * (viewportWidth - 200); // 200px space for animation
    const y = Math.random() * (viewportHeight - 200);

    const newStar: ShootingStar = {
      id: Date.now() + Math.random(),
      x,
      y,
    };

    setShootingStars(prev => [...prev, newStar]);

    // Remove star after animation completes (2.5s)
    setTimeout(() => {
      setShootingStars(prev => prev.filter(star => star.id !== newStar.id));
    }, 2500);
  }, []);

  // Generate shooting stars periodically
  useEffect(() => {
    // Create initial stars slowly
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        createShootingStar();
      }, i * 800); // Slower stagger for initial stars
    }

    // Keep creating new stars
    const interval = setInterval(() => {
      createShootingStar();
    }, 1500); // Create new star every 1.5 seconds

    return () => clearInterval(interval);
  }, [createShootingStar]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Force full page reload to clear all state
    window.location.reload();
  };

  const isDownloaded = (bookId: number) => {
    return user?.downloadedBooks?.includes(bookId) || false;
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const startIndex = nextPage * booksPerPage;
    const endIndex = startIndex + booksPerPage;

    const filteredBooks = getFilteredBooks();
    const newBooks = filteredBooks.slice(0, endIndex);
    setDisplayedBooks(newBooks);
    setPage(nextPage);
    setAutoLoadEnabled(true); // Re-enable auto-load for new page
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

    // Apply downloaded filter
    if (hideDownloaded && user) {
      filteredBooks = filteredBooks.filter(book => !user.downloadedBooks.includes(book.id));
    }

    // Apply recent books filter (last 7 days)
    if (showRecentOnly) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      filteredBooks = filteredBooks.filter(book => {
        if (!book.addedDate) return false;
        const addedDate = new Date(book.addedDate);
        return addedDate > sevenDaysAgo;
      });
    }

    return filteredBooks;
  };

  const hasMore = displayedBooks.length < getFilteredBooks().length;

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
      <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
        <div className="text-gray-800 text-xl font-medium relative z-10">책을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Dynamic Shooting Stars */}
      {shootingStars.map(star => (
        <div
          key={star.id}
          className="shooting-star text-yellow-400/80"
          style={{ left: `${star.x}px`, top: `${star.y}px` }}
        >
          ⭐
        </div>
      ))}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-300 shadow-sm relative z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          {/* Mobile: Stack layout, Desktop: Horizontal layout */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
            <div
              onClick={() => window.location.href = '/'}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">✨ Dream Library</h1>
              <p className="text-xs md:text-sm text-gray-600 font-medium mt-1 tracking-wider ml-6 md:ml-9">STANDARD MODE</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4 justify-end">
              <Link
                href="/eink"
                className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-lg transition-colors shadow-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
                title="E-ink 리더기 최적화 모드"
              >
                📖 E-Reader
              </Link>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-lg transition-colors border border-gray-300 shadow-sm min-h-[44px]"
                  >
                    <span className="font-semibold">👤 마이페이지</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-[60]"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[70]">
                        <div className="px-4 py-2 text-sm font-semibold text-gray-900 border-b border-gray-200">
                          {user.username} 님
                        </div>
                        <Link
                          href="/mypage"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px] flex items-center"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          마이페이지
                        </Link>
                        {user.role === 'admin' && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-blue-700 hover:bg-gray-100 transition-colors font-medium min-h-[44px] flex items-center"
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
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors min-h-[44px] flex items-center"
                        >
                          로그아웃
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-lg transition-colors shadow-sm whitespace-nowrap min-h-[44px] flex items-center justify-center"
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Encouragement Banner */}
        {user && (encouragementMsg || downloadStatus) && (
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 border-t border-gray-200 py-2">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {encouragementMsg && (
                  <span className="text-sm font-medium text-gray-700 text-center md:text-left">
                    이번 달 <span className="font-semibold text-purple-600">{getThisMonthDownloads()}권</span> 다운로드
                  </span>
                )}
                {downloadStatus && (
                  <>
                    {encouragementMsg && <span className="text-gray-400 mx-1">|</span>}
                    <span className="text-sm font-medium text-gray-700 text-center md:text-left">
                      <span className="font-semibold text-purple-600">
                        {downloadStatus.hours > 0
                          ? `${downloadStatus.hours}시간`
                          : `${downloadStatus.minutes}분`
                        }
                      </span>
                      {' '}후 신작 10권 입고
                    </span>
                  </>
                )}
              </div>
              {encouragementMsg && (
                <div className="flex items-center gap-2 text-center md:text-left">
                  <span className="text-base">🎉</span>
                  <span className="text-sm font-medium text-gray-700">
                    {encouragementMsg}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="책 제목, 저자, 파일명으로 검색..."
              className="w-full px-4 py-3 pr-10 text-gray-900 bg-white/90 backdrop-blur-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              &quot;{searchQuery}&quot; 검색 결과: {getFilteredBooks().length}권
            </p>
          )}
        </div>

        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              전체 도서 ({getFilteredBooks().length}권)
            </h2>
            <p className="text-gray-700">
              총 {getFilteredBooks().length}권 중 {displayedBooks.length}권 표시
            </p>
          </div>

          {/* Filter Toggles - Mobile: 2-column grid, Desktop: Horizontal */}
          <div className="grid grid-cols-2 md:flex gap-2 md:gap-3 md:justify-end">
            <button
              onClick={() => setShowRecentOnly(!showRecentOnly)}
              className={`flex items-center justify-center gap-1.5 px-3 py-3 md:px-4 md:py-2 rounded-lg font-medium transition-colors border min-h-[48px] text-sm md:text-base ${
                showRecentOnly
                  ? 'bg-purple-500 text-white hover:bg-purple-600 border-purple-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              <span>{showRecentOnly ? '✅' : '☐'}</span>
              <span className="whitespace-nowrap">최근 일주일 신작</span>
            </button>

            {user && user.downloadedBooks.length > 0 && (
              <button
                onClick={() => setHideDownloaded(!hideDownloaded)}
                className={`flex items-center justify-center gap-1.5 px-3 py-3 md:px-4 md:py-2 rounded-lg font-medium transition-colors border min-h-[48px] text-sm md:text-base ${
                  hideDownloaded
                    ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                <span>{hideDownloaded ? '✅' : '☐'}</span>
                <span className="whitespace-nowrap">다운로드한 도서 제외</span>
              </button>
            )}
          </div>
        </div>

        {allBooks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-500 text-lg">
              등록된 책이 없습니다. /books 폴더에 .epub 파일을 추가해주세요!
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {displayedBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/book/${book.id}`}
                  className="group"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 border border-purple-200/50 hover:border-purple-300 hover:bg-white">
                    {/* Book Cover */}
                    <div className="aspect-[2/3] bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 flex items-center justify-center relative overflow-hidden">
                      {book.cover ? (
                        <img
                          src={`/api/covers/${book.cover}${book.coverUpdated ? `?v=${book.coverUpdated}` : ''}`}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-6xl text-gray-400">📖</div>
                      )}
                      {/* Downloaded Overlay */}
                      {isDownloaded(book.id) && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-green-500 text-white rounded-full px-2.5 py-1 shadow-lg flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-semibold">다운로드 완료</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="p-4 bg-white">
                      <h3 className="text-gray-900 font-semibold text-sm mb-1 group-hover:text-blue-700 transition-colors break-words line-clamp-2">
                        {book.title}
                      </h3>
                      {book.author && (
                        <p className="text-gray-600 text-xs mb-2 line-clamp-1">{book.author}</p>
                      )}
                      {user && (
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">EPUB</span>
                          <span className="font-medium">{formatFileSize(book.size)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={loadMore}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  더 보기
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
        </div>
      </footer>
    </div>
  );
}
