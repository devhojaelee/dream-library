import nodemailer from 'nodemailer';

// 네이버 SMTP 설정
const transporter = nodemailer.createTransport({
  host: 'smtp.naver.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// 인증 코드 전송
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: '"Dream Library" <hoje0711@naver.com>',
      to: email,
      subject: '[Dream Library] 이메일 인증 코드',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">Dream Library ✨</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            회원가입을 위한 인증 코드입니다.
          </p>
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #6B7280;">인증 코드</p>
            <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #1F2937; letter-spacing: 4px;">
              ${code}
            </p>
          </div>
          <p style="font-size: 14px; color: #6B7280;">
            이 코드는 5분간 유효합니다.<br>
            본인이 요청하지 않았다면 이 이메일을 무시하세요.
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}
