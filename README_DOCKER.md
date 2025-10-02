# Docker 사용 가이드

## 서비스 구성

Dream Library는 4개의 Docker 컨테이너로 구성됩니다:

1. **web** - Next.js 웹 애플리케이션 (항상 실행)
2. **enricher-cron** - 메타데이터 자동 보강 (매일 00시, 항상 실행)
3. **crawler** - Z-Library 크롤러 (필요시 실행)
4. **enricher** - 메타데이터 보강 스크립트 (수동 실행용)

## 기본 사용법

### 웹 서버 + 자동 메타데이터 보강 실행
```bash
docker-compose up -d
```
웹 서버와 함께 매일 00시에 자동으로 메타데이터를 보강하는 서비스가 실행됩니다.

### 크롤러 실행 (책 다운로드)
```bash
docker-compose --profile crawler up crawler
```

### 메타데이터 즉시 보강 (수동)
```bash
docker-compose --profile enricher up enricher
```

### 모든 서비스 중지
```bash
docker-compose down
```

## 시놀로지 NAS 배포

### 1. 파일 업로드
시놀로지에 프로젝트 전체를 업로드합니다:
```
/volume1/docker/dream-library/
```

### 2. SSH 접속
```bash
ssh admin@your-nas-ip
```

### 3. 프로젝트 디렉토리로 이동
```bash
cd /volume1/docker/dream-library
```

### 4. 웹 서버 실행
```bash
docker-compose up -d
```

### 5. 메타데이터 보강 (필요시)
```bash
docker-compose --profile enricher up enricher
```

## 주요 명령어

### 로그 확인
```bash
# 웹 서버 로그
docker-compose logs -f web

# 자동 메타데이터 보강 로그 (cron)
docker-compose logs -f enricher-cron

# 수동 메타데이터 보강 로그
docker-compose logs -f enricher

# 크롤러 로그
docker-compose logs -f crawler
```

### 컨테이너 재빌드
```bash
# 특정 서비스만 재빌드
docker-compose build enricher

# 모든 서비스 재빌드
docker-compose build
```

### 컨테이너 상태 확인
```bash
docker-compose ps
```

## 데이터 경로

- **책 파일**: `./books/*.epub`
- **메타데이터**: `./books/metadata/*.json`
- **표지 이미지**: `./books/covers/*.jpg|png`
- **사용자 데이터**: `./web/data/downloads.json`

## 문제 해결

### 메타데이터 보강이 실행되지 않음
```bash
# 컨테이너 재빌드
docker-compose build enricher

# 강제 재실행
docker-compose --profile enricher up --force-recreate enricher
```

### 권한 문제
```bash
# books 디렉토리 권한 확인
ls -la books/

# 필요시 권한 수정
chmod -R 755 books/
```

### 로그에서 오류 확인
```bash
docker-compose logs enricher
```
