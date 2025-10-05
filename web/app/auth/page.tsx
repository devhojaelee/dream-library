'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
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
      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-yellow-400/70 text-3xl animate-pulse">✨</div>
        <div className="absolute top-40 right-20 text-yellow-300/60 text-2xl">⭐</div>
        <div className="absolute bottom-40 left-1/3 text-yellow-400/60 text-3xl animate-pulse">✨</div>
        <div className="absolute bottom-60 right-1/4 text-yellow-300/50 text-2xl">⭐</div>
        <div className="absolute top-1/2 left-1/4 text-yellow-400/70 text-4xl">✨</div>
        <div className="absolute top-1/3 right-1/3 text-yellow-300/60 text-3xl animate-pulse">⭐</div>
        <div className="absolute top-2/3 right-10 text-yellow-400/50 text-2xl">✨</div>
        <div className="absolute bottom-1/3 left-10 text-yellow-300/70 text-3xl">⭐</div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">✨ Dream Library</h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-300">
          {/* Toggle Tabs */}
          <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
                setEmailError('');
                setUsernameError('');
                setPasswordError('');
                setConfirmPasswordError('');
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                isLogin
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
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
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                !isLogin
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={!isLogin ? handleUsernameBlur : undefined}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  usernameError ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="아이디를 입력하세요"
                required
                autoComplete="username"
              />
              {!isLogin && usernameError && (
                <p className="mt-1 text-sm text-red-600">{usernameError}</p>
              )}
              {!isLogin && !usernameError && username && (
                <p className="mt-1 text-sm text-green-600">✓ 사용 가능한 아이디입니다</p>
              )}
            </div>

            {/* Email (Signup only) */}
            {!isLogin && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <div className="flex gap-2">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    className={`flex-1 px-4 py-3 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      emailError ? 'border-red-500' : 'border-gray-300'
                    }`}
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
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {sendingCode ? '전송중...' : '인증코드'}
                    </button>
                  )}
                </div>
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
                {!emailError && email && validateEmail(email) && !isEmailVerified && (
                  <p className="mt-1 text-sm text-green-600">✓ 올바른 이메일 형식입니다</p>
                )}
              </div>
            )}

            {/* Verification Code (Signup only, after sending code) */}
            {!isLogin && !isEmailVerified && successMessage.includes('전송') && (
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                  인증 코드
                </label>
                <div className="flex gap-2">
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="6자리 인증 코드 입력"
                    required
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={!verificationCode}
                    className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={!isLogin ? handlePasswordBlur : undefined}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 ${
                    passwordError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="비밀번호를 입력하세요"
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {!isLogin && passwordError && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
              {!isLogin && !passwordError && password && validatePassword(password) && (
                <p className="mt-1 text-sm text-green-600">✓ 안전한 비밀번호입니다</p>
              )}
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-500">최소 8자 이상 입력하세요</p>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={handleConfirmPasswordBlur}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 ${
                      confirmPasswordError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="mt-1 text-sm text-red-600">{confirmPasswordError}</p>
                )}
                {!confirmPasswordError && confirmPassword && password === confirmPassword && (
                  <p className="mt-1 text-sm text-green-600">✓ 비밀번호가 일치합니다</p>
                )}
              </div>
            )}

            {/* Remember Me (Login only) */}
            {isLogin && (
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                  로그인 상태 유지 (30일)
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!isLogin && !isEmailVerified)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
