#!/usr/bin/env python3
"""Fail closed on the exact 16 version fingerprints emitted by the read-only probe."""
import pathlib
import re
import sys

rows = dict(re.findall(r"(?m)^\s*(\d{14})\s*\|\s*(PRESENT|ABSENT|MIXED_STOP)\s*\|", pathlib.Path(sys.argv[1]).read_text()))
versions = [
    "20260928151737", "20261002000000", "20261002010000", "20261003000000",
    "20261006000000", "20261103000000", "20261105000000", "20261105230000",
    "20261107000000", "20261114010000", "20261116000000", "20261117000000",
    "20261118000000", "20261118010000", "20261118230000", "20261119000000",
]
phase = sys.argv[2]
assert phase in ("before", "up", "down")
expected = {version: "PRESENT" if i < 10 or phase == "up" else "ABSENT" for i, version in enumerate(versions)}
failures = [(v, rows.get(v), status) for v, status in expected.items() if rows.get(v) != status]
print(f"{phase}: {len(rows)} rows, {sum(x == 'PRESENT' for x in rows.values())} present, failures={failures}")
if failures:
    raise SystemExit(1)
