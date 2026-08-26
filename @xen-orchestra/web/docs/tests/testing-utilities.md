# Testing pure utilities

Utility functions (`*.util.ts`) are pure — import and call them directly, and assert `input → output`. No mounting, no mocks.

```typescript
describe('buildHostCpuUsageSeries', () => {
  it('averages the usage across all cpus at each index', () => {
    const data = createHostStats({ stats: { cpus: { cpu0: [10, 20], cpu1: [30, 40] } } })

    expect(buildHostCpuUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 20 },
      { timestamp: 1_000_000, value: 30 },
    ])
  })

  it('returns an empty array for null data', () => {
    expect(buildHostCpuUsageSeries(null)).toEqual([])
  })
})
```

Cover the meaningful edge cases: empty input, missing samples (`NaN` propagation), `null` data, and boundary rounding.

> **Prefer extracting pure logic into a util.** When a `<script setup>` holds non-trivial logic (chart series, formatting, aggregation), pull it into `modules/<mod>/utils/*.util.ts` and unit-test that — a component should not carry much complex logic. This is how the Pool and Host dashboard chart logic was made testable (`xo-pool-dashboard.util.ts`, `xo-host-dashboard.util.ts`). What remains in the component is then rendering, covered by [Testing components](./testing-components.md).
