#!/usr/bin/env python3
"""
책 메타데이터 보완 스크립트

Z-Library에서 가져오지 못한 책 표지와 설명을 Google Books API를 통해 보완합니다.
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

# 경로 설정
BOOKS_DIR = Path("books")
METADATA_DIR = BOOKS_DIR / "metadata"
COVERS_DIR = BOOKS_DIR / "covers"

# Google Books API 설정
GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes"

# 해상도 임계값 (이보다 작으면 서점에서 더 좋은 이미지 검색)
MIN_COVER_WIDTH = 200

# 제목 유사도 임계값 (이보다 낮으면 다른 책으로 판단)
MIN_TITLE_SIMILARITY = 0.6

class MetadataEnricher:
    def __init__(self):
        self.updated_count = 0
        self.failed_count = 0
        self.skipped_count = 0

    def clean_title(self, title: str) -> str:
        """제목 정제: 괄호, 대괄호 내용 제거 (숫자는 유지)"""
        # (개정판) 제거
        cleaned = re.sub(r'\([^)]*\)', '', title)

        # [휴고상 수상작] 제거
        cleaned = re.sub(r'\[[^\]]*\]', '', cleaned)

        # 연속된 공백을 하나로
        cleaned = re.sub(r'\s+', ' ', cleaned)

        return cleaned.strip()

    def calculate_title_similarity(self, title1: str, title2: str) -> float:
        """두 제목의 유사도 계산 (0.0 ~ 1.0)"""
        # 소문자 변환 및 공백 정규화
        t1 = re.sub(r'\s+', ' ', title1.lower().strip())
        t2 = re.sub(r'\s+', ' ', title2.lower().strip())

        # SequenceMatcher를 사용한 유사도 계산
        return SequenceMatcher(None, t1, t2).ratio()

    def search_google_books_single(self, query: str, original_title: str) -> Optional[Dict]:
        """Google Books API로 단일 쿼리 검색 (제목 유사도 검증 포함)"""
        try:
            params = {
                'q': query,
                'maxResults': 5,
                'langRestrict': 'ko'  # 한국어 우선
            }

            response = requests.get(GOOGLE_BOOKS_API, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()

                if 'items' in data and len(data['items']) > 0:
                    best_match = None
                    best_score = 0

                    for item in data['items']:
                        volume_info = item.get('volumeInfo', {})

                        # 제목 유사도 검증
                        result_title = volume_info.get('title', '')
                        similarity = self.calculate_title_similarity(original_title, result_title)

                        # 유사도가 너무 낮으면 스킵
                        if similarity < MIN_TITLE_SIMILARITY:
                            continue

                        # 완전성 점수 계산
                        completeness_score = 0
                        if volume_info.get('description'):
                            completeness_score += 2
                        if volume_info.get('imageLinks'):
                            completeness_score += 2
                        if volume_info.get('authors'):
                            completeness_score += 1
                        if volume_info.get('publishedDate'):
                            completeness_score += 1

                        # 종합 점수 = 완전성 + 유사도 보너스
                        total_score = completeness_score + (similarity * 3)

                        if total_score > best_score:
                            best_score = total_score
                            best_match = item

                    return best_match

            return None

        except Exception as e:
            print(f"  ⚠️  Google Books API 오류: {e}")
            return None

    def search_google_books(self, title: str, author: str = None) -> Optional[Dict]:
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
            result = self.search_google_books_single(query, title)

            if result:
                volume_info = result.get('volumeInfo', {})
                result_title = volume_info.get('title', '알 수 없음')
                similarity = self.calculate_title_similarity(title, result_title)
                print(f"  ✅ 발견! '{result_title}' (유사도: {similarity:.2f})")
                return result
            else:
                print(f"  ❌ 결과 없음")

        return None

    def download_cover_image(self, image_url: str, filename: str) -> Optional[str]:
        """표지 이미지 다운로드 (가장 큰 유효한 이미지 선택, 올바른 확장자 사용)"""
        try:
            # HTTP를 HTTPS로 변경 (Google Books는 HTTPS 지원)
            if image_url.startswith('http://'):
                image_url = image_url.replace('http://', 'https://')

            # 모든 zoom 레벨 시도하고 가장 큰 이미지 선택
            best_image = None
            best_size = 0
            best_zoom = None

            for zoom_level in [1, 2, 3]:
                try_url = image_url.replace('zoom=1', f'zoom={zoom_level}')

                response = requests.get(try_url, timeout=10)

                if response.status_code == 200 and len(response.content) > 1000:
                    # 1KB 이상의 이미지만 유효하다고 판단
                    size = len(response.content)
                    if size > best_size:
                        best_size = size
                        best_image = response.content
                        best_zoom = zoom_level

            if best_image:
                # 이미지 형식 감지 (magic number 확인)
                if best_image[:8].startswith(b'\x89PNG'):
                    ext = '.png'
                elif best_image[:3].startswith(b'\xff\xd8\xff'):
                    ext = '.jpg'
                else:
                    ext = '.jpg'  # 기본값

                cover_filename = f"{filename.replace('.epub', '')}{ext}"
                cover_path = COVERS_DIR / cover_filename

                with open(cover_path, 'wb') as f:
                    f.write(best_image)

                print(f"  📐 이미지 크기: {best_size // 1024}KB (zoom={best_zoom}, {ext[1:].upper()})")
                return cover_filename
            else:
                print(f"  ⚠️  유효한 이미지를 찾을 수 없음")
                return None

        except Exception as e:
            print(f"  ⚠️  표지 다운로드 오류: {e}")
            return None

    def get_image_dimensions(self, image_data: bytes) -> Tuple[int, int]:
        """이미지 데이터에서 가로x세로 크기 추출"""
        try:
            img = Image.open(BytesIO(image_data))
            return img.size  # (width, height)
        except Exception as e:
            print(f"  ⚠️  이미지 크기 확인 오류: {e}")
            return (0, 0)

    def search_naver_books(self, title: str, author: str = None) -> Optional[str]:
        """네이버 책 검색에서 표지 이미지 URL 검색"""
        try:
            # 네이버 책 검색 (크롤링)
            from bs4 import BeautifulSoup

            search_query = f"{title} {author}" if author else title
            response = requests.get(
                'https://search.naver.com/search.naver',
                params={'where': 'book', 'sm': 'tab_jum', 'query': search_query},
                timeout=10,
                headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
            )

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                # 첫 번째 책 표지 이미지 찾기 (업데이트된 선택자)
                img = soup.select_one('img.thumb')
                if img:
                    img_url = img.get('src') or img.get('data-src')
                    if img_url and img_url.startswith('http'):
                        # 고해상도 버전으로 변경 (type=w216 → type=w600)
                        if 'type=w216' in img_url:
                            img_url = img_url.replace('type=w216', 'type=w600')
                        return img_url

            return None
        except Exception as e:
            print(f"  ⚠️  네이버 검색 오류: {e}")
            return None


    def upgrade_low_resolution_cover(self, title: str, author: str, current_cover_path: Path) -> bool:
        """해상도가 낮은 표지를 한국 서점에서 더 좋은 이미지로 교체"""
        try:
            # 현재 이미지 크기 확인
            with open(current_cover_path, 'rb') as f:
                current_data = f.read()

            width, height = self.get_image_dimensions(current_data)

            if width >= MIN_COVER_WIDTH:
                return False  # 해상도가 충분함

            print(f"  🔍 해상도가 낮음 ({width}x{height}), 더 좋은 이미지 검색 중...")

            # 네이버 책 검색에서 고해상도 이미지 찾기
            bookstore_sources = [
                ('네이버', self.search_naver_books),
            ]

            for store_name, search_func in bookstore_sources:
                img_url = search_func(title, author)

                if img_url:
                    # URL 스킴 수정 (//로 시작하는 경우 https: 추가)
                    if img_url.startswith('//'):
                        img_url = 'https:' + img_url

                    # 이미지 다운로드
                    img_response = requests.get(img_url, timeout=10)

                    if img_response.status_code == 200 and len(img_response.content) > 1000:
                        new_width, new_height = self.get_image_dimensions(img_response.content)

                        # 더 큰 이미지인지 확인
                        if new_width > width:
                            # 파일 형식 감지
                            if img_response.content[:8].startswith(b'\x89PNG'):
                                ext = '.png'
                            elif img_response.content[:3].startswith(b'\xff\xd8\xff'):
                                ext = '.jpg'
                            else:
                                ext = '.jpg'

                            # 기존 파일 삭제
                            current_cover_path.unlink()

                            # 새 파일 저장
                            new_path = current_cover_path.parent / f"{title}{ext}"
                            with open(new_path, 'wb') as f:
                                f.write(img_response.content)

                            print(f"  ✨ {store_name}에서 고해상도 이미지 다운로드: {new_width}x{new_height} ({len(img_response.content) // 1024}KB)")
                            return True

            print(f"  ⚠️  더 좋은 이미지를 찾지 못함")
            return False

        except Exception as e:
            print(f"  ⚠️  이미지 업그레이드 오류: {e}")
            return False

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

        # Google Books에서 검색
        book_info = self.search_google_books(title, author)

        if not book_info:
            print(f"  ❌ 검색 결과 없음")
            # 실패해도 플래그 저장 (재시도 방지)
            metadata['enrichment_attempted'] = True
            METADATA_DIR.mkdir(parents=True, exist_ok=True)
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
            self.failed_count += 1
            return False

        volume_info = book_info.get('volumeInfo', {})
        updated = False

        # 설명 보완
        if not has_description and 'description' in volume_info:
            description = volume_info['description']
            metadata['description'] = description
            print(f"  ✅ 설명 추가: {description[:50]}...")
            updated = True

        # 표지 보완
        if not has_cover and 'imageLinks' in volume_info:
            image_links = volume_info['imageLinks']
            # thumbnail 또는 smallThumbnail 사용
            image_url = image_links.get('thumbnail') or image_links.get('smallThumbnail')

            if image_url:
                cover_filename = self.download_cover_image(image_url, epub_filename)

                if cover_filename:
                    metadata['cover'] = cover_filename
                    print(f"  ✅ 표지 다운로드: {cover_filename}")
                    updated = True

                    # 해상도 체크 및 업그레이드
                    cover_path = COVERS_DIR / cover_filename
                    author = metadata.get('author', '')
                    if self.upgrade_low_resolution_cover(title, author, cover_path):
                        # 파일명이 변경되었을 수 있으므로 메타데이터 업데이트
                        new_cover_filename = None
                        for ext in ['.jpg', '.png']:
                            possible_path = COVERS_DIR / f"{title}{ext}"
                            if possible_path.exists():
                                new_cover_filename = f"{title}{ext}"
                                break
                        if new_cover_filename and new_cover_filename != cover_filename:
                            metadata['cover'] = new_cover_filename

        # 기타 메타데이터 보완
        if 'authors' in volume_info and not metadata.get('author'):
            metadata['author'] = ', '.join(volume_info['authors'])
            print(f"  ✅ 저자 추가: {metadata['author']}")
            updated = True

        if 'publishedDate' in volume_info and not metadata.get('year'):
            # YYYY-MM-DD 형식에서 연도만 추출
            year = volume_info['publishedDate'].split('-')[0]
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

        # EPUB 파일 목록 가져오기
        epub_files = list(BOOKS_DIR.glob("*.epub"))

        if not epub_files:
            print("❌ EPUB 파일이 없습니다.")
            return

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
