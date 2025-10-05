import fs from 'fs';
import path from 'path';

const VERIFICATION_FILE = path.join(process.cwd(), 'data', 'verification_codes.json');
const CODE_EXPIRY_MS = 5 * 60 * 1000; // 5분

interface VerificationCode {
  email: string;
  code: string;
  createdAt: number;
}

// 인증 코드 데이터 읽기
function readVerificationCodes(): VerificationCode[] {
  try {
    if (!fs.existsSync(VERIFICATION_FILE)) {
      return [];
    }
    const data = fs.readFileSync(VERIFICATION_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 인증 코드 데이터 저장
function writeVerificationCodes(codes: VerificationCode[]) {
  const dir = path.dirname(VERIFICATION_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(VERIFICATION_FILE, JSON.stringify(codes, null, 2));
}

// 6자리 랜덤 숫자 코드 생성
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 인증 코드 저장
export function saveVerificationCode(email: string, code: string) {
  const codes = readVerificationCodes();

  // 기존 코드 제거 (같은 이메일)
  const filteredCodes = codes.filter(c => c.email !== email);

  // 새 코드 추가
  filteredCodes.push({
    email,
    code,
    createdAt: Date.now(),
  });

  writeVerificationCodes(filteredCodes);
}

// 인증 코드 검증
export function verifyCode(email: string, code: string): boolean {
  const codes = readVerificationCodes();
  const found = codes.find(c => c.email === email && c.code === code);

  if (!found) {
    return false;
  }

  // 만료 확인
  const isExpired = Date.now() - found.createdAt > CODE_EXPIRY_MS;
  if (isExpired) {
    // 만료된 코드 삭제
    const filteredCodes = codes.filter(c => c.email !== email);
    writeVerificationCodes(filteredCodes);
    return false;
  }

  // 인증 성공 시 코드 삭제
  const filteredCodes = codes.filter(c => c.email !== email);
  writeVerificationCodes(filteredCodes);

  return true;
}

// 만료된 코드 정리
export function cleanExpiredCodes() {
  const codes = readVerificationCodes();
  const now = Date.now();
  const validCodes = codes.filter(c => now - c.createdAt <= CODE_EXPIRY_MS);
  writeVerificationCodes(validCodes);
}
