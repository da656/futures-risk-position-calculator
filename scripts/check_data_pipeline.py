#!/usr/bin/env python
"""统一校验固定参数、动态费用及前端生成模块。"""
from __future__ import annotations

import csv
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = ROOT / 'outputs'
SNAPSHOT = OUTPUTS / 'exchange_fee_margin_snapshot.xlsx'
COMMANDS = (
    ('固定参数与 JSON Schema', [sys.executable, 'scripts/build_china_futures_contracts.py', '--check']),
    ('前端固定参数同步', [sys.executable, 'scripts/sync_official_contracts.py', '--check']),
    ('前端动态费用同步', [sys.executable, 'scripts/sync_exchange_fee_margins.py', '--check']),
)


def validate_fee_rule(value: object, label: str) -> None:
    if not isinstance(value, dict):
        raise ValueError(f'{label} 必须是对象。')
    kind = value.get('kind')
    if kind == 'fixed':
        amount = value.get('amountPerLot')
        if not isinstance(amount, (int, float)) or isinstance(amount, bool) or amount < 0:
            raise ValueError(f'{label}.amountPerLot 必须是非负数。')
        return
    if kind == 'rate':
        rate = value.get('rate')
        if not isinstance(rate, (int, float)) or isinstance(rate, bool) or rate < 0:
            raise ValueError(f'{label}.rate 必须是非负数。')
        return
    raise ValueError(f'{label}.kind 必须是 fixed 或 rate。')


def validate_public_dynamic_fee_artifacts() -> None:
    """校验公开仓库中的动态费用产物，不要求提交本地 Excel 快照。"""
    contracts_path = OUTPUTS / 'china-futures-contracts.json'
    fees_path = OUTPUTS / 'exchange-fee-margin.json'
    unresolved_path = OUTPUTS / 'unresolved-fee-margins.csv'
    report_path = OUTPUTS / 'fee-margin-coverage-report.md'
    contracts = json.loads(contracts_path.read_text(encoding='utf-8'))
    fees = json.loads(fees_path.read_text(encoding='utf-8'))
    if not isinstance(contracts, list) or not isinstance(fees, list):
        raise ValueError('固定参数和动态费用 JSON 顶层必须是数组。')
    known = {(row.get('exchange'), row.get('symbol')) for row in contracts if isinstance(row, dict)}
    fee_keys: set[tuple[str, str]] = set()
    for index, row in enumerate(fees):
        if not isinstance(row, dict):
            raise ValueError(f'动态费用第 {index + 1} 条必须是对象。')
        key = (row.get('exchange'), row.get('symbol'))
        if not all(isinstance(part, str) and part for part in key):
            raise ValueError(f'动态费用第 {index + 1} 条缺少 exchange 或 symbol。')
        if key not in known:
            raise ValueError(f'动态费用包含未知品种：{key[0]}:{key[1]}。')
        if key in fee_keys:
            raise ValueError(f'动态费用包含重复品种：{key[0]}:{key[1]}。')
        fee_keys.add(key)
        margin_rate = row.get('marginRate')
        if not isinstance(margin_rate, (int, float)) or isinstance(margin_rate, bool) or not 0 < margin_rate <= 1:
            raise ValueError(f'{key[0]}:{key[1]} 的 marginRate 必须在 (0, 1]。')
        validate_fee_rule(row.get('openFee'), f'{key[0]}:{key[1]}.openFee')
        validate_fee_rule(row.get('closeFee'), f'{key[0]}:{key[1]}.closeFee')
    with unresolved_path.open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != ['kind', 'key', 'reason']:
            raise ValueError('未解决动态费用清单的列必须为 kind、key、reason。')
        unresolved_rows = list(reader)
    report = report_path.read_text(encoding='utf-8')
    coverage = f'{len(fees)}/{len(contracts)}'
    if coverage not in report or f'**{len(unresolved_rows)}**' not in report:
        raise ValueError('动态费用覆盖报告与公开 JSON/CSV 数据不一致。')
    print(f'公开动态费用产物校验通过：{len(fees)}/{len(contracts)} 条自动带入，{len(unresolved_rows)} 条未解决。')


def check_dynamic_fee_artifacts() -> int:
    if SNAPSHOT.exists():
        completed = subprocess.run(
            [sys.executable, 'scripts/build_exchange_fee_margins.py', '--check'],
            cwd=ROOT,
            text=True,
            encoding='utf-8',
            errors='replace',
        )
        if completed.returncode:
            print('动态费用覆盖数据校验失败。', file=sys.stderr)
        return completed.returncode
    try:
        validate_public_dynamic_fee_artifacts()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f'公开动态费用产物校验失败：{exc}', file=sys.stderr)
        return 1
    return 0


def main() -> int:
    for name, command in COMMANDS:
        completed = subprocess.run(command, cwd=ROOT, text=True, encoding='utf-8', errors='replace')
        if completed.returncode:
            print(f'{name}校验失败。', file=sys.stderr)
            return completed.returncode
    if check_dynamic_fee_artifacts():
        return 1
    print('数据管线全量校验通过：固定参数、动态费用和两个前端生成模块均未过期。')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
