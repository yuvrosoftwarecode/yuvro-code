"""Simple heuristic scanner to find potentially unused source files.

Usage: python tools/find_unused_files.py

Heuristic:
- Collects .py, .ts, .tsx, .js, .jsx files (excluding common ignored dirs)
- For each file, searches all source files for occurrences of its basename (without extension)
- If basename appears only inside the file itself, marks as "possibly unused"

Limitations:
- Dynamic imports, string-based uses, Django autodiscovery (admin, models), tests, and CLI entrypoints can be false positives/negatives.
- Review the produced `tools/unused_report.txt` before deleting anything.
"""

import os
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]
IGNORED_DIRS = {'.git', 'node_modules', '__pycache__', 'venv', '.venv', 'dist', 'build', 'public', 'static'}
SOURCE_EXTS = {'.py', '.ts', '.tsx', '.js', '.jsx'}


def is_ignored(path: Path) -> bool:
    for part in path.parts:
        if part in IGNORED_DIRS:
            return True
    return False


def collect_source_files(root: Path):
    files = []
    for p in root.rglob('*'):
        if p.is_file() and p.suffix in SOURCE_EXTS and not is_ignored(p):
            files.append(p)
    return files


def read_text(p: Path):
    try:
        return p.read_text(encoding='utf-8')
    except Exception:
        try:
            return p.read_text(encoding='latin-1')
        except Exception:
            return ''


def main():
    print(f"Scanning repository at: {ROOT}")
    files = collect_source_files(ROOT)
    print(f"Found {len(files)} source files")

    contents = {}
    for f in files:
        contents[f] = read_text(f)

    # Build basename to file map
    basename_map = defaultdict(list)
    for f in files:
        name = f.stem
        basename_map[name].append(f)

    # For each file, count occurrences of its basename across all source files
    possibly_unused = []
    for f in files:
        name = f.stem
        total_occurrences = 0
        for other, text in contents.items():
            if name in text:
                total_occurrences += text.count(name)
        # If only appears in itself (or zero), flag
        if total_occurrences <= 1:
            # Exclude obvious entrypoints and config
            rel = f.relative_to(ROOT)
            if rel.name in {'manage.py', 'main.py', 'run_server.py', 'index.ts', 'index.tsx'}:
                continue
            possibly_unused.append((f, total_occurrences))

    possibly_unused.sort(key=lambda x: (x[1], str(x[0])))

    out_lines = []
    out_lines.append(f"Repository scanned: {ROOT}\n")
    out_lines.append(f"Total source files: {len(files)}\n")
    out_lines.append(f"Candidate unused files: {len(possibly_unused)}\n")
    out_lines.append("\nPotentially unused files (heuristic):\n")

    for f, count in possibly_unused:
        out_lines.append(f"{f}  (basename occurrences across repo: {count})\n")

    report_path = ROOT / 'tools' / 'unused_report.txt'
    report_text = '\n'.join(out_lines)
    report_path.write_text(report_text, encoding='utf-8')

    print(report_text)
    print(f"Report written to: {report_path}")


if __name__ == '__main__':
    main()
