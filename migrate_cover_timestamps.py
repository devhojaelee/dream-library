#!/usr/bin/env python3
"""
일회성 마이그레이션 스크립트: 기존 메타데이터에 cover_updated 타임스탬프 추가
"""

import os
import json
import time

def migrate_cover_timestamps():
    metadata_dir = os.path.join(os.path.dirname(__file__), 'books', 'metadata')

    if not os.path.exists(metadata_dir):
        print(f"❌ 메타데이터 디렉토리를 찾을 수 없습니다: {metadata_dir}")
        return

    updated_count = 0
    skipped_count = 0
    error_count = 0

    # 현재 타임스탬프
    timestamp = str(int(time.time() * 1000))

    print(f"📁 메타데이터 디렉토리: {metadata_dir}")
    print(f"⏰ 타임스탬프: {timestamp}\n")

    # 모든 .json 파일 순회
    for filename in os.listdir(metadata_dir):
        if not filename.endswith('.json'):
            continue

        filepath = os.path.join(metadata_dir, filename)

        try:
            # 메타데이터 읽기
            with open(filepath, 'r', encoding='utf-8') as f:
                metadata = json.load(f)

            # cover 있고 cover_updated 없으면 추가
            if metadata.get('cover') and not metadata.get('cover_updated'):
                metadata['cover_updated'] = timestamp

                # 저장
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, ensure_ascii=False, indent=2)

                print(f"✅ {filename} - 타임스탬프 추가됨")
                updated_count += 1
            else:
                print(f"⏭️  {filename} - 건너뜀 (cover 없음 또는 이미 있음)")
                skipped_count += 1

        except Exception as e:
            print(f"❌ {filename} - 오류: {e}")
            error_count += 1

    print(f"\n{'='*50}")
    print(f"📊 마이그레이션 완료")
    print(f"✅ 업데이트됨: {updated_count}개")
    print(f"⏭️  건너뜀: {skipped_count}개")
    print(f"❌ 오류: {error_count}개")
    print(f"{'='*50}")

if __name__ == '__main__':
    migrate_cover_timestamps()
