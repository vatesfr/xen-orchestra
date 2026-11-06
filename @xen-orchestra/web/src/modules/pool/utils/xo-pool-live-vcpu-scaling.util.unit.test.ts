import {
  getEffectiveVcpusMax,
  getHostCores,
  getLiveVcpuScalingCap,
  isValidLiveVcpuScalingMax,
} from '@/modules/pool/utils/xo-pool-live-vcpu-scaling.util.ts'
import { describe, expect, it } from 'vitest'

const host = (cpuCount: number, threadsPerCore = 1) => ({
  CPUs: { cpu_count: String(cpuCount), threads_per_core: String(threadsPerCore) },
})

describe('getHostCores', () => {
  it('counts physical cores', () => {
    expect(getHostCores({ cpu_count: '16', threads_per_core: '2' })).toBe(8)
    expect(getHostCores({ cpu_count: '4', threads_per_core: '1' })).toBe(4)
  })

  it('falls back to the thread count without threads_per_core', () => {
    expect(getHostCores({ cpu_count: '12' })).toBe(12)
  })

  it('returns undefined without CPU information', () => {
    expect(getHostCores(undefined)).toBeUndefined()
    expect(getHostCores({})).toBeUndefined()
  })
})

describe('getLiveVcpuScalingCap', () => {
  it('is the smallest host', () => {
    expect(getLiveVcpuScalingCap([host(64, 2), host(16, 2), host(48)])).toBe(8)
  })

  it('is undefined without hosts', () => {
    expect(getLiveVcpuScalingCap([])).toBeUndefined()
  })
})

describe('getEffectiveVcpusMax', () => {
  it('is the setting when hosts are large enough', () => {
    expect(getEffectiveVcpusMax(16, [host(64, 2)])).toBe(16)
  })

  it('is capped by the smallest host', () => {
    expect(getEffectiveVcpusMax(16, [host(64, 2), host(8, 2)])).toBe(4)
  })

  it('keeps a multiple of the cores per socket', () => {
    expect(getEffectiveVcpusMax(16, [host(64)], 3)).toBe(15)
    expect(getEffectiveVcpusMax(16, [host(6)], 4)).toBe(4)
  })

  it('is undefined when the pool did not opt in', () => {
    expect(getEffectiveVcpusMax(undefined, [host(64)])).toBeUndefined()
  })
})

describe('isValidLiveVcpuScalingMax', () => {
  it('accepts integers from 2 to 128', () => {
    expect(isValidLiveVcpuScalingMax(2)).toBe(true)
    expect(isValidLiveVcpuScalingMax(128)).toBe(true)
  })

  it('refuses anything else', () => {
    for (const value of [1, 129, 2.5, Number.NaN, '16', undefined, null]) {
      expect(isValidLiveVcpuScalingMax(value)).toBe(false)
    }
  })
})
