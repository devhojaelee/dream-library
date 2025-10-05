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
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
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
              fontWeight: 700,
              marginRight: '12px'
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
            style={{
              textDecoration: 'none',
              display: 'inline-block',
              color: '#000000',
              background: '#ffffff',
              border: '2px solid #333333',
              minHeight: '48px',
              minWidth: '48px',
              fontSize: '16px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 500,
              alignSelf: 'flex-end',
              boxSizing: 'border-box'
            }}
          >
            홈
          </Link>
        </div>

        {/* Mobile: Horizontal scroll navigation */}
        <nav style={{ marginTop: '12px', overflowX: 'auto' }}>
          <div style={{ display: 'flex' }}>
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '16px',
                    whiteSpace: 'nowrap',
                    background: isActive ? '#000000' : '#ffffff',
                    color: isActive ? '#ffffff' : '#000000',
                    border: isActive ? '2px solid #000000' : '2px solid #333333',
                    minHeight: '48px',
                    minWidth: '48px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    marginRight: index < navItems.length - 1 ? '8px' : '0'
                  }}
                >
                  <span style={{ fontSize: '20px', marginRight: '8px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Sidebar - Hidden on mobile, removed completely */}

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
