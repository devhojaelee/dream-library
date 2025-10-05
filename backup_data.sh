#!/bin/bash

# 백업 디렉토리 설정
DATA_DIR="/app/data"
BACKUP_DIR="$DATA_DIR/backups"
MAX_BACKUPS=30

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# 현재 날짜 (YYYY-MM-DD 형식)
DATE=$(date +%Y-%m-%d)

# 백업할 파일 목록
FILES=("users.json" "downloads.json")

echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting data backup..."

# 각 파일 백업
for FILE in "${FILES[@]}"; do
    SOURCE_FILE="$DATA_DIR/$FILE"

    if [ -f "$SOURCE_FILE" ]; then
        # 파일명에서 확장자 분리
        BASENAME="${FILE%.json}"

        # 가장 최근 백업 파일 찾기
        LATEST_BACKUP=$(find "$BACKUP_DIR" -type f -name "${BASENAME}_*.json" | sort -r | head -n 1)

        # 최근 백업과 비교
        if [ -n "$LATEST_BACKUP" ] && cmp -s "$SOURCE_FILE" "$LATEST_BACKUP"; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') - No changes detected for $FILE, skipping backup"
        else
            # 변경이 있거나 백업이 없는 경우 새 백업 생성
            BACKUP_FILE="$BACKUP_DIR/${BASENAME}_${DATE}.json"
            cp "$SOURCE_FILE" "$BACKUP_FILE"

            if [ -n "$LATEST_BACKUP" ]; then
                echo "$(date '+%Y-%m-%d %H:%M:%S') - Changes detected, created new backup: $BACKUP_FILE"
            else
                echo "$(date '+%Y-%m-%d %H:%M:%S') - First backup created: $BACKUP_FILE"
            fi

            # 오래된 백업 삭제 (최대 30개 유지)
            BACKUP_FILES=($(find "$BACKUP_DIR" -type f -name "${BASENAME}_*.json" | sort -r))
            BACKUP_COUNT=${#BACKUP_FILES[@]}

            if [ $BACKUP_COUNT -gt $MAX_BACKUPS ]; then
                # 오래된 백업 삭제 (30개 초과분)
                for ((i=$MAX_BACKUPS; i<$BACKUP_COUNT; i++)); do
                    rm "${BACKUP_FILES[$i]}"
                    echo "$(date '+%Y-%m-%d %H:%M:%S') - Removed old backup: ${BACKUP_FILES[$i]}"
                done
            fi
        fi
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Warning: $SOURCE_FILE not found, skipping"
    fi
done

# 백업 파일 개수 출력
BACKUP_COUNT=$(find "$BACKUP_DIR" -type f -name "*.json" | wc -l)
echo "$(date '+%Y-%m-%d %H:%M:%S') - Total backup files: $BACKUP_COUNT"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup completed successfully"
