# Z-Library Korean Book Downloader

Z-Library의 "Personally Recommended" 섹션에서 한국어 책을 자동으로 다운로드하는 스크립트입니다.

## 기능

✅ **자동 로그인** - Z-Library 계정 자동 로그인
✅ **한국어 필터링** - 한글 문자가 포함된 책만 다운로드
✅ **카테고리 제외** - 주식/금융, 철학, 예술 관련 책 자동 제외
✅ **다운로드 한도** - 최대 999개까지 다운로드 가능
✅ **진행 상황 저장** - JSON 로그 파일로 진행 상황 추적
✅ **자동 폴더 생성** - `./books/` 폴더에 책 자동 저장

## 설치

```bash
# 가상환경 활성화
source venv/bin/activate

# 이미 설치되어 있지 않다면:
pip install playwright
playwright install chromium
```

## 사용 방법

```bash
# 가상환경 활성화
source venv/bin/activate

# 스크립트 실행
python final_downloader.py
```

## 실행 과정

1. 브라우저가 자동으로 열립니다
2. Z-Library에 로그인합니다
3. "Personally Recommended" 섹션을 찾습니다
4. 한국어 책을 필터링합니다
5. 제외 카테고리를 체크합니다
6. 책을 하나씩 다운로드합니다
7. 진행 상황을 로그 파일에 저장합니다

## 출력 파일

### 다운로드한 책
- **위치**: `./books/` 디렉토리
- 다운로드한 모든 책이 이 폴더에 저장됩니다

### 로그 파일
- **형식**: `download_log_YYYYMMDD_HHMMSS.json`
- **내용**:
  ```json
  {
    "downloaded_count": 10,
    "downloaded_books": [
      {
        "title": "책 제목",
        "author": "저자",
        "url": "책 URL",
        "timestamp": "2025-10-01T02:30:00"
      }
    ],
    "failed_books": [
      {
        "title": "실패한 책",
        "reason": "에러 이유",
        "url": "책 URL"
      }
    ],
    "skipped_books": [
      {
        "title": "제외된 책",
        "reason": "excluded_category_finance"
      }
    ]
  }
  ```

## 필터링 규칙

### 포함 (다운로드)
- 한국어 책 (한글 문자 포함)

### 제외 (다운로드 안 함)
- **주식/금융**: 주식, 금융, 투자, 재테크, 경제학, 증권, 자본가, 자본 등
- **철학**: 철학, philosophy, 형이상학, 존재론 등
- **예술**: 예술, 미술, art, 회화, 조각, 설치미술 등

## 디렉토리 구조

```
dream-library/
├── final_downloader.py    # 메인 스크립트
├── task.md                # 작업 계획 문서
├── README.md              # 이 파일
├── books/                 # 다운로드한 책 (자동 생성)
├── screenshots/           # 개발 중 생성된 스크린샷
├── test_scripts/          # 개발/테스트용 스크립트
└── venv/                  # Python 가상환경
```

## 주의사항

1. **다운로드 한도**: 하루 999개 제한이 있습니다
2. **네트워크**: 안정적인 인터넷 연결 필요
3. **브라우저**: 실행 중 브라우저 창이 열립니다
4. **중단 시**: Ctrl+C로 중단 가능, 진행 상황은 로그에 저장됩니다

## 문제 해결

### 로그인 실패
- 계정 정보 확인
- 네트워크 연결 확인

### 다운로드 버튼을 찾을 수 없음
- 사이트 구조가 변경되었을 수 있습니다
- 책이 다운로드 불가능한 상태일 수 있습니다

### 타임아웃 에러
- 네트워크 속도 확인
- 스크립트의 `timeout` 값 증가

## 라이선스

개인 사용 목적으로만 사용하세요. dream-library의 이용 약관을 준수해야 합니다.
