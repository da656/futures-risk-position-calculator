import { describe, expect, it } from 'vitest'
import { estimateFeePerLot } from './fees'

describe('手续费估算', () => {
  it('固定手续费不受价格影响', () => {
    expect(estimateFeePerLot({ kind: 'fixed', amountPerLot: 3 }, 2488, 10)).toBe(3)
  })

  it('比例手续费按价格和合约乘数估算元每手', () => {
    expect(estimateFeePerLot({ kind: 'rate', rate: 0.0001 }, 2488, 10)).toBeCloseTo(2.488)
  })
})
