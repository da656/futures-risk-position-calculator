import { describe, expect, it } from 'vitest'
import { officialContracts, toContractSpec } from './officialContracts'

describe('期货参数数据', () => {
  it('包含最终数据集中 86 个官方或用户确认品种', () => {
    expect(officialContracts).toHaveLength(86)
    expect(new Set(officialContracts.map((contract) => contract.id)).size).toBe(86)
    expect(officialContracts.some((contract) => contract.id === 'gfex-si')).toBe(true)
    expect(officialContracts.some((contract) => contract.id === 'ine-sc')).toBe(true)
    expect(officialContracts.some((contract) => contract.id === 'shfe-rb')).toBe(true)
    expect(officialContracts.some((contract) => contract.id === 'dce-lh')).toBe(true)
    expect(officialContracts.some((contract) => contract.id === 'czce-cf')).toBe(true)
    expect(officialContracts.some((contract) => contract.id === 'czce-cj')).toBe(true)
    expect(officialContracts.filter((contract) => contract.exchangeCode === 'DCE')).toHaveLength(22)
    expect(officialContracts.filter((contract) => contract.exchangeCode === 'CZCE')).toHaveLength(26)
    expect(officialContracts.find((contract) => contract.id === 'dce-m')).toMatchObject({
      name: '豆粕', multiplier: 10, tickSize: 1, tickValue: 10, verificationStatus: 'user-confirmed',
    })
    expect(officialContracts.find((contract) => contract.id === 'czce-ur')).toMatchObject({
      name: '尿素', multiplier: 20, tickSize: 1, tickValue: 20, verificationStatus: 'user-confirmed',
    })
    expect(officialContracts.find((contract) => contract.id === 'dce-lh')).toMatchObject({
      multiplier: 16,
      tickSize: 5,
      tickValue: 80,
      sourcePublishedAt: '2025-06-24',
    })
  })

  it('把已纳入的固定参数映射为可计算合约参数', () => {
    const silicon = officialContracts.find((contract) => contract.id === 'gfex-si')
    expect(silicon).toBeDefined()
    const spec = toContractSpec(silicon!, { marginRate: 0.15})

    expect(spec).toMatchObject({
      id: 'gfex-si',
      exchange: '广州期货交易所',
      name: '工业硅',
      symbol: 'SI',
      multiplier: 5,
      tickSize: 5,
      marginRate: 0.15,
    })
  })
})
