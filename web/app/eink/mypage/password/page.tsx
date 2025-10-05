'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function EinkPasswordChangePage() {
  const [user, setUser] = useState<User | null>(null);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };

    loadUser();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다');
      return;
    }

    if (newPassword.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다');
      return;
    }

    try {
      setChanging(true);

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccessMessage('비밀번호가 성공적으로 변경되었습니다');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 700,
        marginBottom: '16px',
        letterSpacing: '-0.5px'
      }}>
        비밀번호 변경
      </h2>

      <div className="eink-card" style={{ padding: '20px' }}>
        {/* User Info */}
        {user && (
          <div className="eink-card" style={{
            marginBottom: '24px',
            padding: '20px',
            background: '#f8f8f8'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  width: '120px',
                  color: '#666666',
                  letterSpacing: '0.2px'
                }}>
                  사용자명:
                </span>
                <span style={{
                  fontSize: '16px',
                  letterSpacing: '0.2px'
                }}>
                  {user.username}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  width: '120px',
                  color: '#666666',
                  letterSpacing: '0.2px'
                }}>
                  이메일:
                </span>
                <span style={{
                  fontSize: '16px',
                  letterSpacing: '0.2px'
                }}>
                  {user.email}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  width: '120px',
                  color: '#666666',
                  letterSpacing: '0.2px'
                }}>
                  권한:
                </span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: user.role === 'admin' ? 700 : 400,
                  letterSpacing: '0.2px'
                }}>
                  {user.role === 'admin' ? '관리자' : '일반 사용자'}
                </span>
              </div>
            </div>

            {user.role === 'admin' && (
              <div style={{ marginTop: '20px' }}>
                <Link
                  href="/admin"
                  className="eink-button-primary"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  🔧 관리자 페이지로 이동
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Password Change Form */}
        <div>
          <h3 style={{
            fontSize: '22px',
            fontWeight: 700,
            marginBottom: '20px',
            letterSpacing: '-0.3px'
          }}>
            비밀번호 변경
          </h3>

          {error && (
            <div className="eink-card" style={{
              marginBottom: '20px',
              padding: '16px',
              border: '2px solid #000000',
              background: '#f8f8f8',
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}>
              ❌ {error}
            </div>
          )}

          {successMessage && (
            <div className="eink-card" style={{
              marginBottom: '20px',
              padding: '16px',
              border: '2px solid #000000',
              background: '#000000',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '0.2px'
            }}>
              ✅ {successMessage}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '10px',
                color: '#666666',
                letterSpacing: '0.3px'
              }}>
                현재 비밀번호
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="eink-input"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '10px',
                color: '#666666',
                letterSpacing: '0.3px'
              }}>
                새 비밀번호
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={4}
                className="eink-input"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '10px',
                color: '#666666',
                letterSpacing: '0.3px'
              }}>
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={4}
                className="eink-input"
              />
            </div>

            <button
              type="submit"
              disabled={changing}
              className="eink-button-primary"
              style={{
                width: '100%',
                marginTop: '8px',
                opacity: changing ? 0.5 : 1,
                cursor: changing ? 'not-allowed' : 'pointer'
              }}
            >
              {changing ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
