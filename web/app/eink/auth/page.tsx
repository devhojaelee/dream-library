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
    <div className="eink-mode min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Dream Library</h1>
          <Link href="/eink" className="eink-button-secondary inline-block">
            ← 홈으로
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white border-4 border-black p-8">
          {/* Toggle Tabs */}
          <div className="flex mb-8 border-2 border-black">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
                setEmailError('');
                setUsernameError('');
                setPasswordError('');
                setConfirmPasswordError('');
              }}
              className={`flex-1 py-3 px-4 text-xl font-bold border-r-2 border-black ${
                isLogin ? 'bg-black text-white' : 'bg-white text-black'
              }`}
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
              className={`flex-1 py-3 px-4 text-xl font-bold ${
                !isLogin ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 border-3 border-black bg-gray-100">
              <p className="text-lg font-semibold">❌ {error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 border-3 border-black bg-gray-100">
              <p className="text-lg font-semibold">✓ {successMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xl font-bold mb-3">
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={!isLogin ? handleUsernameBlur : undefined}
                className={`eink-input ${usernameError ? 'border-black border-4' : ''}`}
                placeholder="아이디를 입력하세요"
                required
                autoComplete="username"
              />
              {!isLogin && usernameError && (
                <p className="mt-2 text-base font-semibold">❌ {usernameError}</p>
              )}
              {!isLogin && !usernameError && username && validateUsername(username) && (
                <p className="mt-2 text-base font-semibold">✓ 사용 가능한 아이디입니다</p>
              )}
            </div>

            {/* Email (Signup only) */}
            {!isLogin && (
              <div>
                <label htmlFor="email" className="block text-xl font-bold mb-3">
                  이메일
                </label>
                <div className="flex gap-3">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    className={`flex-1 eink-input ${emailError ? 'border-black border-4' : ''}`}
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
                      className="eink-button-primary whitespace-nowrap"
                    >
                      {sendingCode ? '전송중...' : '인증코드'}
                    </button>
                  )}
                </div>
                {emailError && (
                  <p className="mt-2 text-base font-semibold">❌ {emailError}</p>
                )}
                {!emailError && email && validateEmail(email) && !isEmailVerified && (
                  <p className="mt-2 text-base font-semibold">✓ 올바른 이메일 형식입니다</p>
                )}
              </div>
            )}

            {/* Verification Code (Signup only, after sending code) */}
            {!isLogin && !isEmailVerified && successMessage.includes('전송') && (
              <div>
                <label htmlFor="verificationCode" className="block text-xl font-bold mb-3">
                  인증 코드
                </label>
                <div className="flex gap-3">
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="flex-1 eink-input"
                    placeholder="6자리 인증 코드 입력"
                    required
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={!verificationCode}
                    className="eink-button-primary whitespace-nowrap"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xl font-bold mb-3">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={!isLogin ? handlePasswordBlur : undefined}
                  className={`eink-input pr-16 ${passwordError ? 'border-black border-4' : ''}`}
                  placeholder="비밀번호를 입력하세요"
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {!isLogin && passwordError && (
                <p className="mt-2 text-base font-semibold">❌ {passwordError}</p>
              )}
              {!isLogin && !passwordError && password && validatePassword(password) && (
                <p className="mt-2 text-base font-semibold">✓ 안전한 비밀번호입니다</p>
              )}
              {!isLogin && (
                <p className="mt-2 text-sm">최소 8자 이상 입력하세요</p>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-xl font-bold mb-3">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={handleConfirmPasswordBlur}
                    className={`eink-input pr-16 ${confirmPasswordError ? 'border-black border-4' : ''}`}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="mt-2 text-base font-semibold">❌ {confirmPasswordError}</p>
                )}
                {!confirmPasswordError && confirmPassword && password === confirmPassword && (
                  <p className="mt-2 text-base font-semibold">✓ 비밀번호가 일치합니다</p>
                )}
              </div>
            )}

            {/* Remember Me (Login only) */}
            {isLogin && (
              <div className="flex items-center gap-3">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-6 h-6 border-2 border-black"
                />
                <label htmlFor="rememberMe" className="text-lg font-semibold">
                  로그인 상태 유지 (30일)
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!isLogin && !isEmailVerified)}
              className="eink-button-primary w-full"
              style={{
                opacity: loading || (!isLogin && !isEmailVerified) ? 0.5 : 1,
                cursor: loading || (!isLogin && !isEmailVerified) ? 'not-allowed' : 'pointer',
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
