'use client';

import { useEffect, useState, useRef } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Bulk selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Dropdown menu
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/all-users');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load users');
      }

      setAllUsers(data.users);
      setFilteredUsers(data.users);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and search
  useEffect(() => {
    let result = [...allUsers];

    // Tab filter
    if (activeTab === 'pending') {
      result = result.filter(u => !u.approved && u.role !== 'admin');
    } else if (activeTab === 'approved') {
      result = result.filter(u => u.approved && u.role !== 'admin');
    }

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [searchTerm, sortOrder, allUsers, activeTab]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handleApprove = async (userId: string, username: string) => {
    if (!confirm(`${username} 사용자를 승인하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Approval failed');
      }

      setSuccessMessage(`${username} 사용자가 승인되었습니다`);
      setTimeout(() => setSuccessMessage(''), 3000);
      loadAllUsers();
      setSelectedUsers(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Approval failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`${username} 사용자를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Deletion failed');
      }

      setSuccessMessage(`${username} 사용자가 삭제되었습니다`);
      setTimeout(() => setSuccessMessage(''), 3000);
      loadAllUsers();
      setSelectedUsers(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Deletion failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.size === 0) return;
    if (!confirm(`선택한 ${selectedUsers.size}명의 사용자를 승인하시겠습니까?`)) return;

    try {
      const promises = Array.from(selectedUsers).map((userId) =>
        fetch('/api/admin/approve-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        })
      );

      await Promise.all(promises);
      setSuccessMessage(`${selectedUsers.size}명의 사용자가 승인되었습니다`);
      setTimeout(() => setSuccessMessage(''), 3000);
      loadAllUsers();
      setSelectedUsers(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bulk approval failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    if (!confirm(`선택한 ${selectedUsers.size}명의 사용자를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const promises = Array.from(selectedUsers).map((userId) =>
        fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        })
      );

      await Promise.all(promises);
      setSuccessMessage(`${selectedUsers.size}명의 사용자가 삭제되었습니다`);
      setTimeout(() => setSuccessMessage(''), 3000);
      loadAllUsers();
      setSelectedUsers(new Set());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bulk deletion failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === currentUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(currentUsers.map((u) => u.id)));
    }
  };

  const pendingCount = allUsers.filter(u => !u.approved && u.role !== 'admin').length;
  const approvedCount = allUsers.filter(u => u.approved && u.role !== 'admin').length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-300">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">사용자 관리</h2>
        <div className="text-xs md:text-sm text-gray-800 font-medium">
          총 <span className="font-semibold text-gray-900">{allUsers.length}</span>명
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 md:gap-2 mb-4 md:mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 md:px-4 py-2 font-medium transition-colors border-b-2 text-sm md:text-base whitespace-nowrap min-h-[44px] ${
            activeTab === 'all'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          전체 ({allUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 md:px-4 py-2 font-medium transition-colors border-b-2 text-sm md:text-base whitespace-nowrap min-h-[44px] ${
            activeTab === 'pending'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          승인 대기 ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-3 md:px-4 py-2 font-medium transition-colors border-b-2 text-sm md:text-base whitespace-nowrap min-h-[44px] ${
            activeTab === 'approved'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          승인됨 ({approvedCount})
        </button>
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
      <div className="mb-4 md:mb-6 flex flex-col gap-3 md:gap-4">
        <div className="w-full">
          <input
            type="text"
            placeholder="이름 또는 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600 text-sm md:text-base min-h-[44px]"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="flex-1 md:flex-none px-3 md:px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium text-sm md:text-base min-h-[44px]"
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="flex-1 md:flex-none px-3 md:px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium text-sm md:text-base min-h-[44px]"
          >
            <option value={10}>10개씩</option>
            <option value={20}>20개씩</option>
            <option value={50}>50개씩</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between min-h-[44px]">
          <div className="text-gray-700 text-sm md:text-base font-medium">
            {selectedUsers.size}명 선택
          </div>
          <div className="flex gap-2 md:gap-3">
            {activeTab !== 'approved' && (
              <button
                onClick={handleBulkApprove}
                className="text-blue-600 hover:text-blue-700 text-sm md:text-base font-medium transition-colors flex items-center gap-1.5 min-h-[44px] px-2"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">승인</span>
              </button>
            )}
            <button
              onClick={handleBulkDelete}
              className="text-red-600 hover:text-red-700 text-sm md:text-base font-medium transition-colors flex items-center gap-1.5 min-h-[44px] px-2"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">삭제</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-800 text-lg font-medium">로딩 중...</div>
        </div>
      )}

      {/* No users */}
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-700 text-lg">
            {searchTerm ? '검색 결과가 없습니다' : '등록된 사용자가 없습니다'}
          </div>
        </div>
      )}

      {/* User Table/Cards */}
      {!loading && currentUsers.length > 0 && (
        <>
          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === currentUsers.length && currentUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">사용자명</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">이메일</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">권한</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">가입일</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 whitespace-nowrap">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center whitespace-nowrap">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-center whitespace-nowrap">{user.email}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : !user.approved
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.role === 'admin' ? '관리자' : !user.approved ? '대기중' : '일반'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-center whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="relative inline-block" ref={openDropdown === user.id ? dropdownRef : null}>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="작업"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>

                        {openDropdown === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            {!user.approved && user.role !== 'admin' && (
                              <button
                                onClick={() => {
                                  handleApprove(user.id, user.username);
                                  setOpenDropdown(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                사용자 승인
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleDelete(user.id, user.username);
                                setOpenDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              사용자 삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {currentUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                {/* Header with checkbox and status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      className="w-5 h-5 rounded border-gray-300 cursor-pointer mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-bold text-gray-900 mb-1 break-words">{user.username}</div>
                      <div className="text-sm text-gray-600 break-all">{user.email}</div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 flex-shrink-0 ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : !user.approved
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.role === 'admin' ? '관리자' : !user.approved ? '대기중' : '일반'}
                  </span>
                </div>

                {/* Info */}
                <div className="mb-3 text-sm text-gray-600">
                  가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!user.approved && user.role !== 'admin' && (
                    <button
                      onClick={() => handleApprove(user.id, user.username)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      승인
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(user.id, user.username)}
                    className={`${!user.approved && user.role !== 'admin' ? 'flex-1' : 'w-full'} bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px]`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 md:mt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="text-xs md:text-sm text-gray-800 font-medium text-center md:text-left">
                  {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} / 총 {filteredUsers.length}명
                </div>
                <div className="flex justify-center gap-1 md:gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm md:text-base min-h-[44px]"
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
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 md:px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm md:text-base min-h-[44px]"
                  >
                    다음
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
