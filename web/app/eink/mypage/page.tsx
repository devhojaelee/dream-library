'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EinkMyPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/eink/mypage/password');
  }, [router]);

  return null;
}
