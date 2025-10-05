'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function EinkMyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (!data.user) {
          router.push('/eink/auth');
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/eink/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="eink-mode" style={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          color: '#000000',
          fontSize: '20px',
          fontWeight: 600
        }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const navItems = [
    { href: '/eink/mypage/password', label: '비밀번호 변경', icon: '🔒' },
    { href: '/eink/mypage/activity', label: '독서 활동', icon: '📊' },
  ];

  return (
    <div className="eink-mode" style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: '#000000'
    }}>
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '2px solid #000000',
        padding: '16px'
      }}>
        {/* Mobile: Stack layout, Desktop: Horizontal layout */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }} className="md:flex-row md:items-center md:justify-between md:gap-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#000000',
              border: '2px solid #000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '20px',
              fontWeight: 700
            }}>
              M
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 700,
              margin: 0
            }}>
              마이페이지
            </h1>
          </div>
          <Link
            href="/eink"
            className="eink-button"
            style={{ textDecoration: 'none', display: 'flex', justifyContent: 'flex-end' }}
          >
            홈
          </Link>
        </div>

        {/* Mobile: Horizontal scroll navigation */}
        <nav className="md:hidden" style={{ marginTop: '12px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={isActive ? 'eink-button-primary' : 'eink-button'}
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '16px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Sidebar - Desktop only */}
        <aside className="hidden md:block" style={{
          width: '200px',
          background: '#ffffff',
          borderRight: '2px solid #000000',
          minHeight: 'calc(100vh - 89px)'
        }}>
          <nav style={{ padding: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={isActive ? 'eink-button-primary' : 'eink-button'}
                    style={{
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '16px'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1,
          padding: '16px'
        }}>
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
