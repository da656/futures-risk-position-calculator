#!/usr/bin/env python
# 将已纳入的最终期货数据集同步为前端 TypeScript 数据模块。
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'outputs' / 'china-futures-contracts.json'
TARGET = ROOT / 'src' / 'data' / 'officialContracts.ts'
EXCHANGE_ORDER = ('CFFEX', 'SHFE', 'INE', 'DCE', 'CZCE', 'GFEX')


def render() -> str:
    records = json.loads(SOURCE.read_text(encoding='utf-8'))
    if not isinstance(records, list):
        raise SystemExit('最终数据集顶层必须是数组')
    if not records:
        raise SystemExit('最终数据集不能为空')
    if any(record['exchange'] not in EXCHANGE_ORDER for record in records):
        raise SystemExit('前端选择器不能包含不受支持交易所的记录')
    ids = [f"{record['exchange'].lower()}-{record['symbol'].lower()}" for record in records]
    if len(ids) != len(set(ids)):
        raise SystemExit('前端合约 id 重复')
    records.sort(key=lambda item: (EXCHANGE_ORDER.index(item['exchange']), item['symbol']))
    mapped = [
        {
            'id': f"{record['exchange'].lower()}-{record['symbol'].lower()}",
            'exchangeCode': record['exchange'],
            'exchange': record['exchangeName'],
            'name': record['name'],
            'symbol': record['symbol'],
            'tradingUnit': record['tradingUnit'],
            'quoteUnit': record['quoteUnit'],
            'multiplier': record['contractMultiplier'],
            'tickSize': record['minTick'],
            'tickValue': record['tickValue'],
            'sourceUrl': record['sourceUrl'],
            'sourceTitle': record['sourceTitle'],
            'sourcePublishedAt': record['sourcePublishedAt'],
            'verificationStatus': record['verificationStatus'],
            'verifiedAt': record['verifiedAt'],
            'notes': record['notes'],
        }
        for record in records
    ]
    body = json.dumps(mapped, ensure_ascii=False, indent=2)
    output = f'''// 此文件由 scripts/sync_official_contracts.py 从 outputs/china-futures-contracts.json 生成。
// 请勿手工编辑；先运行 npm run data:build，再运行 npm run data:sync。

import type {{ ContractSpec }} from '../types/position'

export interface OfficialContract {{
  id: string
  exchangeCode: 'CFFEX' | 'SHFE' | 'INE' | 'DCE' | 'CZCE' | 'GFEX'
  exchange: string
  name: string
  symbol: string
  tradingUnit: string
  quoteUnit: string
  multiplier: number
  tickSize: number
  tickValue: number
  sourceUrl: string
  sourceTitle: string
  sourcePublishedAt: string
  verificationStatus: 'official-static' | 'user-confirmed'
  verifiedAt: string
  notes: string
}}

export interface DynamicContractDefaults {{
  marginRate: number
}}

export const officialContracts: OfficialContract[] = {body}

/** 将交易所已纳入的固定规格与用户提供的动态费用参数组合为计算器合约。 */
export const toContractSpec = (contract: OfficialContract, dynamic: DynamicContractDefaults): ContractSpec => ({{
  id: contract.id,
  exchange: contract.exchange,
  name: contract.name,
  symbol: contract.symbol,
  multiplier: contract.multiplier,
  tickSize: contract.tickSize,
  marginRate: dynamic.marginRate,
}})
'''
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='仅检查前端固定参数模块是否需要同步')
    args = parser.parse_args()
    output = render()
    if args.check:
        if TARGET.read_text(encoding='utf-8') != output:
            raise SystemExit('前端固定参数模块已过期；请运行 npm run data:update')
        print(f'固定参数同步校验通过：{TARGET.relative_to(ROOT)}')
        return
    TARGET.write_text(output, encoding='utf-8')
    print(f'已同步固定参数到 {TARGET.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
