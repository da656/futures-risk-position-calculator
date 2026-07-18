// 此文件由 scripts/sync_exchange_fee_margins.py 从 outputs/exchange-fee-margin.json 生成。
// 数据来自用户确认的交易所费用保证金快照；未匹配品种不会自动带入。

import type { FeeRule } from '../types/position'

export interface ExchangeFeeMargin {
  exchange: 'CFFEX' | 'SHFE' | 'INE' | 'DCE' | 'CZCE' | 'GFEX'
  symbol: string
  marginRate: number
  openFee: FeeRule
  closeFee: FeeRule
  sourceStatus: 'user-confirmed-snapshot'
}

export const exchangeFeeMargins: ExchangeFeeMargin[] = [
  {
    "exchange": "CFFEX",
    "symbol": "IC",
    "marginRate": 0.12,
    "openFee": {
      "kind": "rate",
      "rate": 2.3e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 2.3e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CFFEX",
    "symbol": "IF",
    "marginRate": 0.12,
    "openFee": {
      "kind": "rate",
      "rate": 2.3e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 2.3e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CFFEX",
    "symbol": "IH",
    "marginRate": 0.12,
    "openFee": {
      "kind": "rate",
      "rate": 2.3e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 2.3e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CFFEX",
    "symbol": "IM",
    "marginRate": 0.12,
    "openFee": {
      "kind": "rate",
      "rate": 2.3e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 2.3e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CFFEX",
    "symbol": "TL",
    "marginRate": 0.035,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CFFEX",
    "symbol": "TS",
    "marginRate": 0.005,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "AP",
    "marginRate": 0.09,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 5.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 5.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "CF",
    "marginRate": 0.07,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 4.3
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 4.3
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "CJ",
    "marginRate": 0.08,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "CY",
    "marginRate": 0.05,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 1.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 1.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "FG",
    "marginRate": 0.09,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "MA",
    "marginRate": 0.1,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "OI",
    "marginRate": 0.07,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "PF",
    "marginRate": 0.1,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "PK",
    "marginRate": 0.07,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "PR",
    "marginRate": 0.1,
    "openFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "PX",
    "marginRate": 0.1,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "RM",
    "marginRate": 0.07,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 1.5
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 1.5
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "SA",
    "marginRate": 0.08,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "SF",
    "marginRate": 0.07,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "SH",
    "marginRate": 0.08,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "SM",
    "marginRate": 0.07,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "SR",
    "marginRate": 0.06,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "TA",
    "marginRate": 0.1,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "CZCE",
    "symbol": "UR",
    "marginRate": 0.08,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "A",
    "marginRate": 0.07,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "B",
    "marginRate": 0.07,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 1.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 1.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "BB",
    "marginRate": 0.15,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "C",
    "marginRate": 0.07,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 1.2
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 1.2
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "CS",
    "marginRate": 0.06,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 1.5
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 1.5
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "EB",
    "marginRate": 0.13,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "EG",
    "marginRate": 0.13,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "FB",
    "marginRate": 0.1,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "I",
    "marginRate": 0.11,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "J",
    "marginRate": 0.12,
    "openFee": {
      "kind": "rate",
      "rate": 0.00014
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "JD",
    "marginRate": 0.07,
    "openFee": {
      "kind": "rate",
      "rate": 0.00015
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.00015
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "JM",
    "marginRate": 0.12,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "LG",
    "marginRate": 0.08,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "LH",
    "marginRate": 0.08,
    "openFee": {
      "kind": "rate",
      "rate": 0.0002
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "M",
    "marginRate": 0.07,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 1.5
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 1.5
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "P",
    "marginRate": 0.08,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 2.5
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 2.5
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "PG",
    "marginRate": 0.16,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 6.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 6.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "RR",
    "marginRate": 0.06,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 1.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 1.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "DCE",
    "symbol": "Y",
    "marginRate": 0.07,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 2.5
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 2.5
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "GFEX",
    "symbol": "LC",
    "marginRate": 0.15,
    "openFee": {
      "kind": "rate",
      "rate": 0.00016
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.00016
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "GFEX",
    "symbol": "PD",
    "marginRate": 0.16,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "GFEX",
    "symbol": "PS",
    "marginRate": 0.13,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "GFEX",
    "symbol": "PT",
    "marginRate": 0.16,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "GFEX",
    "symbol": "SI",
    "marginRate": 0.1,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "INE",
    "symbol": "BC",
    "marginRate": 0.11,
    "openFee": {
      "kind": "rate",
      "rate": 1e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 1e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "INE",
    "symbol": "EC",
    "marginRate": 0.22,
    "openFee": {
      "kind": "rate",
      "rate": 0.0006
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0006
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "INE",
    "symbol": "LU",
    "marginRate": 0.16,
    "openFee": {
      "kind": "rate",
      "rate": 1e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 1e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "INE",
    "symbol": "NR",
    "marginRate": 0.11,
    "openFee": {
      "kind": "rate",
      "rate": 2e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 2e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "INE",
    "symbol": "SC",
    "marginRate": 0.16,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 20.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 20.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "AD",
    "marginRate": 0.1,
    "openFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "AG",
    "marginRate": 0.22,
    "openFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "AL",
    "marginRate": 0.11,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "AO",
    "marginRate": 0.11,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "AU",
    "marginRate": 0.16,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 20.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 20.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "BR",
    "marginRate": 0.14,
    "openFee": {
      "kind": "rate",
      "rate": 2e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 2e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "BU",
    "marginRate": 0.14,
    "openFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "CU",
    "marginRate": 0.11,
    "openFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "FU",
    "marginRate": 0.16,
    "openFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "HC",
    "marginRate": 0.07,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "NI",
    "marginRate": 0.12,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "OP",
    "marginRate": 0.09,
    "openFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "PB",
    "marginRate": 0.11,
    "openFee": {
      "kind": "rate",
      "rate": 4e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 4e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "RB",
    "marginRate": 0.07,
    "openFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "closeFee": {
      "kind": "rate",
      "rate": 0.0001
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "RU",
    "marginRate": 0.11,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "SN",
    "marginRate": 0.14,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "SP",
    "marginRate": 0.09,
    "openFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 5e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "SS",
    "marginRate": 0.1,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 2.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "WR",
    "marginRate": 0.1,
    "openFee": {
      "kind": "rate",
      "rate": 4e-05
    },
    "closeFee": {
      "kind": "rate",
      "rate": 4e-05
    },
    "sourceStatus": "user-confirmed-snapshot"
  },
  {
    "exchange": "SHFE",
    "symbol": "ZN",
    "marginRate": 0.11,
    "openFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "closeFee": {
      "kind": "fixed",
      "amountPerLot": 3.0
    },
    "sourceStatus": "user-confirmed-snapshot"
  }
]

const feeMarginByKey = new Map(exchangeFeeMargins.map((item) => [`${item.exchange}:${item.symbol}`, item]))

export const findExchangeFeeMargin = (exchange: ExchangeFeeMargin['exchange'], symbol: string): ExchangeFeeMargin | undefined =>
  feeMarginByKey.get(`${exchange}:${symbol.toUpperCase()}`)
