'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/mypage/password');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-gray-800 text-lg font-medium">리다이렉트 중...</div>
    </div>
  );
}
