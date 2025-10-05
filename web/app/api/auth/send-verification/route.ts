import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email';
import { generateVerificationCode, saveVerificationCode, cleanExpiredCodes } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해주세요' }, { status: 400 });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '올바른 이메일 형식이 아닙니다' }, { status: 400 });
    }

    // 만료된 코드 정리
    cleanExpiredCodes();

    // 인증 코드 생성
    const code = generateVerificationCode();

    // 인증 코드 저장
    saveVerificationCode(email, code);

    // 이메일 전송
    const sent = await sendVerificationEmail(email, code);

    if (!sent) {
      return NextResponse.json({ error: '이메일 전송에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '인증 코드가 전송되었습니다' });
  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
