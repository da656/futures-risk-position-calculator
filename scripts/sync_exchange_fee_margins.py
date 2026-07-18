#!/usr/bin/env python
"""将动态费用参数 JSON 同步为前端 TypeScript 数据模块。"""
from __future__ import annotations
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'outputs' / 'exchange-fee-margin.json'
TARGET = ROOT / 'src' / 'data' / 'exchangeFeeMargins.ts'


def render() -> str:
    records = json.loads(SOURCE.read_text(encoding='utf-8'))
    if not isinstance(records, list):
        raise SystemExit('动态费用最终 JSON 顶层必须为数组')
    body = json.dumps(records, ensure_ascii=False, indent=2)
    return f"""// 此文件由 scripts/sync_exchange_fee_margins.py 从 outputs/exchange-fee-margin.json 生成。
// 数据来自用户确认的交易所费用保证金快照；未匹配品种不会自动带入。

import type {{ FeeRule }} from '../types/position'

export interface ExchangeFeeMargin {{
  exchange: 'CFFEX' | 'SHFE' | 'INE' | 'DCE' | 'CZCE' | 'GFEX'
  symbol: string
  marginRate: number
  openFee: FeeRule
  closeFee: FeeRule
  sourceStatus: 'user-confirmed-snapshot'
}}

export const exchangeFeeMargins: ExchangeFeeMargin[] = {body}

const feeMarginByKey = new Map(exchangeFeeMargins.map((item) => [`${{item.exchange}}:${{item.symbol}}`, item]))

export const findExchangeFeeMargin = (exchange: ExchangeFeeMargin['exchange'], symbol: string): ExchangeFeeMargin | undefined =>
  feeMarginByKey.get(`${{exchange}}:${{symbol.toUpperCase()}}`)
"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='仅检查前端动态费用模块是否需要同步')
    args = parser.parse_args()
    output = render()
    if args.check:
        if TARGET.read_text(encoding='utf-8') != output:
            raise SystemExit('前端动态费用模块已过期；请运行 npm run data:update')
        print(f'动态费用同步校验通过：{TARGET.relative_to(ROOT)}')
        return
    TARGET.write_text(output, encoding='utf-8')
    print(f'已同步动态费用到 {TARGET.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
