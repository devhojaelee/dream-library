#!/usr/bin/env python3
"""
File watcher for download_status.json
Triggers metadata enrichment 5 minutes after download limit is detected
"""

import time
import subprocess
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class DownloadStatusHandler(FileSystemEventHandler):
    def __init__(self):
        self.processing = False

    def on_created(self, event):
        # Trigger on download_status.json creation
        if event.src_path.endswith('download_status.json'):
            self.trigger_enrichment()

    def on_modified(self, event):
        # Also trigger on modification (in case file is updated)
        if event.src_path.endswith('download_status.json'):
            self.trigger_enrichment()

    def trigger_enrichment(self):
        if self.processing:
            print("⏭️  Already processing, skipping duplicate trigger")
            return

        self.processing = True
        try:
            print("\n" + "="*70)
            print("⏳ Download limit detected!")
            print("="*70)
            print("Waiting 5 minutes before running metadata enrichment...")

            # Wait 5 minutes
            wait_seconds = 300
            for remaining in range(wait_seconds, 0, -30):
                mins = remaining // 60
                secs = remaining % 60
                print(f"  ⏰ {mins:02d}:{secs:02d} remaining...")
                time.sleep(30)

            print("\n" + "="*70)
            print("🎨 Starting Metadata Enrichment")
            print("="*70)

            # Run enricher
            result = subprocess.run(
                ['python', '/app/enrich_metadata.py'],
                capture_output=True,
                text=True
            )

            print(result.stdout)
            if result.stderr:
                print("⚠️  Errors:", result.stderr)

            if result.returncode == 0:
                print("✅ Metadata enrichment completed successfully")
            else:
                print(f"❌ Metadata enrichment failed with code {result.returncode}")

            print("="*70)

        finally:
            self.processing = False

def main():
    watch_dir = '/app/books'

    if not os.path.exists(watch_dir):
        print(f"❌ Watch directory does not exist: {watch_dir}")
        return

    print("="*70)
    print("Dream Library - Metadata Enrichment Watcher")
    print("="*70)
    print(f"👀 Watching: {watch_dir}")
    print("📝 Trigger: download_status.json creation/modification")
    print("⏳ Delay: 5 minutes")
    print("🎨 Action: Run enrich_metadata.py")
    print("="*70 + "\n")

    event_handler = DownloadStatusHandler()
    observer = Observer()
    observer.schedule(event_handler, watch_dir, recursive=False)
    observer.start()

    print("✅ Watcher started. Press Ctrl+C to stop.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n⏸️  Stopping watcher...")
        observer.stop()

    observer.join()
    print("👋 Watcher stopped")

if __name__ == "__main__":
    main()
