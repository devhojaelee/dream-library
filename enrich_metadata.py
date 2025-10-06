#!/usr/bin/env python3
"""
책 메타데이터 보완 스크립트

Z-Library에서 가져오지 못한 책 표지와 설명을 Naver Books API를 통해 보완합니다.
"""

import os
import json
import requests
import time
import re
from pathlib import Path
from typing import Optional, Dict, Tuple
from io import BytesIO
from PIL import Image
from difflib import SequenceMatcher
from datetime import datetime
from dotenv import load_dotenv

# 환경변수 로드 (파일이 있으면 로드, 없으면 환경 변수에서 읽음)
env_path = 'web/.env'
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()  # 기본 .env 파일 또는 환경 변수

NAVER_CLIENT_ID = os.getenv('NAVER_CLIENT_ID')
NAVER_CLIENT_SECRET = os.getenv('NAVER_CLIENT_SECRET')

# 경로 설정
BOOKS_DIR = Path("books")
METADATA_DIR = BOOKS_DIR / "metadata"
COVERS_DIR = BOOKS_DIR / "covers"

# Naver Books API 설정
NAVER_BOOKS_API = "https://openapi.naver.com/v1/search/book.json"

# 해상도 임계값 (이보다 작으면 스킵)
MIN_COVER_WIDTH = 200

# 제목 유사도 임계값 (이보다 낮으면 다른 책으로 판단)
MIN_TITLE_SIMILARITY = 0.6

class MetadataEnricher:
    def __init__(self):
        self.updated_count = 0
        self.failed_count = 0
        self.skipped_count = 0

        # API 키 검증
        if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
            raise ValueError("Naver API 키가 설정되지 않았습니다. web/.env 파일에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET를 설정해주세요.")

    def clean_title(self, title: str) -> str:
        """제목 정제: 괄호, 대괄호 내용 제거"""
        # (개정판) 제거
        cleaned = re.sub(r'\([^)]*\)', '', title)

        # [휴고상 수상작] 제거
        cleaned = re.sub(r'\[[^\]]*\]', '', cleaned)

        # 연속된 공백을 하나로
        cleaned = re.sub(r'\s+', ' ', cleaned)

        return cleaned.strip()

    def clean_html_tags(self, text: str) -> str:
        """HTML 태그 및 엔티티 제거"""
        if not text:
            return ""

        # HTML 태그 제거
        cleaned = re.sub(r'<[^>]*>', '', text)

        # HTML 엔티티 변환
        cleaned = cleaned.replace('&lt;', '<')
        cleaned = cleaned.replace('&gt;', '>')
        cleaned = cleaned.replace('&amp;', '&')
        cleaned = cleaned.replace('&quot;', '"')
        cleaned = cleaned.replace('&#39;', "'")

        # 연속된 줄바꿈을 2개로 정규화 (문단 구분)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

        return cleaned.strip()

    def clean_title_for_comparison(self, title: str) -> str:
        """비교용 제목 정제: 괄호/대괄호 이전 부분만 추출"""
        # 괄호 이전까지만 추출
        match = re.match(r'^([^\(\[]+)', title)
        if match:
            cleaned = match.group(1).strip()
        else:
            cleaned = title

        # 소문자 변환 및 공백 정규화
        cleaned = re.sub(r'\s+', ' ', cleaned.lower().strip())
        return cleaned

    def calculate_title_similarity(self, title1: str, title2: str) -> float:
        """두 제목의 유사도 계산 (0.0 ~ 1.0)"""
        # 괄호 이전 부분만 비교
        t1 = self.clean_title_for_comparison(title1)
        t2 = self.clean_title_for_comparison(title2)

        # SequenceMatcher를 사용한 유사도 계산
        return SequenceMatcher(None, t1, t2).ratio()

    def search_naver_books_api_single(self, query: str, original_title: str) -> Optional[Dict]:
        """Naver Books API로 단일 쿼리 검색 (제목 유사도 검증 포함)"""
        try:
            headers = {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
            }

            params = {
                'query': query,
                'display': 10,  # 최대 10개 결과
            }

            response = requests.get(NAVER_BOOKS_API, headers=headers, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()

                if 'items' in data and len(data['items']) > 0:
                    best_match = None
                    best_score = 0

                    for item in data['items']:
                        # HTML 태그 제거
                        clean_title = self.clean_html_tags(item.get('title', ''))
                        clean_description = self.clean_html_tags(item.get('description', ''))
                        clean_author = item.get('author', '').replace('^', ', ')

                        # 제목 유사도 검증
                        similarity = self.calculate_title_similarity(original_title, clean_title)

                        # 유사도가 너무 낮으면 스킵
                        if similarity < MIN_TITLE_SIMILARITY:
                            continue

                        # 완전성 점수 계산
                        completeness_score = 0
                        if clean_description:
                            completeness_score += 2
                        if item.get('image'):
                            completeness_score += 2
                        if clean_author:
                            completeness_score += 1
                        if item.get('pubdate'):
                            completeness_score += 1

                        # 종합 점수 = 완전성 + 유사도 보너스
                        total_score = completeness_score + (similarity * 3)

                        if total_score > best_score:
                            best_score = total_score
                            # 결과 정제해서 저장
                            best_match = {
                                'title': clean_title,
                                'author': clean_author,
                                'publisher': item.get('publisher', ''),
                                'pubdate': item.get('pubdate', ''),
                                'description': clean_description,
                                'image': item.get('image', ''),
                                'similarity': similarity
                            }

                    return best_match

            return None

        except Exception as e:
            print(f"  ⚠️  Naver Books API 오류: {e}")
            return None

    def search_naver_books_api(self, title: str, author: str = None) -> Optional[Dict]:
        """점진적 검색 전략으로 책 정보 검색"""
        print(f"  🔍 검색 전략 시작...")

        # 정제된 제목 준비
        cleaned_title = self.clean_title(title)

        # 검색 시도 순서
        search_attempts = []

        # 1차: 원본 제목 + 저자
        if author:
            query = f"{title} {author}"
            search_attempts.append(("원본+저자", query))

        # 2차: 정제된 제목 + 저자 (원본과 다를 때만)
        if author and cleaned_title != title:
            query = f"{cleaned_title} {author}"
            search_attempts.append(("정제+저자", query))

        # 3차: 정제된 제목만
        if cleaned_title != title:
            search_attempts.append(("정제", cleaned_title))

        # 4차: 원본 제목만
        search_attempts.append(("원본", title))

        # 순차적으로 시도
        for attempt_name, query in search_attempts:
            print(f"  📖 [{attempt_name}] '{query}' 검색 중...")
            result = self.search_naver_books_api_single(query, title)

            if result:
                result_title = result.get('title', '알 수 없음')
                similarity = result.get('similarity', 0)
                print(f"  ✅ 발견! '{result_title}' (유사도: {similarity:.2f})")
                return result
            else:
                print(f"  ❌ 결과 없음")

        return None

    def download_cover_image(self, image_url: str, filename: str) -> Optional[str]:
        """표지 이미지 다운로드"""
        try:
            # HTTP를 HTTPS로 변경
            if image_url.startswith('http://'):
                image_url = image_url.replace('http://', 'https://')

            response = requests.get(image_url, timeout=10)

            if response.status_code == 200 and len(response.content) > 1000:
                # 이미지 형식 감지 (magic number 확인)
                if response.content[:8].startswith(b'\x89PNG'):
                    ext = '.png'
                elif response.content[:3].startswith(b'\xff\xd8\xff'):
                    ext = '.jpg'
                else:
                    ext = '.jpg'  # 기본값

                cover_filename = f"{filename.replace('.epub', '')}{ext}"
                cover_path = COVERS_DIR / cover_filename

                with open(cover_path, 'wb') as f:
                    f.write(response.content)

                size_kb = len(response.content) // 1024
                print(f"  📐 이미지 크기: {size_kb}KB ({ext[1:].upper()})")
                return cover_filename
            else:
                print(f"  ⚠️  유효한 이미지를 찾을 수 없음")
                return None

        except Exception as e:
            print(f"  ⚠️  표지 다운로드 오류: {e}")
            return None

    def enrich_metadata(self, epub_filename: str) -> bool:
        """단일 책의 메타데이터 보완"""
        title = epub_filename.replace('.epub', '')
        metadata_path = METADATA_DIR / f"{title}.json"

        # 기존 메타데이터 읽기
        metadata = {}
        if metadata_path.exists():
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)

        # 이미 시도했으면 스킵
        if metadata.get('enrichment_attempted'):
            print(f"⏭️  {title[:50]}... - 이미 보완 시도함")
            self.skipped_count += 1
            return False

        # 이미 완전한 메타데이터가 있으면 스킵 (실제 파일 존재 확인)
        has_description = metadata.get('description') is not None

        cover_filename = metadata.get('cover')
        has_cover = False
        if cover_filename:
            cover_path = COVERS_DIR / cover_filename
            has_cover = cover_path.exists()  # 실제 파일 존재 확인

        if has_cover and has_description:
            print(f"⏭️  {title[:50]}... - 이미 완전한 메타데이터 존재")
            metadata['enrichment_attempted'] = True
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            self.skipped_count += 1
            return False

        print(f"🔍 {title[:50]}...")

        # 저자 정보 추출 (있으면 검색에 활용)
        author = metadata.get('author')

        # Naver Books API에서 검색
        book_info = self.search_naver_books_api(title, author)

        if not book_info:
            print(f"  ❌ 검색 결과 없음")
            # 실패해도 플래그 저장 (재시도 방지)
            metadata['enrichment_attempted'] = True
            METADATA_DIR.mkdir(parents=True, exist_ok=True)
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            self.failed_count += 1
            return False

        updated = False

        # 설명 보완
        if not has_description and book_info.get('description'):
            description = book_info['description']
            metadata['description'] = description
            print(f"  ✅ 설명 추가: {description[:50]}...")
            updated = True

        # 표지 보완
        if not has_cover and book_info.get('image'):
            image_url = book_info['image']

            cover_filename = self.download_cover_image(image_url, epub_filename)

            if cover_filename:
                metadata['cover'] = cover_filename
                # 타임스탬프 추가 (캐시 무효화용)
                metadata['cover_updated'] = str(int(time.time() * 1000))
                print(f"  ✅ 표지 다운로드: {cover_filename}")
                updated = True

        # 기타 메타데이터 보완
        if book_info.get('author') and not metadata.get('author'):
            metadata['author'] = book_info['author']
            print(f"  ✅ 저자 추가: {metadata['author']}")
            updated = True

        if book_info.get('pubdate') and not metadata.get('year'):
            # YYYYMMDD 형식에서 연도만 추출
            year = book_info['pubdate'][:4] if len(book_info['pubdate']) >= 4 else book_info['pubdate']
            metadata['year'] = year
            print(f"  ✅ 출판년도 추가: {year}")
            updated = True

        # 메타데이터 저장
        # 시도했음을 표시 (성공/실패 무관)
        metadata['enrichment_attempted'] = True

        if updated:
            METADATA_DIR.mkdir(parents=True, exist_ok=True)

            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)

            self.updated_count += 1
            print(f"  💾 메타데이터 저장 완료")
            return True
        else:
            print(f"  ⚠️  보완할 정보 없음")
            # 업데이트 없어도 플래그는 저장
            METADATA_DIR.mkdir(parents=True, exist_ok=True)
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            self.failed_count += 1
            return False

    def run(self):
        """모든 EPUB 파일의 메타데이터 보완"""
        start_time = datetime.now()
        print("\n" + "=" * 60)
        print("📚 Dream Library 메타데이터 보완 시작")
        print(f"🕐 실행 시간: {start_time.strftime('%Y-%m-%d %H:%M:%S %Z')}")
        print("=" * 60)

        # covers 디렉토리 생성
        COVERS_DIR.mkdir(parents=True, exist_ok=True)

        # Check for download_status.json to get list of newly downloaded files
        status_path = BOOKS_DIR / "download_status.json"
        target_titles = None

        if status_path.exists():
            try:
                with open(status_path, 'r', encoding='utf-8') as f:
                    status_data = json.load(f)
                    if 'downloadedFiles' in status_data:
                        # Empty list is valid - means 0 new downloads
                        target_titles = set(status_data['downloadedFiles'])
                        print(f"📋 Processing {len(target_titles)} newly downloaded files from download_status.json")
                        print("=" * 60)
            except Exception as e:
                print(f"⚠️  Could not read download_status.json: {e}")
                print("  → Processing all files instead")

        # EPUB 파일 목록 가져오기
        all_epub_files = list(BOOKS_DIR.glob("*.epub"))

        if not all_epub_files:
            print("❌ EPUB 파일이 없습니다.")
            return

        # Filter to only newly downloaded files if we have the list
        if target_titles is not None:
            # We have download_status.json with downloadedFiles
            if len(target_titles) == 0:
                # Empty list = no new downloads, skip processing
                print("⏭️  No new files to process (downloadedFiles is empty), skipping enrichment")
                return

            epub_files = [f for f in all_epub_files if f.stem in target_titles]
            print(f"🎯 Found {len(epub_files)} matching files out of {len(all_epub_files)} total")
            if len(epub_files) == 0:
                print("⚠️  No matching files found - all may have been already processed")
                return
        else:
            # No download_status.json, process all files (fallback)
            epub_files = all_epub_files
            print(f"📚 Processing all {len(epub_files)} files (no download list found)")

        print(f"\n총 {len(epub_files)}개의 책을 처리합니다.\n")

        for i, epub_path in enumerate(epub_files, 1):
            print(f"\n[{i}/{len(epub_files)}] ", end="")
            self.enrich_metadata(epub_path.name)

            # API 호출 제한 고려 (1초 대기)
            if i < len(epub_files):
                time.sleep(1)

        # 결과 요약
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        print("\n" + "=" * 60)
        print("📊 처리 결과")
        print("=" * 60)
        print(f"🕐 시작 시간: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🕐 종료 시간: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"⏱️  소요 시간: {duration:.1f}초")
        print(f"✅ 업데이트됨: {self.updated_count}개")
        print(f"⏭️  스킵됨: {self.skipped_count}개")
        print(f"❌ 실패: {self.failed_count}개")
        print("=" * 60)

if __name__ == "__main__":
    enricher = MetadataEnricher()
    enricher.run()
