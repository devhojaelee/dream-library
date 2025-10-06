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
  needsReview?: boolean;
}

interface User {
  id: string;
  username: string;
  downloadedBooks: number[];
  downloadHistory?: { bookId: number; downloadedAt: string }[];
}

export default function BookDetail() {
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
      const uiMode = 'standard'; // This is the standard UI
      const sessionId = getOrCreateSessionId();

      // Build URL with tracking params
      const params = new URLSearchParams({
        bookId: book.id.toString(),
        deviceType,
        uiMode,
        sessionId,
      });

      window.location.href = `/api/download/${encodeURIComponent(book.filename)}?${params.toString()}`;

      // Refresh page after download to update status
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
      console.log('Toggling download status:', { bookId: book.id, newStatus });

      const res = await fetch('/api/download-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, status: newStatus }),
      });

      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (res.ok) {
        // Update local state
        setUser({
          ...user,
          downloadedBooks: newStatus
            ? [...user.downloadedBooks, book.id]
            : user.downloadedBooks.filter(id => id !== book.id)
        });
        console.log('State updated successfully');
      } else {
        console.error('Failed to update status:', data);
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
        body: JSON.stringify({ filename: book.filename, needsReview: newStatus }),
      });

      if (res.ok) {
        setBook({
          ...book,
          needsReview: newStatus
        });
      }
    } catch (error) {
      console.error('Report error:', error);
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg font-medium">불러오는 중...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-900 text-xl font-semibold mb-4">책을 찾을 수 없습니다</div>
          <Link href="/" className="text-slate-700 hover:text-slate-900 font-medium">
            ← Dream Library로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <Link href="/" className="text-slate-700 hover:text-slate-900 flex items-center gap-2 font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Dream Library로 돌아가기</span>
          </Link>
        </div>
      </header>

      {/* Book Detail */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="md:flex">
            {/* Book Cover */}
            <div className="md:w-2/5 bg-gray-50 flex items-center justify-center p-8 relative">
              {book.cover ? (
                <img
                  src={`/api/covers/${book.cover}${book.coverUpdated ? `?v=${book.coverUpdated}` : ''}`}
                  alt={book.title}
                  className="w-full h-auto object-contain max-h-[600px] rounded-lg shadow-md"
                />
              ) : (
                <div className="text-9xl text-gray-300">📖</div>
              )}
              {/* Downloaded Badge */}
              {isDownloaded && (
                <div className="absolute top-6 right-6">
                  <div className="bg-green-600 text-white rounded-full p-2.5 shadow-lg">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Book Info */}
            <div className="md:w-3/5 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{book.title}</h1>

              {/* Book Metadata */}
              <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-100">
                <div className="space-y-3">
                  {book.author && (
                    <div className="flex items-start gap-3">
                      <span className="text-gray-500 text-sm font-medium w-20 flex-shrink-0 pt-0.5">저자</span>
                      <span className="text-gray-900 font-medium">{book.author}</span>
                    </div>
                  )}

                  {book.year && (
                    <div className="flex items-start gap-3">
                      <span className="text-gray-500 text-sm font-medium w-20 flex-shrink-0 pt-0.5">출판년도</span>
                      <span className="text-gray-900">{book.year}</span>
                    </div>
                  )}

                  {user && (
                    <>
                      <div className="flex items-start gap-3">
                        <span className="text-gray-500 text-sm font-medium w-20 flex-shrink-0 pt-0.5">파일형식</span>
                        <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded text-sm font-medium">
                          EPUB
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="text-gray-500 text-sm font-medium w-20 flex-shrink-0 pt-0.5">파일크기</span>
                        <span className="text-gray-900">{formatFileSize(book.size)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex items-start gap-3">
                    <span className="text-gray-500 text-sm font-medium w-20 flex-shrink-0 pt-0.5">등록일</span>
                    <span className="text-gray-900">
                      {new Date(book.addedDate).toLocaleDateString('ko-KR')}
                    </span>
                  </div>

                  {user && (
                    <div className="flex items-start gap-3">
                      <span className="text-gray-500 text-sm font-medium w-20 flex-shrink-0 pt-0.5">파일명</span>
                      <span className="text-gray-700 text-sm break-all">{book.filename}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Report Section */}
              {user && (
                <div className="mb-6">
                  {book.needsReview && (
                    <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-yellow-800">
                          이 책의 정보에 오류가 있다고 신고되었습니다. 관리자가 확인 중입니다.
                        </span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={toggleReportStatus}
                    disabled={reporting}
                    className={`w-full text-sm px-4 py-2.5 rounded-lg font-medium transition-colors ${
                      book.needsReview
                        ? 'bg-yellow-50 border border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                        : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                    } ${reporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {reporting ? '처리 중...' : book.needsReview ? '검토 요청됨 (취소)' : '🚨 정보 오류 신고'}
                  </button>
                </div>
              )}

              {/* Download Section */}
              {user && (
                <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">다운로드</h3>

                  {/* Downloaded Status Badge */}
                  {isDownloaded && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2.5 mb-1">
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-green-900">다운로드 완료</span>
                      </div>
                      {downloadDate && (
                        <div className="text-sm text-green-700 ml-7">
                          {new Date(downloadDate).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Main Download Button */}
                    <button
                      onClick={handleDownload}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>EPUB 다운로드</span>
                    </button>

                    {/* Toggle Download Status Button */}
                    <button
                      onClick={toggleDownloadStatus}
                      className={`w-full font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2.5 border ${
                        isDownloaded
                          ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <svg className={`w-5 h-5 ${isDownloaded ? 'text-green-600' : 'text-slate-400'}`} fill={isDownloaded ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isDownloaded ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} />
                      </svg>
                      <span>{isDownloaded ? '다운로드 완료 표시 해제' : '다운로드 완료로 표시'}</span>
                    </button>

                    {/* Info Text */}
                    <p className="text-xs text-gray-500 text-center pt-2">
                      다운로드 완료 표시는 읽은 책을 관리하는 데 도움이 됩니다
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">책 소개</h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
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
