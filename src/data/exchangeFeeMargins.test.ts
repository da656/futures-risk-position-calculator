import { describe, expect, it } from 'vitest'
import { findExchangeFeeMargin } from './exchangeFeeMargins'

describe('交易所保证金与手续费快照数据', () => {
  it('按交易所和品种代码精确返回甲醇的自动参数', () => {
    expect(findExchangeFeeMargin('CZCE', 'MA')).toMatchObject({
      marginRate: 0.1,
      openFee: { kind: 'rate', rate: 0.0001 },
      closeFee: { kind: 'rate', rate: 0.0001 },
      sourceStatus: 'user-confirmed-snapshot',
    })
  })

  it('不为未匹配品种虚构自动参数', () => {
    expect(findExchangeFeeMargin('CZCE', 'PL')).toBeUndefined()
  })

  it.each([
    ['DCE', 'V'],
    ['DCE', 'L'],
    ['DCE', 'PP'],
    ['CFFEX', 'T'],
  ] as const)('不自动接入重复快照键 %s:%s', (exchange, symbol) => {
    expect(findExchangeFeeMargin(exchange, symbol)).toBeUndefined()
  })
})
