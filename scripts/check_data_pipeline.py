#!/usr/bin/env python
"""统一校验固定参数、动态费用及前端生成模块。"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMANDS = (
    ('固定参数与 JSON Schema', [sys.executable, 'scripts/build_china_futures_contracts.py', '--check']),
    ('动态费用覆盖数据', [sys.executable, 'scripts/build_exchange_fee_margins.py', '--check']),
    ('前端固定参数同步', [sys.executable, 'scripts/sync_official_contracts.py', '--check']),
    ('前端动态费用同步', [sys.executable, 'scripts/sync_exchange_fee_margins.py', '--check']),
)


def main() -> int:
    for name, command in COMMANDS:
        completed = subprocess.run(command, cwd=ROOT, text=True, encoding='utf-8', errors='replace')
        if completed.returncode:
            print(f'{name}校验失败。', file=sys.stderr)
            return completed.returncode
    print('数据管线全量校验通过：固定参数、动态费用和两个前端生成模块均未过期。')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
