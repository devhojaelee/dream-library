# 시놀로지 NAS Docker 배포 가이드

## 📋 사전 준비

### 1. 시놀로지 패키지 설치
- **Container Manager** (Docker) 설치
- **File Station** 또는 **SSH** 액세스 활성화

### 2. 로컬에서 빌드 및 테스트 (선택사항)
```bash
# 웹 서버만 실행
docker-compose up web

# 크롤러 포함 실행
docker-compose --profile crawler up
```

## 🚀 배포 단계

### Step 1: 파일 전송

#### SSH 사용 (추천)
```bash
# 시놀로지 NAS에 SSH 접속
ssh admin@your-nas-ip

# 프로젝트 디렉토리 생성
sudo mkdir -p /volume1/docker/dream-library
cd /volume1/docker/dream-library
```

#### 로컬에서 파일 전송
```bash
# rsync로 전체 프로젝트 전송
rsync -avz --exclude 'node_modules' \
           --exclude '.next' \
           --exclude 'venv' \
           --exclude '.git' \
           . admin@your-nas-ip:/volume1/docker/dream-library/
```

#### File Station 사용 (GUI)
1. File Station 열기
2. `docker` 폴더 생성 (없다면)
3. `dream-library` 폴더 생성
4. 다음 파일들 업로드:
   - `web/` 폴더 전체
   - `books/` 폴더 (기존 EPUB 포함)
   - `book_downloader.py`
   - `requirements.txt`
   - `docker-compose.yml`
   - `Dockerfile.crawler`
   - `.env.example`

### Step 2: 환경 변수 설정

```bash
# .env 파일 생성
cd /volume1/docker/dream-library
cp .env.example .env

# JWT 시크릿 생성 및 적용
openssl rand -base64 32
# 생성된 값을 .env 파일의 JWT_SECRET에 입력
nano .env
```

### Step 3: Container Manager에서 실행

#### 방법 1: Container Manager GUI
1. **Container Manager** 앱 열기
2. **프로젝트** 탭 → **생성** 클릭
3. 프로젝트 이름: `dream-library`
4. 경로: `/volume1/docker/dream-library`
5. 소스: `docker-compose.yml` 선택
6. **서비스 선택**:
   - ✅ `web` (웹 서버)
   - ☐ `crawler` (필요시만 체크)
7. **생성** 클릭

#### 방법 2: SSH 커맨드
```bash
# 웹 서버만 시작
cd /volume1/docker/dream-library
docker-compose up -d web

# 크롤러 포함 시작 (필요시)
docker-compose --profile crawler up -d
```

### Step 4: 포트 포워딩 설정

1. **제어판** → **외부 액세스** → **라우터 구성**
2. **포트 포워딩 규칙 생성**:
   - 외부 포트: `3000` (또는 원하는 포트)
   - 내부 포트: `3000`
   - 내부 IP: 시놀로지 NAS IP
   - 프로토콜: TCP

### Step 5: 접속 확인

```bash
# 로컬 네트워크에서
http://nas-ip:3000

# 외부에서 (포트포워딩 설정 시)
http://your-public-ip:3000
```

## 🔧 크롤러 실행

### 수동 실행
```bash
# SSH로 접속 후
cd /volume1/docker/dream-library
docker-compose run --rm crawler
```

### 자동 실행 (Cron - 선택사항)
1. **제어판** → **작업 스케줄러**
2. **생성** → **예약된 작업** → **사용자 정의 스크립트**
3. 설정:
   - 작업명: `Dream Library Crawler`
   - 사용자: `root`
   - 일정: 원하는 주기 (예: 매일 새벽 3시)
   - 스크립트:
   ```bash
   cd /volume1/docker/dream-library
   docker-compose run --rm crawler
   ```

## 📊 모니터링

### 로그 확인
```bash
# 웹 서버 로그
docker-compose logs -f web

# 크롤러 로그
docker-compose logs crawler
```

### 컨테이너 상태 확인
```bash
docker-compose ps
```

### 재시작
```bash
# 웹 서버 재시작
docker-compose restart web

# 전체 재빌드
docker-compose up -d --build
```

## 🔒 보안 권장사항

1. **HTTPS 설정** (Reverse Proxy 사용)
   - 시놀로지 내장 Reverse Proxy 활용
   - Let's Encrypt 인증서 자동 갱신

2. **방화벽 규칙**
   - 필요한 포트만 개방
   - IP 화이트리스트 설정 고려

3. **정기 업데이트**
   ```bash
   cd /volume1/docker/dream-library
   git pull  # 소스 업데이트
   docker-compose down
   docker-compose up -d --build
   ```

## 🗂️ 디렉토리 구조

```
/volume1/docker/dream-library/
├── web/                      # Next.js 앱
│   ├── app/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── books/                    # EPUB 저장소 (볼륨)
│   ├── *.epub
│   ├── covers/
│   └── metadata/
├── book_downloader.py        # 크롤러 스크립트
├── requirements.txt
├── docker-compose.yml
├── Dockerfile.crawler
└── .env
```

## 🆘 문제 해결

### 웹 서버가 시작되지 않음
```bash
# 로그 확인
docker-compose logs web

# 포트 충돌 확인
netstat -tulpn | grep 3000

# 재빌드
docker-compose up -d --build web
```

### 크롤러 실행 오류
```bash
# Playwright 브라우저 설치 확인
docker-compose run --rm crawler playwright install chromium

# 권한 문제
sudo chmod -R 755 /volume1/docker/dream-library/books
```

### books 폴더 접근 안됨
```bash
# 권한 수정
sudo chown -R 1000:1000 /volume1/docker/dream-library/books
```

## 🔄 업데이트

### 코드 업데이트
```bash
cd /volume1/docker/dream-library
# 파일 전송 (rsync 또는 File Station)
docker-compose down
docker-compose up -d --build
```

### 컨테이너 이미지 업데이트
```bash
docker-compose pull
docker-compose up -d
```

## 📱 외부 접속 (DDNS + HTTPS)

1. **DDNS 설정**: 시놀로지 DDNS 서비스 활용
2. **Let's Encrypt 인증서**: 제어판 → 보안 → 인증서
3. **Reverse Proxy**:
   - 제어판 → 로그인 포털 → 고급 → Reverse Proxy
   - 소스: `library.your-ddns.synology.me`
   - 대상: `localhost:3000`

## 💡 팁

- **백업**: Task Scheduler로 `books/` 폴더 정기 백업 설정
- **성능**: SSD 캐시 활용 고려
- **접근성**: VPN 서버 구축으로 안전한 원격 접속
