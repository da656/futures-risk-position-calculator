#!/usr/bin/env python
"""构建动态手续费/保证金数据，并校验生成文件没有过期。"""
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from decimal import Decimal, InvalidOperation
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = ROOT / 'outputs'
SNAPSHOT = OUTPUTS / 'exchange_fee_margin_snapshot.xlsx'
CONTRACTS = OUTPUTS / 'china-futures-contracts.json'
TARGET = OUTPUTS / 'exchange-fee-margin.json'
UNRESOLVED = OUTPUTS / 'unresolved-fee-margins.csv'
LEGACY_UNRESOLVED = OUTPUTS / 'unresolved-exchange-fee-margin.csv'
REPORT = OUTPUTS / 'fee-margin-coverage-report.md'
NAMESPACE = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
HEADERS = (
    'exchange_product_key', 'exchange_margin_rate_pct', 'open_fee_basis',
    'open_fee_cny', 'close_yesterday_fee_basis', 'close_yesterday_fee_cny',
)
SYMBOL_ALIASES = {
    ('CZCE', 'C'): 'CF', ('CZCE', 'P'): 'PF', ('CZCE', 'S'): 'SF', ('CFFEX', 'I'): 'IF',
}


def column_index(reference: str) -> int:
    result = 0
    for char in re.match(r'[A-Z]+', reference).group(0):
        result = result * 26 + ord(char) - 64
    return result - 1


def read_sheet_rows() -> list[dict[str, str]]:
    with zipfile.ZipFile(SNAPSHOT) as archive:
        root = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
    rows: list[dict[int, str]] = []
    for row in root.findall('.//m:sheetData/m:row', NAMESPACE):
        parsed: dict[int, str] = {}
        for cell in row.findall('m:c', NAMESPACE):
            inline_text = ''.join(node.text or '' for node in cell.findall('.//m:t', NAMESPACE))
            value = cell.find('m:v', NAMESPACE)
            parsed[column_index(cell.attrib['r'])] = inline_text if inline_text else (value.text if value is not None else '')
        rows.append(parsed)
    header = [rows[0].get(index, '') for index in range(max(rows[0]) + 1)]
    if not set(HEADERS).issubset(header):
        missing = sorted(set(HEADERS) - set(header))
        raise ValueError(f'快照缺少必要列：{missing}')
    return [{name: row.get(index, '') for index, name in enumerate(header)} for row in rows[1:]]


def positive_decimal(value: str, field: str, key: str) -> Decimal:
    try:
        parsed = Decimal(value)
    except InvalidOperation as exc:
        raise ValueError(f'{key}: {field} 不是数字：{value!r}') from exc
    if not parsed.is_finite() or parsed < 0:
        raise ValueError(f'{key}: {field} 必须是非负有限数：{value!r}')
    return parsed


def fee_rule(basis: str, cny: str, key: str, field: str) -> dict[str, float | str]:
    normalized = basis.strip().lower()
    if normalized in {'fixed', '0'}:
        return {'kind': 'fixed', 'amountPerLot': float(positive_decimal(cny, field, key))}
    match = re.fullmatch(r'([0-9]+(?:\.[0-9]+)?)/([0-9]+(?:\.[0-9]+)?)', normalized)
    if not match:
        raise ValueError(f'{key}: {field} 计费规则无法解析：{basis!r}')
    numerator, denominator = (Decimal(part) for part in match.groups())
    if denominator <= 0:
        raise ValueError(f'{key}: {field} 分母必须大于 0')
    return {'kind': 'rate', 'rate': float(numerator / denominator)}


def normalize_key(raw_key: str) -> tuple[str, str] | None:
    if ':' not in raw_key:
        return None
    exchange, raw_symbol = raw_key.split(':', 1)
    exchange = exchange.strip().upper()
    raw_symbol = raw_symbol.strip().upper()
    if not exchange or not raw_symbol:
        return None
    return exchange, SYMBOL_ALIASES.get((exchange, raw_symbol), raw_symbol)


def build_records() -> tuple[list[dict], list[dict[str, str]], int]:
    contracts = json.loads(CONTRACTS.read_text(encoding='utf-8'))
    if not isinstance(contracts, list):
        raise ValueError('固定参数最终 JSON 顶层必须为数组')
    known = {(row['exchange'], row['symbol'].upper()) for row in contracts}
    rows = read_sheet_rows()
    normalized_rows = [(row, normalize_key(row['exchange_product_key'].strip())) for row in rows]
    key_counts = Counter(key for _, key in normalized_rows if key is not None)
    duplicate_keys = {key for key, count in key_counts.items() if count > 1}

    records: list[dict] = []
    unresolved: list[dict[str, str]] = []
    accepted: set[tuple[str, str]] = set()
    reported_duplicates: set[tuple[str, str]] = set()
    for row, key in normalized_rows:
        raw_key = row['exchange_product_key'].strip()
        if key is None:
            unresolved.append({'kind': 'invalid-key', 'key': raw_key, 'reason': 'exchange_product_key 格式无效'})
            continue
        exchange, symbol = key
        if key in duplicate_keys:
            if key not in reported_duplicates:
                unresolved.append({'kind': 'duplicate-record', 'key': ':'.join(key), 'reason': '快照中存在重复品种键，全部记录均未自动接入'})
                reported_duplicates.add(key)
            continue
        if key not in known:
            unresolved.append({'kind': 'unmapped-record', 'key': raw_key, 'reason': '当前固定合约数据无唯一匹配，未自动接入'})
            continue
        try:
            margin_rate = positive_decimal(row['exchange_margin_rate_pct'], 'exchange_margin_rate_pct', raw_key) / Decimal('100')
            if margin_rate <= 0 or margin_rate > 1:
                raise ValueError(f'{raw_key}: 保证金比例必须在 (0, 1]')
            records.append({
                'exchange': exchange, 'symbol': symbol, 'marginRate': float(margin_rate),
                'openFee': fee_rule(row['open_fee_basis'], row['open_fee_cny'], raw_key, 'open_fee_basis'),
                'closeFee': fee_rule(row['close_yesterday_fee_basis'], row['close_yesterday_fee_cny'], raw_key, 'close_yesterday_fee_basis'),
                'sourceStatus': 'user-confirmed-snapshot',
            })
            accepted.add(key)
        except ValueError as exc:
            unresolved.append({'kind': 'invalid-snapshot', 'key': raw_key, 'reason': str(exc)})
    for key in sorted(known - accepted - duplicate_keys):
        unresolved.append({'kind': 'missing-snapshot', 'key': ':'.join(key), 'reason': '快照未提供可自动带入的保证金/手续费'})
    records.sort(key=lambda item: (item['exchange'], item['symbol']))
    return records, unresolved, len(known)


def render_unresolved(unresolved: list[dict[str, str]]) -> str:
    buffer = io.StringIO(newline='')
    writer = csv.DictWriter(buffer, fieldnames=['kind', 'key', 'reason'])
    writer.writeheader(); writer.writerows(unresolved)
    return buffer.getvalue()


def render_report(records: list[dict], unresolved: list[dict[str, str]], total_contracts: int) -> str:
    counts = Counter(row['kind'] for row in unresolved)
    covered = len(records)
    ratio = covered / total_contracts * 100 if total_contracts else 0
    return '\n'.join([
        '# 动态手续费与保证金：覆盖报告', '',
        '## 覆盖情况', '',
        f'- 已自动带入：**{covered}/{total_contracts}（{ratio:.1f}%）**。',
        f'- 未解决动态费用项（unresolved-fee-margins）：**{len(unresolved)}**。', '',
        '## 未解决项分类', '',
        f"- 缺失快照：{counts['missing-snapshot']}。",
        f"- 重复记录：{counts['duplicate-record']}。",
        f"- 无法映射记录：{counts['unmapped-record']}。",
        f"- 无效快照或键：{counts['invalid-snapshot'] + counts['invalid-key']}。", '',
        '未解决动态费用项不会自动带入前端计算器；固定参数未解决项请查看 data-quality-report.md。', '',
    ])


def expected_outputs() -> tuple[str, str, str, int, int]:
    records, unresolved, total = build_records()
    return json.dumps(records, ensure_ascii=False, indent=2) + '\n', render_unresolved(unresolved), render_report(records, unresolved, total), len(records), len(unresolved)


def write_outputs() -> tuple[int, int]:
    records_json, unresolved_csv, report, covered, unresolved = expected_outputs()
    TARGET.write_text(records_json, encoding='utf-8')
    UNRESOLVED.write_text(unresolved_csv, encoding='utf-8-sig', newline='')
    REPORT.write_text(report, encoding='utf-8')
    if LEGACY_UNRESOLVED.exists():
        LEGACY_UNRESOLVED.unlink()
    return covered, unresolved


def check_outputs() -> tuple[int, int]:
    expected_json, expected_csv, expected_report, covered, unresolved = expected_outputs()
    actual_json = TARGET.read_text(encoding='utf-8')
    actual_csv = UNRESOLVED.read_text(encoding='utf-8-sig').replace('\r\n', '\n')
    expected_csv = expected_csv.replace('\r\n', '\n')
    actual_report = REPORT.read_text(encoding='utf-8')
    if (actual_json, actual_csv, actual_report) != (expected_json, expected_csv, expected_report):
        raise ValueError('动态费用源数据或覆盖报告与生成文件不一致；请运行 npm run data:update')
    return covered, unresolved


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='仅校验动态费用生成文件是否过期')
    args = parser.parse_args()
    covered, unresolved = check_outputs() if args.check else write_outputs()
    print(f'动态费用校验通过：已自动带入 {covered} 条；未解决 {unresolved} 条。')
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print(f'构建失败：{exc}', file=sys.stderr)
        raise SystemExit(1)
