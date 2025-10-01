'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Book {
  id: number;
  title: string;
  filename: string;
  size: number;
  addedDate: string;
  cover: string | null;
  description: string | null;
  author: string | null;
  year: string | null;
}

interface User {
  id: string;
  username: string;
  downloadedBooks: number[];
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
  const router = useRouter();
  const BOOKS_PER_PAGE = 20;

  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    // Load user data
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
      })
      .catch(err => console.error('Error loading user:', err));

    // Load books
    fetch('/api/books')
      .then(res => res.json())
      .then((data: { books: Book[] }) => {
        const shuffled = shuffleArray(data.books || []);
        setAllBooks(shuffled);
        setDisplayedBooks(shuffled.slice(0, BOOKS_PER_PAGE));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading books:', err);
        setLoading(false);
      });
  }, []);

  // Filter books based on hideDownloaded
  useEffect(() => {
    let filteredBooks = allBooks;

    if (hideDownloaded && user) {
      filteredBooks = allBooks.filter(book => !user.downloadedBooks.includes(book.id));
    }

    setDisplayedBooks(filteredBooks.slice(0, BOOKS_PER_PAGE));
    setPage(1);
  }, [hideDownloaded, allBooks, user]);

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
    setUser(null);
    router.refresh();
  };

  const isDownloaded = (bookId: number) => {
    return user?.downloadedBooks?.includes(bookId) || false;
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const startIndex = nextPage * BOOKS_PER_PAGE;
    const endIndex = startIndex + BOOKS_PER_PAGE;

    let filteredBooks = allBooks;
    if (hideDownloaded && user) {
      filteredBooks = allBooks.filter(book => !user.downloadedBooks.includes(book.id));
    }

    const newBooks = filteredBooks.slice(0, endIndex);
    setDisplayedBooks(newBooks);
    setPage(nextPage);
  };

  const getFilteredBooks = () => {
    if (hideDownloaded && user) {
      return allBooks.filter(book => !user.downloadedBooks.includes(book.id));
    }
    return allBooks;
  };

  const hasMore = displayedBooks.length < getFilteredBooks().length;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-300 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">✨ Dream Library</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/eink"
              className="bg-gray-800 hover:bg-gray-900 text-white px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg transition-colors shadow-sm whitespace-nowrap"
              title="E-ink 리더기 최적화 모드"
            >
              📖 E-Reader
            </Link>
            {user ? (
              <>
                <span className="text-sm md:text-base text-gray-700 hidden sm:inline">
                  <span className="text-gray-900 font-semibold">{user.username}</span>님 환영합니다
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg transition-colors border border-gray-400"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg transition-colors shadow-sm whitespace-nowrap"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              전체 도서 ({getFilteredBooks().length}권)
            </h2>
            <p className="text-gray-700">
              총 {getFilteredBooks().length}권 중 {displayedBooks.length}권 표시
            </p>
          </div>

          {/* Filter Toggle */}
          {user && user.downloadedBooks.length > 0 && (
            <button
              onClick={() => setHideDownloaded(!hideDownloaded)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors border ${
                hideDownloaded
                  ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              <span>{hideDownloaded ? '✅' : '☐'}</span>
              <span>소장 도서 제외</span>
            </button>
          )}
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
                          src={`/api/covers/${book.cover}`}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-6xl text-gray-400">📖</div>
                      )}
                      {/* Downloaded Overlay */}
                      {isDownloaded(book.id) && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
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
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">EPUB</span>
                        <span className="font-medium">{formatFileSize(book.size)}</span>
                      </div>
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
