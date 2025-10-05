'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EinkAuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const handleSendVerificationCode = async () => {
    if (!email) {
      setError('이메일을 입력해주세요');
      return;
    }

    setSendingCode(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '인증 코드 전송 실패');
      }

      setSuccessMessage('인증 코드가 이메일로 전송되었습니다 (5분간 유효)');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '인증 코드 전송 실패');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('인증 코드를 입력해주세요');
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '인증 코드가 일치하지 않습니다');
      }

      setIsEmailVerified(true);
      setSuccessMessage('이메일 인증이 완료되었습니다');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '인증 실패');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 회원가입 시 검증
      if (!isLogin) {
        // 비밀번호 확인
        if (password !== confirmPassword) {
          throw new Error('비밀번호가 일치하지 않습니다');
        }

        // 이메일 인증 확인
        if (!isEmailVerified) {
          throw new Error('이메일 인증을 완료해주세요');
        }
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const body = isLogin
        ? { username, password, rememberMe }
        : { username, password, email, rememberMe };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // 회원가입 성공 시 승인 대기 메시지 처리
      if (!isLogin && data.pendingApproval) {
        setSuccessMessage(data.message);
        setError('');
        // 3초 후 로그인 탭으로 전환
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMessage('');
        }, 3000);
        return;
      }

      // 로그인 성공 시 E-ink 홈으로 이동
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

          {/* Success Message */}
          {successMessage && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              border: '2px solid #000000',
              background: '#000000',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 600
            }}>
              ✓ {successMessage}
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

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="confirmPassword"
                  style={{
                    display: 'block',
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: '8px'
                  }}
                >
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '18px',
                    border: '2px solid #000000',
                    background: '#ffffff',
                    color: '#000000',
                    boxSizing: 'border-box'
                  }}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  minLength={6}
                />
              </div>
            )}

            {/* Email (Signup only) */}
            {!isLogin && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label
                    htmlFor="email"
                    style={{
                      display: 'block',
                      fontSize: '18px',
                      fontWeight: 600,
                      marginBottom: '8px'
                    }}
                  >
                    이메일
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        fontSize: '18px',
                        border: '2px solid #000000',
                        background: isEmailVerified ? '#f0f0f0' : '#ffffff',
                        color: '#000000',
                        boxSizing: 'border-box'
                      }}
                      placeholder="이메일을 입력하세요"
                      required
                      disabled={isEmailVerified}
                    />
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={sendingCode || isEmailVerified}
                      className={isEmailVerified ? 'eink-button' : 'eink-button-primary'}
                      style={{
                        padding: '12px 16px',
                        fontSize: '16px',
                        whiteSpace: 'nowrap',
                        opacity: (sendingCode || isEmailVerified) ? 0.6 : 1
                      }}
                    >
                      {isEmailVerified ? '인증완료' : sendingCode ? '전송중' : '인증코드'}
                    </button>
                  </div>
                </div>

                {/* Verification Code */}
                {!isEmailVerified && (
                  <div style={{ marginBottom: '16px' }}>
                    <label
                      htmlFor="verificationCode"
                      style={{
                        display: 'block',
                        fontSize: '18px',
                        fontWeight: 600,
                        marginBottom: '8px'
                      }}
                    >
                      인증 코드
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="verificationCode"
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          fontSize: '18px',
                          border: '2px solid #000000',
                          background: '#ffffff',
                          color: '#000000',
                          boxSizing: 'border-box'
                        }}
                        placeholder="인증 코드 6자리"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        className="eink-button-primary"
                        style={{
                          padding: '12px 16px',
                          fontSize: '16px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        확인
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

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
      </div>
    </div>
  );
}
