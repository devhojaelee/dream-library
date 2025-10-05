'use client';

import { useEffect, useState } from 'react';

interface PendingUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Bulk selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/pending-users');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load pending users');
      }

      setPendingUsers(data.users);
      setFilteredUsers(data.users);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, []);

  // Search and sort
  useEffect(() => {
    let result = [...pendingUsers];

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
    setCurrentPage(1); // Reset to first page when filter changes
  }, [searchTerm, sortOrder, pendingUsers]);

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
      setError('');
      setSelectedUsers(new Set());
      loadPendingUsers();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    }
  };

  const handleReject = async (userId: string, username: string) => {
    if (!confirm(`${username} 사용자를 거부하시겠습니까? (계정이 삭제됩니다)`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/reject-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Rejection failed');
      }

      setSuccessMessage(`${username} 사용자가 거부되었습니다`);
      setError('');
      setSelectedUsers(new Set());
      loadPendingUsers();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Rejection failed');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.size === 0) return;

    if (!confirm(`선택한 ${selectedUsers.size}명의 사용자를 승인하시겠습니까?`)) {
      return;
    }

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
      setError('');
      setSelectedUsers(new Set());
      loadPendingUsers();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bulk approval failed');
    }
  };

  const handleBulkReject = async () => {
    if (selectedUsers.size === 0) return;

    if (!confirm(`선택한 ${selectedUsers.size}명의 사용자를 거부하시겠습니까? (계정이 삭제됩니다)`)) {
      return;
    }

    try {
      const promises = Array.from(selectedUsers).map((userId) =>
        fetch('/api/admin/reject-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        })
      );

      await Promise.all(promises);

      setSuccessMessage(`${selectedUsers.size}명의 사용자가 거부되었습니다`);
      setError('');
      setSelectedUsers(new Set());
      loadPendingUsers();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bulk rejection failed');
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">사용자 승인 관리</h2>
        <div className="text-sm text-gray-800 font-medium">
          총 <span className="font-semibold text-gray-900">{filteredUsers.length}</span>명 대기중
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
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="이름 또는 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
          >
            <option value={10}>10개씩</option>
            <option value={20}>20개씩</option>
            <option value={50}>50개씩</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="text-blue-700 font-medium">
            {selectedUsers.size}명 선택됨
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkApprove}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              일괄 승인
            </button>
            <button
              onClick={handleBulkReject}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              일괄 거부
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

      {/* No pending users */}
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-700 text-lg">
            {searchTerm ? '검색 결과가 없습니다' : '승인 대기 중인 사용자가 없습니다'}
          </div>
        </div>
      )}

      {/* User Table */}
      {!loading && currentUsers.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === currentUsers.length && currentUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">사용자명</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">이메일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">신청일</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(user.createdAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(user.id, user.username)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(user.id, user.username)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          거부
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-800 font-medium">
                {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} / 총 {filteredUsers.length}명
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  이전
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
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
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
