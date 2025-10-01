'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EinkAuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Redirect to E-ink home
      window.location.href = '/eink';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eink-mode" style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{ maxWidth: '500px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '8px'
          }}>
            Dream Library
          </h1>
          <p style={{ fontSize: '18px' }}>(E-Reader Mode)</p>
        </div>

        {/* Form Card */}
        <div style={{
          background: '#ffffff',
          border: '2px solid #000000',
          padding: '24px'
        }}>
          {/* Toggle Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={isLogin ? 'eink-button-primary' : 'eink-button'}
              style={{ flex: 1 }}
            >
              로그인
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={!isLogin ? 'eink-button-primary' : 'eink-button'}
              style={{ flex: 1 }}
            >
              회원가입
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              border: '2px solid #000000',
              background: '#f0f0f0',
              fontSize: '16px'
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="username"
                style={{
                  display: 'block',
                  fontSize: '18px',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}
              >
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '18px',
                  border: '2px solid #000000',
                  background: '#ffffff',
                  color: '#000000',
                  boxSizing: 'border-box'
                }}
                placeholder="아이디를 입력하세요"
                required
                minLength={3}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '18px',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '18px',
                  border: '2px solid #000000',
                  background: '#ffffff',
                  color: '#000000',
                  boxSizing: 'border-box'
                }}
                placeholder="비밀번호를 입력하세요"
                required
                minLength={6}
              />
            </div>

            {/* Remember Me */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginRight: '8px'
                }}
              />
              <label
                htmlFor="rememberMe"
                style={{
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                로그인 상태 유지 (30일)
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="eink-button-primary"
              style={{
                width: '100%',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? '처리중...' : isLogin ? '로그인' : '회원가입'}
            </button>
          </form>

          {/* Info Text */}
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '16px'
          }}>
            {isLogin ? (
              <p>
                계정이 없으신가요?{' '}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  회원가입
                </button>
              </p>
            ) : (
              <p>
                이미 계정이 있으신가요?{' '}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  로그인
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Continue as Guest */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <Link
            href="/eink"
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#000000',
              textDecoration: 'underline'
            }}
          >
            로그인하지 않고 둘러보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
