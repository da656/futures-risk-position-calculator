#!/usr/bin/env python
"""合并并校验中国境内期货基础参数数据集。

默认命令会从 outputs/<exchange>-futures.json 合并已纳入记录，生成最终 CSV、JSON
与数据质量报告。--check 仅校验现有输入及最终 JSON，不改写任何文件。
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import re
import sys
from datetime import date
from decimal import Decimal
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = ROOT / "outputs"
SCHEMA_PATH = OUTPUTS / "futures-contracts.schema.json"
UNRESOLVED_CONTRACTS = OUTPUTS / "unresolved-contracts.csv"
EXCHANGES = ("CFFEX", "SHFE", "INE", "DCE", "CZCE", "GFEX")
INPUT_STEMS = {
    "CFFEX": "cffex-futures.json",
    "SHFE": "shfe-futures.json",
    "INE": "ine-futures.json",
    "DCE": "dce-futures.json",
    "CZCE": "czce-futures.json",
    "GFEX": "gfex-futures.json",
}
EXCHANGE_NAMES = {
    "CFFEX": "中国金融期货交易所",
    "SHFE": "上海期货交易所",
    "INE": "上海国际能源交易中心",
    "DCE": "大连商品交易所",
    "CZCE": "郑州商品交易所",
    "GFEX": "广州期货交易所",
}
OFFICIAL_DOMAINS = {
    "CFFEX": {"www.cffex.com.cn", "cffex.com.cn"},
    "SHFE": {"www.shfe.com.cn", "shfe.com.cn"},
    "INE": {"www.ine.cn", "ine.cn"},
    "DCE": {"www.dce.com.cn", "dce.com.cn"},
    "CZCE": {"www.czce.com.cn", "czce.com.cn"},
    "GFEX": {"www.gfex.com.cn", "gfex.com.cn"},
}
FIELDS = [
    "exchange", "exchangeName", "name", "symbol", "productType", "tradingUnit",
    "quoteUnit", "contractMultiplier", "multiplierUnit", "minTick", "tickUnit",
    "tickValue", "sourceUrl", "sourceTitle", "sourcePublishedAt", "verificationStatus", "verifiedAt", "notes",
]
NUMERIC_FIELDS = ("contractMultiplier", "minTick", "tickValue")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
PRODUCT_TYPES = {'commodity', 'stock_index', 'treasury_bond', 'freight_index'}


class ValidationError(ValueError):
    """输入或最终数据未满足基础参数库不变量。"""


def resolve_schema(schema: dict, root: dict) -> dict:
    reference = schema.get('$ref')
    if not reference:
        return schema
    if not reference.startswith('#/'):
        raise ValidationError(f'不支持的 JSON Schema 引用：{reference}')
    resolved: object = root
    for part in reference[2:].split('/'):
        if not isinstance(resolved, dict) or part not in resolved:
            raise ValidationError(f'JSON Schema 引用不存在：{reference}')
        resolved = resolved[part]
    if not isinstance(resolved, dict):
        raise ValidationError(f'JSON Schema 引用不是对象：{reference}')
    return resolved


def validate_json_schema(value: object, schema: dict, root: dict, path: str = '$') -> None:
    schema = resolve_schema(schema, root)
    expected_type = schema.get('type')
    type_matches = {
        'array': isinstance(value, list),
        'object': isinstance(value, dict),
        'string': isinstance(value, str),
        'number': isinstance(value, (int, float)) and not isinstance(value, bool),
    }
    if expected_type and not type_matches.get(expected_type, False):
        raise ValidationError(f'JSON Schema {path}: 应为 {expected_type}')
    if 'enum' in schema and value not in schema['enum']:
        raise ValidationError(f'JSON Schema {path}: 不属于允许枚举 {schema["enum"]}')
    if isinstance(value, str):
        if len(value) < schema.get('minLength', 0):
            raise ValidationError(f'JSON Schema {path}: 字符串长度不足')
        if pattern := schema.get('pattern'):
            if not re.fullmatch(pattern, value):
                raise ValidationError(f'JSON Schema {path}: 不匹配模式 {pattern}')
        if schema.get('format') == 'uri':
            parsed = urlparse(value)
            if parsed.scheme not in {'http', 'https'} or not parsed.hostname:
                raise ValidationError(f'JSON Schema {path}: 不是绝对 URI')
        if schema.get('format') == 'date':
            try:
                date.fromisoformat(value)
            except ValueError as exc:
                raise ValidationError(f'JSON Schema {path}: 不是有效日期') from exc
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if 'exclusiveMinimum' in schema and value <= schema['exclusiveMinimum']:
            raise ValidationError(f'JSON Schema {path}: 必须大于 {schema["exclusiveMinimum"]}')
    if isinstance(value, list):
        item_schema = schema.get('items')
        if isinstance(item_schema, dict):
            for index, item in enumerate(value):
                validate_json_schema(item, item_schema, root, f'{path}[{index}]')
    if isinstance(value, dict):
        required = schema.get('required', [])
        missing = [field for field in required if field not in value]
        if missing:
            raise ValidationError(f'JSON Schema {path}: 缺少必填字段 {missing}')
        properties = schema.get('properties', {})
        if schema.get('additionalProperties') is False:
            extra = sorted(set(value) - set(properties))
            if extra:
                raise ValidationError(f'JSON Schema {path}: 存在未声明字段 {extra}')
        for field, child_schema in properties.items():
            if field in value and isinstance(child_schema, dict):
                validate_json_schema(value[field], child_schema, root, f'{path}.{field}')


def validate_schema(records: list[dict]) -> None:
    try:
        schema = json.loads(SCHEMA_PATH.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValidationError(f'无法读取 JSON Schema：{exc}') from exc
    if not isinstance(schema, dict):
        raise ValidationError('JSON Schema 顶层必须为对象')
    validate_json_schema(records, schema, schema)


def read_json(path: Path) -> list[dict]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValidationError(f"无法读取 JSON：{path}: {exc}") from exc
    if not isinstance(value, list):
        raise ValidationError(f"JSON 顶层必须为数组：{path}")
    return value


def assert_positive_number(record: dict, field: str, context: str) -> None:
    value = record.get(field)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValidationError(f"{context}: {field} 必须是 JSON 数值")
    if not math.isfinite(value) or value <= 0:
        raise ValidationError(f"{context}: {field} 必须是有限正数，实际为 {value!r}")


def validate_record(record: dict, expected_exchange: str, seen: set[tuple[str, str]]) -> None:
    context = f"{record.get('exchange', '?')}:{record.get('symbol', '?')}"
    if not isinstance(record, dict):
        raise ValidationError(f"{context}: 记录必须为对象")
    if list(record.keys()) != FIELDS:
        raise ValidationError(f"{context}: 字段顺序或字段集合不符合最终数据规范")
    if record["exchange"] != expected_exchange:
        raise ValidationError(f"{context}: 文件归属应为 {expected_exchange}")
    if record["exchangeName"] != EXCHANGE_NAMES[expected_exchange]:
        raise ValidationError(f"{context}: exchangeName 与 exchange 不匹配")
    if record["productType"] not in PRODUCT_TYPES:
        raise ValidationError(f"{context}: productType 不属于合法枚举")
    if not isinstance(record["symbol"], str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9]*", record["symbol"]):
        raise ValidationError(f"{context}: symbol 格式无效")
    key = (record["exchange"], record["symbol"])
    if key in seen:
        raise ValidationError(f"{context}: 同一交易所内 symbol 重复")
    seen.add(key)
    for field in NUMERIC_FIELDS:
        assert_positive_number(record, field, context)
    expected = Decimal(str(record["contractMultiplier"])) * Decimal(str(record["minTick"]))
    actual = Decimal(str(record["tickValue"]))
    if abs(actual - expected) > Decimal("0.000000001"):
        raise ValidationError(f"{context}: tickValue={actual}，应为 {expected}")
    parsed = urlparse(record["sourceUrl"])
    if parsed.scheme not in {"http", "https"} or parsed.hostname not in OFFICIAL_DOMAINS[expected_exchange]:
        raise ValidationError(f"{context}: sourceUrl 不是 {expected_exchange} 官方域名：{record['sourceUrl']}")
    verification_status = record["verificationStatus"]
    if verification_status not in {"official-static", "user-confirmed"}:
        raise ValidationError(f"{context}: verificationStatus 必须是 official-static 或 user-confirmed")
    verified_at = record["verifiedAt"]
    source_published_at = record["sourcePublishedAt"]
    if not isinstance(source_published_at, str) or (source_published_at and not DATE_RE.fullmatch(source_published_at)):
        raise ValidationError(f"{context}: sourcePublishedAt 必须为空或 YYYY-MM-DD")
    if source_published_at:
        try:
            source_published_date = date.fromisoformat(source_published_at)
        except ValueError as exc:
            raise ValidationError(f"{context}: sourcePublishedAt 不是有效日期：{source_published_at}") from exc
        if source_published_date > date.today():
            raise ValidationError(f"{context}: sourcePublishedAt 不能晚于当前日期")
    if not isinstance(verified_at, str) or not DATE_RE.fullmatch(verified_at):
        raise ValidationError(f"{context}: verifiedAt 必须是 YYYY-MM-DD")
    try:
        verified_date = date.fromisoformat(verified_at)
    except ValueError as exc:
        raise ValidationError(f"{context}: verifiedAt 不是有效日期：{verified_at}") from exc
    if verified_date > date.today():
        raise ValidationError(f"{context}: verifiedAt 不能晚于当前日期")
    for field in ("name", "productType", "tradingUnit", "quoteUnit", "multiplierUnit", "tickUnit", "sourceTitle", "notes"):
        if not isinstance(record[field], str) or not record[field].strip():
            raise ValidationError(f"{context}: {field} 必须是非空字符串")


def load_inputs() -> tuple[list[dict], dict[str, int]]:
    records: list[dict] = []
    counts: dict[str, int] = {}
    seen: set[tuple[str, str]] = set()
    for exchange in EXCHANGES:
        rows = read_json(OUTPUTS / INPUT_STEMS[exchange])
        for row in rows:
            validate_record(row, exchange, seen)
        counts[exchange] = len(rows)
        records.extend(rows)
    records.sort(key=lambda row: (EXCHANGES.index(row["exchange"]), row["symbol"]))
    validate_schema(records)
    return records, counts


def read_unresolved_contracts() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for path in sorted(OUTPUTS.glob('unresolved-*.csv')):
        if path.name in {'unresolved-exchange-fee-margin.csv', 'unresolved-fee-margins.csv', 'unresolved-contracts.csv'}:
            continue
        with path.open(encoding='utf-8-sig', newline='') as handle:
            for row in csv.DictReader(handle):
                rows.append({'source': path.name, **row})
    return rows


def write_unresolved_contracts(rows: list[dict[str, str]]) -> None:
    normalized = []
    for row in rows:
        key = row.get('key') or ':'.join(filter(None, (row.get('exchange', ''), row.get('symbol', '')))) or '未标识'
        reason = row.get('reason') or json.dumps({field: value for field, value in row.items() if field != 'source'}, ensure_ascii=False)
        normalized.append({'source': row.get('source', ''), 'kind': row.get('kind', 'contract-record'), 'key': key, 'reason': reason})
    with UNRESOLVED_CONTRACTS.open('w', encoding='utf-8-sig', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=['source', 'kind', 'key', 'reason'])
        writer.writeheader(); writer.writerows(normalized)


def assert_generated_contracts_match_inputs(records: list[dict]) -> None:
    try:
        generated = read_json(OUTPUTS / 'china-futures-contracts.json')
    except ValidationError:
        raise
    if generated != records:
        raise ValidationError('固定参数源数据与 outputs/china-futures-contracts.json 不一致；请运行 npm run data:update')


def write_outputs(records: list[dict], counts: dict[str, int]) -> None:
    (OUTPUTS / "china-futures-contracts.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    with (OUTPUTS / "china-futures-contracts.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(records)

    unresolved = read_unresolved_contracts()
    write_unresolved_contracts(unresolved)
    verified_dates = sorted({row["verifiedAt"] for row in records})
    recent = max(verified_dates) if verified_dates else "无已核实记录"
    lines = [
        "# 中国境内期货固定合约参数：数据质量报告",
        "",
        "## 覆盖情况",
        "",
        "| 交易所 | 已纳入最终数据集的品种数 |",
        "| --- | ---: |",
    ]
    lines.extend(f"| {exchange}（{EXCHANGE_NAMES[exchange]}） | {counts[exchange]} |" for exchange in EXCHANGES)
    lines.extend([
        f"| **合计** | **{len(records)}** |",
        "",
        "## 核验结果",
        "",
        "- 同一交易所内交易代码重复：0。",
        f"- 数值字段为有限正数且每跳公式 `tickValue = contractMultiplier × minTick`：{len(records)}/{len(records)} 通过。",
        "- 来源域名：全部匹配相应交易所官方域名白名单。",
        f"- 官方静态核验记录：{sum(row['verificationStatus'] == 'official-static' for row in records)} 条；用户确认记录：{sum(row['verificationStatus'] == 'user-confirmed' for row in records)} 条。",
        f"- 最近核对日期：{recent}。",
        f"- 固定参数未解决项（unresolved-contracts）：{len(unresolved)}。未解决项不会纳入 `china-futures-contracts.json` 或 CSV。",
        "",
        "## 固定参数未解决项（unresolved-contracts）",
        "",
    ])
    if unresolved:
        all_fields = list(dict.fromkeys(field for row in unresolved for field in row.keys()))
        lines.append("| " + " | ".join(all_fields) + " |")
        lines.append("| " + " | ".join("---" for _ in all_fields) + " |")
        for row in unresolved:
            lines.append("| " + " | ".join(row.get(field, "").replace("|", "\\|").replace("\n", "<br>") for field in all_fields) + " |")
    else:
        lines.append("无。")
    lines.extend([
        "",
        "## 缺失说明",
        "",
        "DCE 与 CZCE 的用户确认记录来自用户明确确认的附件 DCE-CZCE-selected-contracts.xlsx；网页会显示“用户确认”状态，不能表述为官方静态核验。",
    ])
    (OUTPUTS / "data-quality-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def validate_final() -> tuple[list[dict], dict[str, int]]:
    records = read_json(OUTPUTS / "china-futures-contracts.json")
    validate_schema(records)
    seen: set[tuple[str, str]] = set()
    counts = {exchange: 0 for exchange in EXCHANGES}
    for record in records:
        exchange = record.get("exchange") if isinstance(record, dict) else None
        if exchange not in EXCHANGES:
            raise ValidationError(f"最终数据包含无效 exchange：{exchange!r}")
        validate_record(record, exchange, seen)
        counts[exchange] += 1
    with (OUTPUTS / "china-futures-contracts.csv").open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != FIELDS:
            raise ValidationError("最终 CSV 的字段顺序或字段集合不符合规范")
        csv_rows = list(reader)
    if len(csv_rows) != len(records):
        raise ValidationError("最终 CSV 与 JSON 记录数不一致")
    for index, (csv_row, record) in enumerate(zip(csv_rows, records), start=1):
        for field in FIELDS:
            if csv_row[field] != str(record[field]):
                raise ValidationError(f"最终 CSV 与 JSON 第 {index} 行字段 {field} 不一致")
    return records, counts


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="仅校验现有最终数据，不重建文件")
    args = parser.parse_args()
    try:
        if args.check:
            source_records, _ = load_inputs()
            assert_generated_contracts_match_inputs(source_records)
            records, counts = validate_final()
        else:
            records, counts = load_inputs()
            write_outputs(records, counts)
            records, counts = validate_final()
    except ValidationError as exc:
        print(f"校验失败：{exc}", file=sys.stderr)
        return 1
    print(f"JSON Schema 校验通过：{len(records)} 条记录。")
    print(f"校验通过：{len(records)} 条已纳入记录；" + "，".join(f"{key}={counts[key]}" for key in EXCHANGES))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
