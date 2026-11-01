import type { VdfHostStats, VdfRuleLogEntry } from '@/modules/vdf/types.ts'
import {
  hostRatePoints,
  logRateSeries,
  niceMax,
  sampleOf,
  sumRateSeries,
} from '@/modules/vdf/utils/vdf-rate-series.util.ts'
import { describe, expect, it } from 'vitest'

const T = Date.parse('2026-10-25T14:00:00Z')
const iso = (seconds: number) => new Date(T + seconds * 1000).toISOString()

const host = (fields: Partial<VdfHostStats> = {}): VdfHostStats => ({ host: 'h', hostName: 'h', ...fields })

describe('hostRatePoints', () => {
  it("takes the agent's history, a VM's rates from it (none when not listed)", () => {
    const stats = host({
      history: [
        { at: iso(0), allowedPerSec: 3, blockedPerSec: 1, vms: { app: [2, 1] } },
        { at: iso(4), allowedPerSec: 1, blockedPerSec: 0 },
      ],
    })

    expect(hostRatePoints(stats)).toEqual([
      { at: T, allowed: 3, dropped: 1 },
      { at: T + 4000, allowed: 1, dropped: 0 },
    ])
    expect(hostRatePoints(stats, [], 'app').map(point => [point.allowed, point.dropped])).toEqual([
      [2, 1],
      [0, 0],
    ])
  })

  it('falls back on what the page collected for an agent without history', () => {
    const collected = [{ at: T, allowed: 1, dropped: 2 }]

    expect(hostRatePoints(host(), collected)).toBe(collected)
    expect(sampleOf(host({ at: iso(8), newAllowedPerSec: 4, newBlockedPerSec: 0.5 }))).toEqual({
      at: T + 8000,
      allowed: 4,
      dropped: 0.5,
    })
    expect(sampleOf(host({ at: iso(8), vms: [] }), 'app')).toEqual({ at: T + 8000, allowed: 0, dropped: 0 })
    expect(sampleOf(host())).toBeUndefined()
  })
})

describe('sumRateSeries', () => {
  it("adds the hosts' means per bucket, a bucket nobody sampled is a gap", () => {
    const series = sumRateSeries(
      [
        // two samples in the first bucket (two pages polling): their mean
        [
          { at: T + 1000, allowed: 2, dropped: 0 },
          { at: T + 6000, allowed: 4, dropped: 2 },
          { at: T + 21000, allowed: 1, dropped: 1 },
        ],
        [{ at: T + 3000, allowed: 10, dropped: 1 }],
      ],
      { since: T, until: T + 29999, bucketMs: 10000 }
    )

    expect(series.allowed.map(point => point.value)).toEqual([13, null, 1])
    expect(series.dropped.map(point => point.value)).toEqual([2, null, 1])
    expect(series.allowed.map(point => point.timestamp)).toEqual([T, T + 10000, T + 20000])
  })

  it('leaves out samples outside the window', () => {
    const series = sumRateSeries([[{ at: T - 60000, allowed: 9, dropped: 9 }]], {
      since: T,
      until: T + 9999,
      bucketMs: 10000,
    })

    expect(series.allowed).toEqual([{ timestamp: T, value: null }])
  })
})

describe('logRateSeries', () => {
  const entry = (seconds: number, fields: Partial<VdfRuleLogEntry> = {}): VdfRuleLogEntry => ({
    time: iso(seconds),
    verdict: 'DROP',
    policy: 'app',
    tier: 'application',
    rule: 'default',
    proto: 'tcp',
    src: '10.0.0.1',
    dst: '10.0.0.2',
    host: 'h',
    hostName: 'h',
    ...fields,
  })

  it('counts per minute, suppressed lines included, an empty minute is zero', () => {
    const series = logRateSeries(
      [entry(5), entry(30, { suppressed: 4 }), entry(150, { verdict: 'ALLOW' }), entry(-3600)],
      { since: T, until: T + 179999, bucketMs: 60000 }
    )

    expect(series.dropped.map(point => point.value)).toEqual([6, 0, 0])
    expect(series.allowed.map(point => point.value)).toEqual([0, 0, 1])
  })
})

describe('niceMax', () => {
  it('rounds the highest value up to 1, 2 or 5 times a power of ten', () => {
    const series = (value: number | null) => ({ allowed: [{ timestamp: 0, value }], dropped: [] })

    expect(niceMax(series(0))).toBe(1)
    expect(niceMax(series(null))).toBe(1)
    expect(niceMax(series(1.4))).toBe(2)
    expect(niceMax(series(37))).toBe(50)
    expect(niceMax(series(120))).toBe(200)
  })
})
