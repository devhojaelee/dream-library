from playwright.sync_api import sync_playwright
import time
import os
import re
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# 제외 키워드
EXCLUDED = ['주식', '금융', '투자', '재테크', '경제학', '증권', '자본가', '자본',
            'sex', '섹스']

def should_exclude(title):
    """제외 대상 확인"""
    title_lower = title.lower()
    for keyword in EXCLUDED:
        if keyword.lower() in title_lower:
            return True
    return False

def download_incremental():
    print("="*70)
    print("Z-Library Incremental Downloader")
    print("="*70)

    downloaded_count = 0
    downloaded_titles = set()  # Track what we've downloaded

    if not os.path.exists('./books'):
        os.makedirs('./books')

    if not os.path.exists('./books/covers'):
        os.makedirs('./books/covers')

    if not os.path.exists('./books/metadata'):
        os.makedirs('./books/metadata')

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()

        try:
            # Login
            print("\n🔐 Logging in...")
            page.goto("https://ko.z-library.ec/", timeout=60000)
            time.sleep(2)

            page.click('a:has-text("Log In"), a:has-text("로그인")')
            time.sleep(2)

            zlibrary_email = os.getenv('ZLIBRARY_EMAIL')
            zlibrary_password = os.getenv('ZLIBRARY_PASSWORD')

            if not zlibrary_email or not zlibrary_password:
                raise ValueError("ZLIBRARY_EMAIL and ZLIBRARY_PASSWORD must be set in .env file")

            page.locator('input[name="email"]').first.fill(zlibrary_email)
            page.locator('input[name="password"]').first.fill(zlibrary_password)
            page.locator('button:has-text("Log In"), button:has-text("로그인")').first.click()
            time.sleep(3)

            print("✅ Logged in\n")

            # Wait for page to fully load
            print("⏳ Waiting for page to load...")
            page.wait_for_load_state('networkidle', timeout=10000)
            time.sleep(2)

            # Try to find recommended section (with timeout fallback)
            print("📜 Checking page structure...")
            for _ in range(5):
                page.evaluate("window.scrollBy(0, 500)")
                time.sleep(0.5)

            try:
                # Try multiple selectors
                selectors = [
                    'text=/Personally recommended/i',
                    'text=/개인 추천/i',
                    'text=/Most popular/i',
                    'text=/가장 인기 있는/i',
                    'h2, h3, .section-title'  # Fallback: any section headers
                ]

                recommended = None
                for selector in selectors:
                    try:
                        loc = page.locator(selector).first
                        if loc.count() > 0:
                            print(f"  ✅ Found section with selector: {selector}")
                            loc.scroll_into_view_if_needed(timeout=5000)
                            recommended = loc
                            break
                    except:
                        continue

                if not recommended:
                    print("  ⚠️  Could not find recommended section - will try to download visible books")
                    # Scroll to ensure books are loaded
                    for _ in range(3):
                        page.evaluate("window.scrollBy(0, 800)")
                        time.sleep(0.5)
            except Exception as e:
                print(f"  ⚠️  Section finder failed: {str(e)[:50]}")
                print("  → Continuing with visible books...")

            time.sleep(2)
            print("✅ Ready to collect books\n")

            # Main loop: download batch, then load more
            round_number = 0
            while True:
                round_number += 1
                print(f"\n{'='*70}")
                print(f"ROUND {round_number}")
                print(f"{'='*70}")

                # Get current visible books (only those with loaded covers)
                print("📚 Collecting books with loaded covers...")
                book_links = page.locator('a[href*="/book/"]').all()
                print(f"Found {len(book_links)} total book links")

                # Collect books to download this round
                books_this_round = []
                checked_count = 0
                skipped_no_cover = 0

                for link in book_links:
                    try:
                        # Check if cover is loaded (quick check)
                        cover_count = link.locator('z-cover').count()
                        if cover_count == 0:
                            skipped_no_cover += 1
                            continue

                        cover = link.locator('z-cover').first

                        # Use shorter timeout
                        title = cover.get_attribute('title', timeout=3000)
                        href = link.get_attribute('href', timeout=3000)

                        # Skip if already downloaded in this session
                        if title in downloaded_titles:
                            continue

                        # Check if Korean first
                        has_korean = any('\uac00' <= c <= '\ud7a3' for c in title)
                        if not has_korean:
                            continue

                        checked_count += 1

                        # Check if already downloaded
                        # Downloaded books have an element with class containing "download"
                        try:
                            download_badge_count = cover.locator('[class*="download"]').count()
                            if download_badge_count > 0:
                                print(f"  ⏭️  Skipping (already downloaded): {title[:50]}")
                                continue
                        except Exception as e:
                            print(f"  ⚠️  Error checking badge for {title[:30]}: {e}")
                            pass

                        # Check if should exclude
                        if should_exclude(title):
                            print(f"  ⏭️  Skipping (excluded category): {title[:50]}")
                            continue

                        print(f"  ✅ Will download: {title[:50]}")
                        books_this_round.append({'title': title, 'href': href})

                    except Exception as e:
                        print(f"  ❌ Error processing book: {e}")
                        continue

                print(f"\nChecked {checked_count} Korean books")
                print(f"Skipped {skipped_no_cover} books without loaded covers")

                print(f"✅ {len(books_this_round)} new Korean books to download this round\n")

                if len(books_this_round) == 0:
                    print("No new books to download this round")
                else:
                    # Download books one by one
                    print(f"Starting sequential download for {len(books_this_round)} books...\n")

                    idx = 0
                    while idx < len(books_this_round):
                        book = books_this_round[idx]
                        title = book['title']
                        href = book['href']

                        print(f"\n{'='*70}")
                        print(f"[{idx + 1}/{len(books_this_round)}] {title[:60]}")
                        print(f"{'='*70}")

                        try:
                            book_url = f"https://ko.z-library.ec{href}"
                            print(f"  → Navigating: {book_url[:80]}...")
                            page.goto(book_url, timeout=90000)
                            time.sleep(1)

                            # Find EPUB button (not PDF)
                            epub_btns = page.locator('a:has-text("EPUB")').all()
                            epub_btn = None

                            # Find the actual EPUB button (not PDF)
                            for btn in epub_btns:
                                btn_text = btn.inner_text()
                                if 'PDF' not in btn_text.upper():
                                    epub_btn = btn
                                    break

                            if epub_btn and epub_btn.is_visible():
                                print(f"  → Preparing metadata extraction...")

                                # Prepare safe filename for this book (will be used later)
                                safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()

                                # Extract metadata (but don't save yet - wait for EPUB success)
                                metadata = {'title': title, 'url': book_url}
                                cover_src_url = None
                                cover_ext = 'jpg'

                                # Get cover image URL
                                try:
                                    cover_img = page.locator('img.cover').first
                                    if cover_img.count() > 0:
                                        cover_src = cover_img.get_attribute('src')
                                        if cover_src:
                                            if not cover_src.startswith('http'):
                                                cover_src = f"https://ko.z-library.ec{cover_src}"
                                            cover_src_url = cover_src
                                            cover_ext = cover_src.split('.')[-1].split('?')[0] or 'jpg'
                                            print(f"    📷 Cover URL found")
                                except Exception as e:
                                    print(f"    ⚠️ Cover URL failed: {str(e)[:40]}")

                                # Get description
                                try:
                                    desc_elem = page.locator('.book-description, .bookDescriptionBox, [itemprop="description"]').first
                                    if desc_elem.count() > 0:
                                        description = desc_elem.inner_text().strip()
                                        metadata['description'] = description
                                        print(f"    ✅ Description: {description[:50]}...")
                                except Exception as e:
                                    print(f"    ⚠️ Description failed: {str(e)[:40]}")

                                # Get author
                                try:
                                    author_elem = page.locator('[itemprop="author"], .author').first
                                    if author_elem.count() > 0:
                                        author = author_elem.inner_text().strip()
                                        metadata['author'] = author
                                        print(f"    ✅ Author: {author}")
                                except Exception as e:
                                    print(f"    ⚠️ Author failed: {str(e)[:40]}")

                                # Get year
                                try:
                                    year_elem = page.locator('[itemprop="datePublished"], .property_year .property_value').first
                                    if year_elem.count() > 0:
                                        year = year_elem.inner_text().strip()
                                        metadata['year'] = year
                                        print(f"    ✅ Year: {year}")
                                except Exception as e:
                                    print(f"    ⚠️ Year failed: {str(e)[:40]}")

                                print(f"  → Clicking EPUB...")

                                # Download with context manager
                                with page.expect_download(timeout=90000) as download_info:
                                    epub_btn.click()

                                download = download_info.value

                                # Save EPUB
                                filename = f"{safe_title[:100]}.epub"
                                filepath = f"./books/{filename}"

                                download.save_as(filepath)
                                filesize = os.path.getsize(filepath) / 1024 / 1024

                                # EPUB download succeeded - now save cover with matching filename
                                if cover_src_url:
                                    try:
                                        response = page.request.get(cover_src_url)
                                        if response.ok:
                                            # Use same safe_title as EPUB
                                            cover_filename = f"{safe_title[:100]}.{cover_ext}"
                                            cover_path = f"./books/covers/{cover_filename}"

                                            with open(cover_path, 'wb') as f:
                                                f.write(response.body())

                                            metadata['cover'] = cover_filename
                                            print(f"    ✅ Cover saved: {cover_filename}")
                                    except Exception as e:
                                        print(f"    ⚠️ Cover download failed: {str(e)[:40]}")

                                # Save metadata JSON with same filename base
                                metadata['filename'] = filename
                                metadata['filesize'] = filesize
                                metadata['downloadedAt'] = datetime.now().isoformat()

                                metadata_filename = f"{safe_title[:100]}.json"
                                metadata_path = f"./books/metadata/{metadata_filename}"
                                with open(metadata_path, 'w', encoding='utf-8') as f:
                                    json.dump(metadata, f, ensure_ascii=False, indent=2)

                                downloaded_count += 1
                                downloaded_titles.add(title)
                                print(f"  ✅ {title[:50]} - {filesize:.1f} MB (Total: {downloaded_count})")
                                idx += 1

                            else:
                                print(f"  ❌ No EPUB button")
                                idx += 1

                        except Exception as e:
                            # Check for download limit (English + Korean)
                            if 'dailylimit' in page.url.lower() or \
                               page.locator('text=/daily.*limit.*reached/i').count() > 0 or \
                               page.locator('text=/1일.*제한.*최대/i').count() > 0 or \
                               page.locator('text=/제한.*도달/i').count() > 0:
                                print(f"\n⏳ Download limit detected!")

                                page_text = page.content()
                                tooltip_match = re.search(r'(\d+)h\s*(\d+)m', page_text, re.IGNORECASE)
                                combined_match = re.search(r'(\d+)\s*hour[s]?\s+(\d+)\s*minute', page_text, re.IGNORECASE)
                                hour_only_match = re.search(r'(\d+)\s*hour', page_text, re.IGNORECASE)
                                minute_only_match = re.search(r'(\d+)\s*minute', page_text, re.IGNORECASE)

                                total_wait_seconds = 0
                                if tooltip_match:
                                    wait_hours = int(tooltip_match.group(1))
                                    wait_minutes = int(tooltip_match.group(2))
                                    total_wait_seconds = (wait_hours * 3600) + (wait_minutes * 60)
                                    print(f"  ⏰ Need to wait {wait_hours}h {wait_minutes}m = {total_wait_seconds}s")
                                elif combined_match:
                                    wait_hours = int(combined_match.group(1))
                                    wait_minutes = int(combined_match.group(2))
                                    total_wait_seconds = (wait_hours * 3600) + (wait_minutes * 60)
                                    print(f"  ⏰ Need to wait {wait_hours}h {wait_minutes}m = {total_wait_seconds}s")
                                elif hour_only_match:
                                    wait_hours = int(hour_only_match.group(1))
                                    total_wait_seconds = wait_hours * 3600
                                    print(f"  ⏰ Need to wait {wait_hours}h = {total_wait_seconds}s")
                                elif minute_only_match:
                                    wait_minutes = int(minute_only_match.group(1))
                                    total_wait_seconds = wait_minutes * 60
                                    print(f"  ⏰ Need to wait {wait_minutes}m = {total_wait_seconds}s")

                                if total_wait_seconds > 0:
                                    # Save download status for web UI and enricher
                                    wait_until = datetime.now() + timedelta(seconds=total_wait_seconds)
                                    status_data = {
                                        "waitUntil": wait_until.isoformat(),
                                        "lastUpdate": datetime.now().isoformat(),
                                        "downloadedFiles": list(downloaded_titles)  # List of downloaded book titles
                                    }
                                    status_path = "./books/download_status.json"
                                    status_tmp_path = "./books/download_status.tmp"
                                    try:
                                        # Atomic write: write to temp file, then rename
                                        with open(status_tmp_path, 'w', encoding='utf-8') as f:
                                            json.dump(status_data, f, ensure_ascii=False, indent=2)
                                        # Atomic rename - OS guarantees atomicity
                                        os.replace(status_tmp_path, status_path)
                                        print(f"  📝 Saved download status: wait until {wait_until.strftime('%Y-%m-%d %H:%M:%S')}")
                                        print(f"  📋 Tracked {len(downloaded_titles)} downloaded files for enrichment")
                                    except Exception as status_err:
                                        print(f"  ⚠️ Could not save status: {status_err}")
                                        # Clean up temp file if it exists
                                        if os.path.exists(status_tmp_path):
                                            os.remove(status_tmp_path)

                                    print(f"  💤 Waiting {total_wait_seconds + 10}s...")
                                    time.sleep(total_wait_seconds + 10)
                                    print(f"  ✅ Wait completed! Retrying this book...")

                                    # Clear download status after wait
                                    try:
                                        if os.path.exists(status_path):
                                            os.remove(status_path)
                                            print(f"  🗑️ Cleared download status")
                                    except Exception as clear_err:
                                        print(f"  ⚠️ Could not clear status: {clear_err}")

                                    # Don't increment idx, retry the same book
                                    continue
                                else:
                                    print(f"  ⚠️ Could not parse wait time, skipping...")
                                    idx += 1
                                    continue

                            print(f"  ❌ Failed: {title[:50]} - {str(e)[:50]}")
                            idx += 1

                        # Return to main page
                        page.goto("https://ko.z-library.ec/", timeout=60000)
                        time.sleep(1)
                        for _ in range(5):
                            page.evaluate("window.scrollBy(0, 500)")
                            time.sleep(0.3)

                # Now click Load More to get next batch
                print(f"\n📥 Clicking Load More to get next batch...")
                try:
                    # Scroll to bottom
                    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    time.sleep(2)

                    # Try to find and click load more
                    load_more_selectors = [
                        'button:has-text("Load more")',
                        'a:has-text("Load more")',
                        'button:has-text("업로드 계속")',
                        'a:has-text("업로드 계속")',
                        '.load-more'
                    ]

                    clicked = False
                    for selector in load_more_selectors:
                        try:
                            load_more = page.locator(selector).first
                            if load_more.is_visible():
                                load_more.click()
                                print(f"  ✅ Clicked Load More")
                                time.sleep(3)
                                clicked = True
                                break
                        except:
                            continue

                    if not clicked:
                        print(f"  ℹ️  No more Load More button - all books loaded")
                        break

                except Exception as e:
                    print(f"  ⚠️  Could not load more: {str(e)[:50]}")
                    break

            # Summary
            print("\n" + "="*70)
            print("📊 DOWNLOAD SUMMARY")
            print("="*70)
            print(f"✅ Downloaded: {downloaded_count} books")
            print(f"📁 Location: ./books/")
            print("="*70)

        except Exception as e:
            if "Download limit reached" not in str(e):
                print(f"\n❌ Fatal error: {e}")
                import traceback
                traceback.print_exc()

        finally:
            print("\n⏸️  Closing in 10 seconds...")
            time.sleep(10)
            browser.close()

if __name__ == "__main__":
    download_incremental()
