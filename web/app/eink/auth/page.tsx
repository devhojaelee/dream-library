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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 실시간 검증 상태
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const router = useRouter();

  // 이메일 형식 검증
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 사용자명 검증 (영문, 숫자, 언더스코어만 허용)
  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  // 비밀번호 검증
  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  // 이메일 blur 이벤트
  const handleEmailBlur = () => {
    if (!email) {
      setEmailError('');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다');
    } else {
      setEmailError('');
    }
  };

  // 사용자명 blur 이벤트
  const handleUsernameBlur = async () => {
    if (!username) {
      setUsernameError('');
      return;
    }
    if (!validateUsername(username)) {
      setUsernameError('3-20자의 영문, 숫자, 언더스코어만 사용 가능합니다');
      return;
    }

    // 중복 확인
    try {
      const res = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();

      if (!data.available) {
        setUsernameError('이미 사용 중인 아이디입니다');
      } else {
        setUsernameError('');
      }
    } catch (err) {
      console.error('Username check failed:', err);
    }
  };

  // 비밀번호 blur 이벤트
  const handlePasswordBlur = () => {
    if (!password) {
      setPasswordError('');
      return;
    }
    if (!validatePassword(password)) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다');
    } else {
      setPasswordError('');
    }
  };

  // 비밀번호 확인 blur 이벤트
  const handleConfirmPasswordBlur = () => {
    if (!confirmPassword) {
      setConfirmPasswordError('');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSendVerificationCode = async () => {
    if (!email) {
      setError('이메일을 입력해주세요');
      return;
    }

    if (!validateEmail(email)) {
      setError('올바른 이메일 형식을 입력해주세요');
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
        // 사용자명 검증
        if (!validateUsername(username)) {
          throw new Error('사용자명은 3-20자의 영문, 숫자, 언더스코어만 사용 가능합니다');
        }

        // 이메일 형식 검증
        if (!validateEmail(email)) {
          throw new Error('올바른 이메일 형식을 입력해주세요');
        }

        // 비밀번호 길이 검증
        if (!validatePassword(password)) {
          throw new Error('비밀번호는 최소 8자 이상이어야 합니다');
        }

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

      // 로그인 성공 시 홈으로 이동
      router.push('/eink');
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}>Dream Library</h1>
          <Link href="/eink" style={{
            display: 'inline-block',
            textDecoration: 'none',
            color: '#000000',
            background: '#ffffff',
            border: '2px solid #000000',
            padding: '12px 24px',
            fontSize: '18px',
            fontWeight: 600
          }}>
            ← 홈으로
          </Link>
        </div>

        {/* Form Card */}
        <div style={{
          background: '#ffffff',
          border: '3px solid #000000',
          padding: '32px'
        }}>
          {/* Toggle Tabs */}
          <div style={{
            display: 'flex',
            marginBottom: '32px',
            border: '2px solid #000000'
          }}>
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
                setEmailError('');
                setUsernameError('');
                setPasswordError('');
                setConfirmPasswordError('');
              }}
              style={{
                flex: 1,
                padding: '14px 16px',
                fontSize: '20px',
                fontWeight: 700,
                borderRight: '2px solid #000000',
                background: isLogin ? '#000000' : '#ffffff',
                color: isLogin ? '#ffffff' : '#000000',
                border: 'none',
                borderRight: '2px solid #000000',
                cursor: 'pointer'
              }}
            >
              로그인
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
                setEmailError('');
                setUsernameError('');
                setPasswordError('');
                setConfirmPasswordError('');
              }}
              style={{
                flex: 1,
                padding: '14px 16px',
                fontSize: '20px',
                fontWeight: 700,
                background: !isLogin ? '#000000' : '#ffffff',
                color: !isLogin ? '#ffffff' : '#000000',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              회원가입
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              border: '2px solid #000000',
              background: '#f5f5f5'
            }}>
              <p style={{ fontSize: '18px', fontWeight: 600 }}>❌ {error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              border: '2px solid #000000',
              background: '#f5f5f5'
            }}>
              <p style={{ fontSize: '18px', fontWeight: 600 }}>✓ {successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="username" style={{
                display: 'block',
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={!isLogin ? handleUsernameBlur : undefined}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: usernameError ? '3px solid #000000' : '2px solid #cccccc',
                  background: '#ffffff',
                  color: '#000000',
                  boxSizing: 'border-box',
                  fontWeight: 500,
                  minHeight: '48px'
                }}
                placeholder="아이디를 입력하세요"
                required
                autoComplete="username"
              />
              {!isLogin && usernameError && (
                <p style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600 }}>❌ {usernameError}</p>
              )}
              {!isLogin && !usernameError && username && validateUsername(username) && (
                <p style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600 }}>✓ 사용 가능한 아이디입니다</p>
              )}
            </div>

            {/* Email (Signup only) */}
            {!isLogin && (
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="email" style={{
                  display: 'block',
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '12px'
                }}>
                  이메일
                </label>
                <div style={{ display: 'flex' }}>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: emailError ? '3px solid #000000' : '2px solid #cccccc',
                      background: '#ffffff',
                      color: '#000000',
                      boxSizing: 'border-box',
                      fontWeight: 500,
                      minHeight: '48px',
                      marginRight: !isEmailVerified ? '12px' : '0'
                    }}
                    placeholder="이메일을 입력하세요"
                    required
                    disabled={isEmailVerified}
                    autoComplete="email"
                  />
                  {!isEmailVerified && (
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={sendingCode || !email}
                      style={{
                        background: '#000000',
                        color: '#ffffff',
                        border: '2px solid #000000',
                        minHeight: '48px',
                        fontSize: '16px',
                        padding: '10px 20px',
                        cursor: sendingCode || !email ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        opacity: sendingCode || !email ? 0.5 : 1
                      }}
                    >
                      {sendingCode ? '전송중...' : '인증코드'}
                    </button>
                  )}
                </div>
                {emailError && (
                  <p style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600 }}>❌ {emailError}</p>
                )}
                {!emailError && email && validateEmail(email) && !isEmailVerified && (
                  <p style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600 }}>✓ 올바른 이메일 형식입니다</p>
                )}
              </div>
            )}

            {/* Verification Code (Signup only, after sending code) */}
            {!isLogin && !isEmailVerified && successMessage.includes('전송') && (
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="verificationCode" style={{
                  display: 'block',
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '12px'
                }}>
                  인증 코드
                </label>
                <div style={{ display: 'flex' }}>
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      fontSize: '16px',
                      border: '2px solid #cccccc',
                      background: '#ffffff',
                      color: '#000000',
                      boxSizing: 'border-box',
                      fontWeight: 500,
                      minHeight: '48px',
                      marginRight: '12px'
                    }}
                    placeholder="6자리 인증 코드 입력"
                    required
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={!verificationCode}
                    style={{
                      background: '#000000',
                      color: '#ffffff',
                      border: '2px solid #000000',
                      minHeight: '48px',
                      fontSize: '16px',
                      padding: '10px 20px',
                      cursor: !verificationCode ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      opacity: !verificationCode ? 0.5 : 1
                    }}
                  >
                    확인
                  </button>
                </div>
              </div>
            )}

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                비밀번호
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={!isLogin ? handlePasswordBlur : undefined}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    paddingRight: '64px',
                    fontSize: '16px',
                    border: passwordError ? '3px solid #000000' : '2px solid #cccccc',
                    background: '#ffffff',
                    color: '#000000',
                    boxSizing: 'border-box',
                    fontWeight: 500,
                    minHeight: '48px'
                  }}
                  placeholder="비밀번호를 입력하세요"
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '24px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    lineHeight: 1
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {!isLogin && passwordError && (
                <p style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600 }}>❌ {passwordError}</p>
              )}
              {!isLogin && !passwordError && password && validatePassword(password) && (
                <p style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600 }}>✓ 안전한 비밀번호입니다</p>
              )}
              {!isLogin && (
                <p style={{ marginTop: '8px', fontSize: '14px' }}>최소 8자 이상 입력하세요</p>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="confirmPassword" style={{
                  display: 'block',
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '12px'
                }}>
                  비밀번호 확인
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={handleConfirmPasswordBlur}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      paddingRight: '64px',
                      fontSize: '16px',
                      border: confirmPasswordError ? '3px solid #000000' : '2px solid #cccccc',
                      background: '#ffffff',
                      color: '#000000',
                      boxSizing: 'border-box',
                      fontWeight: 500,
                      minHeight: '48px'
                    }}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '24px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0',
                      lineHeight: 1
                    }}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600 }}>❌ {confirmPasswordError}</p>
                )}
                {!confirmPasswordError && confirmPassword && password === confirmPassword && (
                  <p style={{ marginTop: '8px', fontSize: '16px', fontWeight: 600 }}>✓ 비밀번호가 일치합니다</p>
                )}
              </div>
            )}

            {/* Remember Me (Login only) */}
            {isLogin && (
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
                    width: '24px',
                    height: '24px',
                    border: '2px solid #000000',
                    marginRight: '12px'
                  }}
                />
                <label htmlFor="rememberMe" style={{
                  fontSize: '18px',
                  fontWeight: 600
                }}>
                  로그인 상태 유지 (30일)
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!isLogin && !isEmailVerified)}
              style={{
                width: '100%',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #000000',
                minHeight: '48px',
                fontSize: '18px',
                padding: '14px 20px',
                cursor: (loading || (!isLogin && !isEmailVerified)) ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                opacity: (loading || (!isLogin && !isEmailVerified)) ? 0.5 : 1
              }}
            >
              {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
