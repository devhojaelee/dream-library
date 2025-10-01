'use client';

import { useEffect, useState } from 'react';
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

export default function EinkHome() {
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [hideDownloaded, setHideDownloaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const BOOKS_PER_PAGE = 10;

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

    // Load books - shuffle once on mount
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

  // Filter books based on hideDownloaded and search query
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

    setDisplayedBooks(filteredBooks.slice(0, BOOKS_PER_PAGE));
    setPage(1);
  }, [hideDownloaded, allBooks, user, searchQuery]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.refresh();
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

    // Apply downloaded filter
    if (hideDownloaded && user) {
      filteredBooks = filteredBooks.filter(book => !user.downloadedBooks.includes(book.id));
    }

    return filteredBooks;
  };

  const loadNextPage = () => {
    const nextPage = page + 1;
    const startIndex = nextPage * BOOKS_PER_PAGE;
    const endIndex = startIndex + BOOKS_PER_PAGE;

    const filteredBooks = getFilteredBooks();
    const newBooks = filteredBooks.slice(startIndex, endIndex);
    setDisplayedBooks(newBooks);
    setPage(nextPage);
  };

  const loadPrevPage = () => {
    if (page <= 1) return;

    const prevPage = page - 1;
    const startIndex = (prevPage - 1) * BOOKS_PER_PAGE;
    const endIndex = startIndex + BOOKS_PER_PAGE;

    const filteredBooks = getFilteredBooks();
    const newBooks = filteredBooks.slice(startIndex, endIndex);
    setDisplayedBooks(newBooks);
    setPage(prevPage);
  };

  const hasMore = page * BOOKS_PER_PAGE < getFilteredBooks().length;
  const hasPrev = page > 1;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
      <header style={{
        background: '#ffffff',
        borderBottom: '2px solid #000000',
        padding: '16px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div
              onClick={() => window.location.href = '/eink'}
              style={{
                cursor: 'pointer'
              }}
            >
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                margin: 0,
                color: '#000000'
              }}>
                Dream Library (E-Reader)
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/"
                className="eink-button"
                style={{ textDecoration: 'none' }}
              >
                일반 모드
              </Link>

              {user ? (
                <>
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>
                    {user.username}님
                  </span>
                  <button
                    onClick={handleLogout}
                    className="eink-button"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <Link
                  href="/auth"
                  className="eink-button-primary"
                  style={{ textDecoration: 'none' }}
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '16px'
      }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="책 제목, 저자, 파일명으로 검색..."
              style={{
                width: '100%',
                padding: '12px',
                paddingRight: '40px',
                fontSize: '18px',
                border: '2px solid #000000',
                background: '#ffffff',
                color: '#000000'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <p style={{
              marginTop: '8px',
              fontSize: '16px',
              color: '#000000'
            }}>
              &quot;{searchQuery}&quot; 검색 결과: {getFilteredBooks().length}권
            </p>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '8px'
          }}>
            전체 도서 ({getFilteredBooks().length}권)
          </h2>
          <p style={{
            fontSize: '18px',
            marginBottom: '12px'
          }}>
            {page}페이지 / 총 {Math.ceil(getFilteredBooks().length / BOOKS_PER_PAGE)}페이지
          </p>

          {/* Filter Toggle */}
          {user && user.downloadedBooks.length > 0 && (
            <button
              onClick={() => setHideDownloaded(!hideDownloaded)}
              className={hideDownloaded ? 'eink-button-primary' : 'eink-button'}
              style={{ marginTop: '8px' }}
            >
              {hideDownloaded ? '☑' : '☐'} 소장 도서 제외
            </button>
          )}
        </div>

        {allBooks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <div style={{
              fontSize: '18px',
              color: '#000000'
            }}>
              등록된 책이 없습니다.
            </div>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {displayedBooks.map((book) => (
                <Link
                  key={book.id}
                  href={`/eink/book/${book.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: '#ffffff',
                    border: '2px solid #000000',
                    padding: '12px'
                  }}>
                    {/* Book Cover */}
                    <div style={{
                      aspectRatio: '2/3',
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      border: '1px solid #000000'
                    }}>
                      {book.cover ? (
                        <img
                          src={`/api/covers/${book.cover}`}
                          alt={book.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: '48px' }}>📖</div>
                      )}
                      {/* Downloaded Badge */}
                      {isDownloaded(book.id) && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: '#000000',
                          color: '#ffffff',
                          padding: '4px 8px',
                          fontSize: '14px',
                          fontWeight: 700
                        }}>
                          ✓
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      color: '#000000'
                    }}>
                      {book.title}
                    </h3>
                    {book.author && (
                      <p style={{
                        fontSize: '14px',
                        marginBottom: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#000000'
                      }}>
                        {book.author}
                      </p>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '14px'
                    }}>
                      <span className="eink-badge">EPUB</span>
                      <span style={{ fontWeight: 600 }}>{formatFileSize(book.size)}</span>
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
              marginTop: '24px'
            }}>
              {hasPrev && (
                <button
                  onClick={loadPrevPage}
                  className="eink-button"
                >
                  ← 이전 페이지
                </button>
              )}

              {hasMore && (
                <button
                  onClick={loadNextPage}
                  className="eink-button"
                >
                  다음 페이지 →
                </button>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        background: '#ffffff',
        borderTop: '2px solid #000000',
        marginTop: '40px',
        padding: '16px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          E-ink 디스플레이 최적화 버전
        </div>
      </footer>
    </div>
  );
}
