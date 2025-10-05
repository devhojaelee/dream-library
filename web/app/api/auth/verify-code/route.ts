import { NextRequest, NextResponse } from 'next/server';
import { verifyCode } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: '이메일과 인증 코드를 입력해주세요' }, { status: 400 });
    }

    const isValid = verifyCode(email, code);

    if (!isValid) {
      return NextResponse.json({ error: '인증 코드가 일치하지 않거나 만료되었습니다' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: '이메일 인증이 완료되었습니다' });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
