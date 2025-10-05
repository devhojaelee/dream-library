#!/usr/bin/env python3
"""
Script to reorder sections in activity pages:
Order: KPI Cards → 독서 여정 → 저자 TOP 5 → 다운로드 추세
Also applies mobile optimizations
"""

import re

# Files to process
files = [
    '/Users/hojaelee/Desktop/python/dream-library/web/app/mypage/activity/page.tsx',
    '/Users/hojaelee/Desktop/python/dream-library/web/app/eink/mypage/activity/page.tsx'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all three sections
    # Section 1: 다운로드 추세 (Time-based Chart)
    chart_match = re.search(
        r'(\s+{/\* Time-based Chart with Toggle \*/}.*?</ResponsiveContainer>\s+</div>)',
        content,
        re.DOTALL
    )

    # Section 2: 저자 TOP 5 (Top Authors)
    authors_match = re.search(
        r'(\s+{/\* Top Authors \*/}.*?</div>\s+\)}\s+}\s+</div>\s+</div>\s+\)}\s+}\s+</div>\s+\)})',
        content,
        re.DOTALL
    )

    # Section 3: 독서 여정 (Reading Journey)
    journey_match = re.search(
        r'(\s+{/\* 독서 여정 \*/}.*?</div>\s+</div>)\s+</>',
        content,
        re.DOTALL
    )

    if chart_match and authors_match and journey_match:
        chart_section = chart_match.group(1)
        authors_section = authors_match.group(1)
        journey_section = journey_match.group(1)

        # Remove all three sections
        content = content.replace(chart_section, '')
        content = content.replace(authors_section, '')
        content = content.replace(journey_section, '')

        # Insert in new order: KPI → Journey → Authors → Chart
        # Find insertion point after KPI cards
        kpi_end = re.search(r'(</div>\s+</div>\s+{/\* Time-based Chart)', content)
        if kpi_end:
            insert_pos = kpi_end.start(1) + len('</div>\n          </div>')

            new_content = (
                content[:insert_pos] +
                '\n' + journey_section +
                '\n' + authors_section +
                '\n' + chart_section +
                content[insert_pos:]
            )

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)

            print(f"✅ Reordered sections in {file_path}")
        else:
            print(f"❌ Could not find insertion point in {file_path}")
    else:
        print(f"❌ Could not find all sections in {file_path}")
        print(f"   Chart: {bool(chart_match)}, Authors: {bool(authors_match)}, Journey: {bool(journey_match)}")

print("\nDone!")
