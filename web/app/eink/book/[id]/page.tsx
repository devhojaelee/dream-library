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
  description: string | null;
  author: string | null;
  year: string | null;
}

interface User {
  id: string;
  username: string;
  downloadedBooks: number[];
}

export default function EinkBookDetail() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (book) {
      window.location.href = `/api/download/${encodeURIComponent(book.filename)}?bookId=${book.id}`;
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
      const res = await fetch('/api/download-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, status: newStatus }),
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
    <div style={{
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
          margin: '0 auto'
        }}>
          <Link
            href="/eink"
            className="eink-button"
            style={{ textDecoration: 'none' }}
          >
            ← Dream Library로 돌아가기
          </Link>
        </div>
      </header>

      {/* Book Detail */}
      <main style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '16px'
      }}>
        <div style={{
          background: '#ffffff',
          border: '2px solid #000000',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Book Cover */}
            <div style={{
              width: '100%',
              maxWidth: '300px',
              margin: '0 auto',
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              border: '2px solid #000000',
              position: 'relative'
            }}>
              {book.cover ? (
                <img
                  src={`/api/covers/${book.cover}`}
                  alt={book.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '400px',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <div style={{ fontSize: '80px' }}>📖</div>
              )}
              {isDownloaded && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: '#000000',
                  color: '#ffffff',
                  padding: '8px 12px',
                  fontSize: '18px',
                  fontWeight: 700
                }}>
                  ✓
                </div>
              )}
            </div>

            {/* Book Info */}
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 700,
                marginBottom: '16px',
                wordBreak: 'keep-all'
              }}>
                {book.title}
              </h1>

              {isDownloaded && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  border: '2px solid #000000',
                  background: '#000000',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 600
                }}>
                  ✓ 소장중인 도서입니다
                </div>
              )}

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '16px'
              }}>
                {book.author && (
                  <div style={{ fontSize: '18px' }}>
                    <span style={{ fontWeight: 600 }}>저자: </span>
                    <span>{book.author}</span>
                  </div>
                )}

                {book.year && (
                  <div style={{ fontSize: '18px' }}>
                    <span style={{ fontWeight: 600 }}>출판년도: </span>
                    <span>{book.year}</span>
                  </div>
                )}

                <div style={{ fontSize: '18px' }}>
                  <span style={{ fontWeight: 600 }}>파일형식: </span>
                  <span className="eink-badge">EPUB</span>
                </div>

                <div style={{ fontSize: '18px' }}>
                  <span style={{ fontWeight: 600 }}>파일크기: </span>
                  <span>{formatFileSize(book.size)}</span>
                </div>

                <div style={{ fontSize: '18px' }}>
                  <span style={{ fontWeight: 600 }}>등록일: </span>
                  <span>{new Date(book.addedDate).toLocaleDateString('ko-KR')}</span>
                </div>

                <div style={{ fontSize: '16px', wordBreak: 'break-all' }}>
                  <span style={{ fontWeight: 600 }}>파일명: </span>
                  <span>{book.filename}</span>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  marginBottom: '12px'
                }}>
                  책 소개
                </h2>
                <p style={{
                  fontSize: '18px',
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'keep-all'
                }}>
                  {book.description || '아직 등록된 책 소개가 없습니다.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <button
                  onClick={handleDownload}
                  className="eink-button-primary"
                  style={{ width: '100%' }}
                >
                  ⬇ EPUB 다운로드
                </button>

                {user && (
                  <button
                    onClick={toggleDownloadStatus}
                    className={isDownloaded ? 'eink-button-primary' : 'eink-button'}
                    style={{ width: '100%' }}
                  >
                    {isDownloaded ? '✓ 소장 취소' : '☐ 소장중으로 표시'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
