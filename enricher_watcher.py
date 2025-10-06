#!/usr/bin/env python3
"""
File watcher for download_status.json
Triggers metadata enrichment 5 minutes after download limit is detected
"""

import time
import subprocess
import os
import json
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class DownloadStatusHandler(FileSystemEventHandler):
    def __init__(self):
        self.lock = threading.Lock()
        self.last_processed_timestamp = None  # Track last processed timestamp

    def on_created(self, event):
        # Trigger on download_status.json creation
        if event.src_path.endswith('download_status.json'):
            self.trigger_enrichment()

    def on_modified(self, event):
        # Also trigger on modification (in case file is updated)
        if event.src_path.endswith('download_status.json'):
            self.trigger_enrichment()

    def trigger_enrichment(self):
        # Try to acquire lock (non-blocking)
        if not self.lock.acquire(blocking=False):
            print("⏭️  Already processing, skipping duplicate trigger")
            return

        try:
            # Check if this is a duplicate trigger (same timestamp)
            # Atomic rename guarantees complete file, no race condition
            status_file = '/app/books/download_status.json'

            try:
                with open(status_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    current_timestamp = data.get('waitUntil')

                    if current_timestamp == self.last_processed_timestamp:
                        print(f"⏭️  Already processed timestamp {current_timestamp}, ignoring")
                        return

                    # Update last processed timestamp
                    self.last_processed_timestamp = current_timestamp
            except Exception as e:
                print(f"⚠️  Could not read status file: {e}")
                return  # Skip this trigger

            print("\n" + "="*70)
            print("⏳ Download limit detected!")
            print("="*70)
            print("Waiting 10 seconds before running metadata enrichment...")

            # Wait 10 seconds
            wait_seconds = 10
            for remaining in range(wait_seconds, 0, -2):
                print(f"  ⏰ {remaining} seconds remaining...")
                time.sleep(2)

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
            # Always release lock, even on exception or early return
            self.lock.release()

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
    print("⏳ Delay: 10 seconds")
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
