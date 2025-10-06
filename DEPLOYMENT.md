# Dream Library Deployment Guide

## 프로젝트 구조

Dream Library는 독립적으로 관리 가능한 두 개의 폴더로 구성됩니다:

```
/dream-library
├── web/
│   ├── docker-compose.yml  # Web 서비스
│   ├── Dockerfile
│   ├── app/
│   └── data/
├── crawler/
│   ├── docker-compose.yml  # Crawler 서비스
│   ├── Dockerfile.crawler
│   ├── Dockerfile.enricher
│   ├── Dockerfile.enricher-watcher
│   ├── book_downloader.py
│   └── enrich_metadata.py
├── books/  # 공유 볼륨
├── .env
└── DEPLOYMENT.md
```

### 1. Web 서비스 (`web/`)
- **web**: Next.js 웹 애플리케이션
- **backup-cron**: 사용자 데이터 자동 백업

**용도**: 개발 중 자주 재시작, 웹 기능 업데이트

### 2. Crawler 서비스 (`crawler/`)
- **crawler**: Z-Library 자동 다운로드
- **enricher-watcher**: 메타데이터 자동 보강 감지
- **enricher**: 수동 메타데이터 보강 (profile)

**용도**: 한 번 시작하면 계속 실행, 책 다운로드 담당

---

## 시놀로지 NAS 배포

### 초기 설정 (한 번만)

1. **프로젝트 업로드**
   ```bash
   # 시놀로지 NAS에 SSH 접속
   ssh admin@nas-ip

   # 프로젝트 업로드 (로컬에서)
   scp -r dream-library admin@nas-ip:/volume1/docker/
   ```

2. **환경 변수 설정**
   ```bash
   cd /volume1/docker/dream-library

   # .env 파일 생성
   cat > .env << 'EOF'
   ZLIBRARY_EMAIL=your-email@example.com
   ZLIBRARY_PASSWORD=your-password
   CONTAINER_UID=1001
   CONTAINER_GID=1001
   EMAIL_USER=hoje0711@naver.com
   EMAIL_PASSWORD=DSENDBPW412N
   JWT_SECRET=your-secret-key-change-in-production
   EOF
   ```

3. **Crawler 서비스 시작 (한 번만)**
   ```bash
   cd crawler
   docker-compose up -d
   cd ..
   ```
   - 이제 Crawler는 계속 실행됩니다
   - 서버 재부팅해도 자동으로 시작됩니다

4. **Web 서비스 시작**
   ```bash
   cd web
   docker-compose up -d
   cd ..
   ```

---

## 개발 시 사용법

### Web만 재시작 (개발 중)
```bash
cd web

# Web 서비스 중지
docker-compose down

# 코드 수정 후 다시 시작
docker-compose up -d

# Crawler는 영향받지 않고 계속 실행됨 ✅
```

### Web만 재빌드
```bash
cd web
docker-compose build
docker-compose up -d
```

### Crawler 재시작 (필요한 경우만)
```bash
cd crawler
docker-compose restart
```

### 로그 확인
```bash
# Web 로그
cd web && docker-compose logs -f web

# Crawler 로그
cd crawler && docker-compose logs -f crawler

# Enricher Watcher 로그
cd crawler && docker-compose logs -f enricher-watcher
```

---

## 수동 메타데이터 보강

```bash
cd crawler
docker-compose --profile enricher up enricher
```

---

## 전체 중지

```bash
# Web 서비스 중지
cd web && docker-compose down

# Crawler 서비스 중지
cd crawler && docker-compose down
```

---

## 공유 데이터

두 서비스는 루트의 `books/` 디렉토리를 공유합니다:
- **Crawler**: 책 다운로드, 메타데이터 생성, `download_status.json` 생성
- **Web**: 책 목록 표시, 다운로드 제공, `download_status.json` 읽기

---

## 트러블슈팅

### Web은 재시작되는데 Crawler도 같이 재시작됨
→ 올바른 폴더에서 실행했는지 확인:
```bash
cd web
docker-compose restart  # Web만 재시작
```

### Books 디렉토리 권한 오류
```bash
# 시놀로지에서
sudo chown -R 1001:1001 /volume1/docker/dream-library/books
```

### 포트 충돌
```bash
# 기존 컨테이너 확인
docker ps -a | grep dream-library

# 중복 컨테이너 삭제
docker rm -f dream-library-web dream-library-crawler
```
