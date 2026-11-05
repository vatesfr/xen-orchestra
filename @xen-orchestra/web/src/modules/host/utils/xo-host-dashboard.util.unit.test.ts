import { buildHostLoadAverageSeries } from '@/modules/host/utils/xo-host-dashboard.util.ts'
import { createHostStats } from '@/test/create-host-stats.ts'

describe('buildHostLoadAverageSeries', () => {
  it('rounds each load sample to two decimals', () => {
    const data = createHostStats({ stats: { load: [1.234, 2.567] } })

    expect(buildHostLoadAverageSeries(data)).toEqual([
      { timestamp: 990_000, value: 1.23 },
      { timestamp: 1_000_000, value: 2.57 },
    ])
  })

  it('propagates NaN when a sample is missing', () => {
    const data = createHostStats({ stats: { load: [1.5, null] } })

    const series = buildHostLoadAverageSeries(data)

    expect(series[0].value).toBe(1.5)
    expect(series[1].value).toBeNaN()
  })

  it('returns an empty array when there are no load stats', () => {
    expect(buildHostLoadAverageSeries(createHostStats())).toEqual([])
  })

  it('returns an empty array when the load stats hold no samples', () => {
    expect(buildHostLoadAverageSeries(createHostStats({ stats: { load: [] } }))).toEqual([])
  })

  it('returns an empty array for null data', () => {
    expect(buildHostLoadAverageSeries(null)).toEqual([])
  })
})
