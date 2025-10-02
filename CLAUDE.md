# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dream Library is a Korean book management system combining a Z-Library crawler with a Next.js web interface optimized for E-ink displays.

**Components:**
- Python crawler (`book_downloader.py`, `enrich_metadata.py`) for Z-Library downloads and metadata enrichment
- Next.js web app with dual UI modes (standard + E-ink optimized)
- Docker-based deployment with automated metadata enrichment

## Development Commands

### Python Development
```bash
# Activate virtual environment
source venv/bin/activate

# Run book downloader
python book_downloader.py

# Run metadata enrichment
python enrich_metadata.py
```

### Next.js Development
```bash
cd web

# Install dependencies
npm ci

# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

### Docker Development
```bash
# Start web server + auto metadata enrichment (runs daily at 00:00 KST)
docker-compose up -d

# Run crawler (Z-Library downloads)
docker-compose --profile crawler up crawler

# Manual metadata enrichment
docker-compose --profile enricher up enricher

# View logs
docker-compose logs -f web
docker-compose logs -f enricher-cron

# Rebuild specific service
docker-compose build enricher

# Stop all services
docker-compose down
```

## Architecture

### Dual UI System
- **Standard UI** (`/app/*`): Modern web interface
- **E-ink UI** (`/app/eink/*`): Optimized for E-ink displays
  - No animations, transitions, or shadows
  - High contrast (black/white only)
  - Large touch targets (min 44px)
  - Grayscale images with contrast boost
  - Scoped CSS via `.eink-mode` class

### Authentication System
- File-based user storage (`/web/data/users.json`)
- JWT tokens with bcrypt password hashing
- HttpOnly cookies with configurable expiry (1d or 30d)
- Download tracking per user (`/web/data/downloads.json`)

### File System Integration
```
books/               # Docker volume mount
├── *.epub          # Book files
├── metadata/       # Book metadata JSON
│   └── {title}.json
└── covers/         # Cover images
    └── {title}.(jpg|png)

web/data/           # Persistent user data
├── users.json      # User accounts
└── downloads.json  # Download tracking
```

### Docker Services
1. **web**: Next.js app (port 3000)
   - Read-only mount: `/books`
   - Read-write mount: `/web/data`

2. **enricher-cron**: Auto metadata enrichment
   - Runs immediately on container start
   - Then executes daily at 00:00 KST via cron

3. **crawler**: Z-Library downloads (profile-based)

4. **enricher**: Manual metadata enrichment (profile-based)

### API Routes
- `/api/books`: List all books with metadata
- `/api/download`: Serve EPUB files with download tracking
- `/api/auth/login`: JWT authentication
- `/api/auth/signup`: User registration
- `/api/auth/logout`: Session termination
- `/api/covers/[filename]`: Serve cover images

### Metadata Enrichment Pipeline
1. Check existing metadata completeness
2. Query Google Books API (max 5 results, Korean priority)
3. Select best result by completeness score
4. Validate and resize cover images (min 200px width)
5. Save JSON metadata + cover files

## Key Technical Details

### Next.js Configuration
- Standalone output mode for Docker optimization
- Turbopack for faster builds
- Path alias: `@/*` maps to `/web/*`
- TypeScript with strict mode

### E-ink Optimization
- Separate route structure (`/eink/*`)
- CSS scope: `.eink-mode` class prevents style leaking
- Disabled: animations, transitions, box-shadow, text-shadow, gradients
- Enhanced: contrast (grayscale filter), font sizes, spacing

### Python Dependencies
```
playwright          # Browser automation
selenium           # Fallback automation
requests           # HTTP client
beautifulsoup4     # HTML parsing (metadata enrichment)
pillow             # Image processing
python-dotenv      # Environment variables
```

### Authentication Flow
1. Login → bcrypt password verification
2. Generate JWT token (1d or 30d expiry)
3. Set HttpOnly cookie
4. Middleware validates token on protected routes
5. Track downloads per user in `downloads.json`

## Important Patterns

### Docker Volume Mounts
- Web service: `/books` (read-only) - prevents accidental file modification
- Crawler/enricher: `/books` (read-write) - allows file creation
- User data: `/web/data` (persistent) - survives container restarts

### Metadata JSON Structure
```json
{
  "title": "책 제목",
  "author": "저자명",
  "year": "출판년도",
  "description": "책 설명",
  "cover": "표지 파일명"
}
```

### Book Filtering (Crawler)
**Included**: Korean language books (contains Hangul characters)
**Excluded**: Finance/stocks, philosophy, art (keyword-based)

### Enricher-Cron Behavior
- **Container start**: Immediately runs `enrich_metadata.py`
- **Daily execution**: Cron runs at 00:00 KST
- **Logging**: Output to `/var/log/cron.log`

## Development Notes

### Testing Scripts
Located in `/dev/test_scripts/`:
- `test_login.py`: Z-Library authentication testing
- `find_recommended.py`: Selector validation
- `inspect_structure.py`: DOM analysis

### Cookie Configuration
- Development: `secure: false` (allows HTTP)
- Production: `secure: process.env.NODE_ENV === 'production'` (HTTPS only)

### Environment Variables
- `NODE_ENV`: production/development
- `BOOKS_DIR`: Book directory path (default: `/books`)
- `JWT_SECRET`: JWT signing key (default: insecure, should be changed)
- `TZ`: Timezone for cron (default: `Asia/Seoul`)

## Synology NAS Deployment
1. Upload project to `/volume1/docker/dream-library/`
2. SSH into NAS
3. Navigate to project directory
4. Run `docker-compose up -d`
5. Access web UI at `http://nas-ip:3000`
