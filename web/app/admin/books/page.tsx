'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Book {
  filename: string;
  title: string;
  author: string | null;
  year: string | null;
  description: string | null;
  cover: string | null;
  coverUpdated: string | null;
  needsReview: boolean;
  size: number;
  addedDate: string;
  metadataPath: string | null;
}

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [showOnlyReview, setShowOnlyReview] = useState(false);

  // Edit modal
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    year: '',
    description: '',
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Naver search
  interface NaverBookResult {
    title: string;
    author: string;
    publisher: string;
    pubdate: string;
    description: string;
    imageUrl: string;
  }
  const [naverSearching, setNaverSearching] = useState(false);
  const [naverResults, setNaverResults] = useState<NaverBookResult[]>([]);
  const [showNaverResults, setShowNaverResults] = useState(false);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/books');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load books');
      }

      setBooks(data.books);
      setFilteredBooks(data.books);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // Search and sort
  useEffect(() => {
    let result = [...books];

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Review filter
    if (showOnlyReview) {
      result = result.filter((book) => book.needsReview);
    }

    // Sort
    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    setFilteredBooks(result);
    setCurrentPage(1);
  }, [searchTerm, sortOrder, showOnlyReview, books]);

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBooks = filteredBooks.slice(startIndex, endIndex);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setEditForm({
      title: book.title,
      author: book.author || '',
      year: book.year || '',
      description: book.description || '',
    });
    setCoverImage(null);
    setCoverPreview(book.cover ? `/api/covers/${book.cover}${book.coverUpdated ? `?v=${book.coverUpdated}` : ''}` : null);
  };

  const closeEditModal = () => {
    setEditingBook(null);
    setEditForm({ title: '', author: '', year: '', description: '' });
    setCoverImage(null);
    setCoverPreview(null);
    setNaverResults([]);
    setShowNaverResults(false);
  };

  const handleNaverSearch = async () => {
    if (!editForm.title) {
      alert('제목을 입력해주세요');
      return;
    }

    try {
      setNaverSearching(true);
      setShowNaverResults(true);

      const res = await fetch('/api/admin/search-naver-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: editForm.title }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '검색 실패');
      }

      setNaverResults(data.results || []);

      if (data.results.length === 0) {
        alert('검색 결과가 없습니다');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '검색 중 오류 발생');
    } finally {
      setNaverSearching(false);
    }
  };

  const selectNaverResult = async (result: NaverBookResult) => {
    // 폼에 정보 채우기
    setEditForm({
      title: result.title,
      author: result.author,
      year: result.pubdate,
      description: result.description,
    });

    // 표지 이미지 URL을 미리보기로만 설정 (실제 다운로드는 서버에서 처리)
    if (result.imageUrl) {
      setCoverPreview(result.imageUrl);
      // coverImage는 null로 두고, 나중에 저장할 때 서버에서 URL로 다운로드
      setCoverImage(null);
    }

    // 검색 결과 닫기
    setShowNaverResults(false);
    setSuccessMessage('네이버 검색 결과로 정보가 채워졌습니다. 저장하면 표지 이미지가 자동으로 다운로드됩니다.');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!editingBook) return;

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append('filename', editingBook.filename);
      formData.append('title', editForm.title);
      formData.append('author', editForm.author);
      formData.append('year', editForm.year);
      formData.append('description', editForm.description);

      if (coverImage) {
        formData.append('coverImage', coverImage);
      } else if (coverPreview && coverPreview.startsWith('http')) {
        // 네이버 검색 결과 이미지 URL
        formData.append('coverImageUrl', coverPreview);
      }

      const res = await fetch('/api/admin/update-book', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update book');
      }

      setSuccessMessage(`${editForm.title} 책 정보가 업데이트되었습니다`);
      setError('');
      closeEditModal();
      loadBooks();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-300">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">책 관리</h2>
        <div className="text-xs md:text-sm text-gray-800 font-medium">
          총 <span className="font-semibold text-gray-900">{filteredBooks.length}</span>권
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {/* Search & Controls */}
      <div className="mb-4 md:mb-6 flex flex-col gap-3">
        <div className="w-full">
          <input
            type="text"
            placeholder="제목 또는 저자로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600 text-sm md:text-base min-h-[44px]"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setShowOnlyReview(!showOnlyReview)}
            className={`px-3 md:px-4 py-2.5 md:py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm md:text-base min-h-[44px] ${
              showOnlyReview
                ? 'bg-yellow-500 text-white border border-yellow-600'
                : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-base md:text-lg">{showOnlyReview ? '☑' : '☐'}</span>
            <span>🚨 검토 필요만</span>
          </button>
          <div className="flex gap-2 flex-1">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'title')}
              className="flex-1 px-3 md:px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium text-sm md:text-base min-h-[44px]"
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="title">제목순</option>
            </select>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="flex-1 px-3 md:px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium text-sm md:text-base min-h-[44px]"
            >
              <option value={10}>10개씩</option>
              <option value={20}>20개씩</option>
              <option value={50}>50개씩</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-800 text-lg font-medium">로딩 중...</div>
        </div>
      )}

      {/* No books */}
      {!loading && filteredBooks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-700 text-lg">
            {searchTerm ? '검색 결과가 없습니다' : '책이 없습니다'}
          </div>
        </div>
      )}

      {/* Books Table/Cards */}
      {!loading && currentBooks.length > 0 && (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="w-16 px-3 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">표지</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">제목</th>
                  <th className="w-48 px-3 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">저자</th>
                  <th className="w-20 px-3 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">연도</th>
                  <th className="w-24 px-3 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentBooks.map((book) => (
                  <tr key={book.filename} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex justify-center">
                        {book.cover ? (
                          <Image
                            src={`/api/covers/${book.cover}${book.coverUpdated ? `?v=${book.coverUpdated}` : ''}`}
                            alt={book.title}
                            width={40}
                            height={60}
                            className="rounded shadow-sm object-cover"
                          />
                        ) : (
                          <div className="w-10 h-14 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                            No Cover
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 max-w-xs xl:max-w-md">
                      <div className="flex items-center gap-1">
                        {book.needsReview && (
                          <span className="flex-shrink-0" title="검토 필요">
                            🚨
                          </span>
                        )}
                        <div
                          className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0"
                          title={book.title}
                        >
                          {book.title}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 max-w-[120px] sm:max-w-[160px] lg:max-w-[200px]">
                      <div
                        className="text-sm text-gray-800 truncate"
                        title={book.author || '-'}
                      >
                        {book.author || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-800 text-center whitespace-nowrap">{book.year || '-'}</td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(book)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm transition-colors"
                      >
                        편집
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {currentBooks.map((book) => (
              <div
                key={book.filename}
                className={`border rounded-lg p-3 ${
                  book.needsReview
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex gap-3">
                  {/* Cover */}
                  <div className="flex-shrink-0">
                    {book.cover ? (
                      <Image
                        src={`/api/covers/${book.cover}${book.coverUpdated ? `?v=${book.coverUpdated}` : ''}`}
                        alt={book.title}
                        width={60}
                        height={90}
                        className="rounded shadow-md object-cover"
                      />
                    ) : (
                      <div className="w-[60px] h-[90px] bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                        표지 없음
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {/* Title with badge */}
                    <div className="flex items-start gap-2 mb-2">
                      {book.needsReview && (
                        <span className="text-xl flex-shrink-0" title="검토 필요">
                          🚨
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 flex-1">
                        {book.title}
                      </h3>
                    </div>

                    {/* Author & Year */}
                    <div className="space-y-1 mb-3">
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold">저자:</span> {book.author || '-'}
                      </div>
                      <div className="text-xs text-gray-700">
                        <span className="font-semibold">연도:</span> {book.year || '-'}
                      </div>
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(book)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm min-h-[44px]"
                    >
                      편집
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 md:mt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-xs md:text-sm text-gray-800 font-medium text-center md:text-left">
                  {startIndex + 1}-{Math.min(endIndex, filteredBooks.length)} / 총 {filteredBooks.length}권
                </div>
                <div className="flex justify-center gap-1 md:gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm md:text-base min-h-[44px]"
                  >
                    이전
                  </button>
                  <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] md:max-w-none">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2.5 md:px-3 py-2 rounded-lg transition-colors text-sm md:text-base min-h-[44px] flex-shrink-0 ${
                          currentPage === page
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm md:text-base min-h-[44px]"
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editingBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white md:rounded-xl shadow-2xl max-w-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-lg md:text-2xl font-bold text-gray-900">책 정보 수정</h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Naver Search Button */}
              <div className="mb-4 md:mb-6 pb-4 md:pb-6 border-b border-gray-200">
                <button
                  onClick={handleNaverSearch}
                  disabled={naverSearching || !editForm.title}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 md:px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base min-h-[44px]"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>{naverSearching ? '검색 중...' : '네이버에서 자동으로 찾기'}</span>
                </button>
                {!editForm.title && (
                  <p className="text-xs text-gray-900 mt-2 text-center">제목을 먼저 입력해주세요</p>
                )}
              </div>

              {/* Naver Search Results */}
              {showNaverResults && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900">네이버 검색 결과</h4>
                    <button
                      onClick={() => setShowNaverResults(false)}
                      className="text-gray-900 hover:text-gray-900 font-medium text-sm"
                    >
                      닫기
                    </button>
                  </div>

                  {naverSearching ? (
                    <div className="text-center py-8">
                      <div className="text-gray-900 font-medium">검색 중...</div>
                    </div>
                  ) : naverResults.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-900 font-medium">검색 결과가 없습니다</div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {naverResults.map((result, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-500 transition-colors"
                        >
                          <div className="flex gap-4">
                            {result.imageUrl && (
                              <img
                                src={result.imageUrl}
                                alt={result.title}
                                className="w-16 h-24 object-cover rounded shadow-sm"
                              />
                            )}
                            <div className="flex-1">
                              <h5 className="font-bold text-gray-900 mb-1">{result.title}</h5>
                              <p className="text-sm text-gray-900 mb-1">
                                <span className="font-semibold">저자:</span> {result.author || '-'}
                              </p>
                              <p className="text-sm text-gray-900 mb-1">
                                <span className="font-semibold">출판:</span> {result.publisher || '-'} | {result.pubdate || '-'}
                              </p>
                              {result.description && (
                                <p className="text-xs text-gray-900 mt-2 line-clamp-2">
                                  {result.description}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => selectNaverResult(result)}
                              className="self-start bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                              선택
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4">
                {/* Cover Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">표지 이미지</label>
                  <div className="flex items-center gap-4">
                    {coverPreview && (
                      <Image
                        src={coverPreview}
                        alt="Cover preview"
                        width={120}
                        height={180}
                        className="rounded shadow-md object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleCoverChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-900 mt-1 font-medium">JPG, PNG, WEBP (최대 5MB)</p>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">제목</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">저자</label>
                  <input
                    type="text"
                    value={editForm.author}
                    onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">출판년도</label>
                  <input
                    type="text"
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">설명</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 font-medium"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 md:mt-6 flex flex-col sm:flex-row justify-end gap-2 md:gap-3">
                <button
                  onClick={closeEditModal}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2.5 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-900 font-semibold text-sm md:text-base min-h-[44px]"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold text-sm md:text-base min-h-[44px]"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
