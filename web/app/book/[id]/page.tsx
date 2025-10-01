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

export default function BookDetail() {
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
      const res = await fetch('/api/download-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, status: newStatus }),
      });

      if (res.ok) {
        // Update local state
        setUser({
          ...user,
          downloadedBooks: newStatus
            ? [...user.downloadedBooks, book.id]
            : user.downloadedBooks.filter(id => id !== book.id)
        });
      }
    } catch (error) {
      console.error('Toggle error:', error);
      alert('상태 업데이트에 실패했습니다');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-yellow-400/70 text-3xl animate-pulse">✨</div>
          <div className="absolute top-40 right-20 text-yellow-300/60 text-2xl">⭐</div>
          <div className="absolute bottom-40 left-1/3 text-yellow-400/60 text-3xl">✨</div>
        </div>
        <div className="text-gray-800 text-xl font-medium relative z-10">불러오는 중...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-yellow-400/70 text-3xl animate-pulse">✨</div>
          <div className="absolute top-40 right-20 text-yellow-300/60 text-2xl">⭐</div>
          <div className="absolute bottom-40 left-1/3 text-yellow-400/60 text-3xl">✨</div>
        </div>
        <div className="text-center relative z-10">
          <div className="text-gray-900 text-xl font-semibold mb-4">책을 찾을 수 없습니다</div>
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Dream Library로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Background Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-yellow-400/70 text-3xl animate-pulse">✨</div>
        <div className="absolute top-40 right-20 text-yellow-300/60 text-2xl">⭐</div>
        <div className="absolute top-60 left-1/4 text-yellow-400/50 text-4xl">✨</div>
        <div className="absolute bottom-40 left-1/3 text-yellow-400/60 text-3xl animate-pulse">✨</div>
        <div className="absolute bottom-60 right-1/4 text-yellow-300/50 text-2xl">⭐</div>
        <div className="absolute top-1/3 left-1/5 text-yellow-400/50 text-2xl">⭐</div>
        <div className="absolute top-2/3 right-1/5 text-yellow-300/60 text-3xl">✨</div>
        <div className="absolute bottom-1/3 left-2/3 text-yellow-300/70 text-2xl animate-pulse">✨</div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-300 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium">
            <span>←</span>
            <span>Dream Library로 돌아가기</span>
          </Link>
        </div>
      </header>

      {/* Book Detail */}
      <main className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-300">
          <div className="md:flex">
            {/* Book Cover */}
            <div className="md:w-1/3 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-12 relative overflow-hidden">
              {book.cover ? (
                <img
                  src={`/api/covers/${book.cover}`}
                  alt={book.title}
                  className="w-full h-auto object-contain max-h-[500px] shadow-xl rounded-lg"
                />
              ) : (
                <div className="text-9xl text-gray-300">📖</div>
              )}
              {/* Downloaded Badge */}
              {isDownloaded && (
                <div className="absolute top-4 right-4">
                  <div className="bg-green-500 text-white rounded-full p-3 shadow-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Book Info */}
            <div className="md:w-2/3 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{book.title}</h1>

              {/* Downloaded Status Badge */}
              {isDownloaded && (
                <div className="mb-4 inline-flex items-center gap-2 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg">
                  <span>✅</span>
                  <span className="font-semibold">소장중인 도서입니다</span>
                </div>
              )}

              <div className="space-y-4 mb-8">
                {book.author && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-medium">저자:</span>
                    <span className="text-gray-900 font-semibold">{book.author}</span>
                  </div>
                )}

                {book.year && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-medium">출판년도:</span>
                    <span className="text-gray-900 font-medium">{book.year}</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-medium">파일형식:</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                    EPUB
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-medium">파일크기:</span>
                  <span className="text-gray-900 font-medium">{formatFileSize(book.size)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-medium">등록일:</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(book.addedDate).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-medium">파일명:</span>
                  <span className="text-gray-800 text-sm break-all">{book.filename}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">책 소개</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {book.description || '아직 등록된 책 소개가 없습니다. 나중에 책 소개를 추가할 수 있습니다!'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3 text-lg shadow-md hover:shadow-lg"
                >
                  <span>⬇️</span>
                  <span>EPUB 다운로드</span>
                </button>

                {/* Toggle Download Status Button */}
                {user && (
                  <button
                    onClick={toggleDownloadStatus}
                    className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3 border-2 ${
                      isDownloaded
                        ? 'bg-green-100 border-green-400 text-green-800 hover:bg-green-200'
                        : 'bg-white border-gray-400 text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <span>{isDownloaded ? '✅' : '☐'}</span>
                    <span>{isDownloaded ? '소장 취소' : '소장중으로 표시'}</span>
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
