import type { VdfHostStats, VdfRuleLogEntry } from '@/modules/vdf/types.ts'
import type { LinearChartData } from '@core/types/chart.ts'

// FIREWALL CHARTS (vdf#59): the series of the Live and rule log charts

// one sample of a host's (or a VM's) new connections, per second
export type VdfRatePoint = { at: number; allowed: number; dropped: number }

export type VdfRateSeries = { allowed: LinearChartData[number]['data']; dropped: LinearChartData[number]['data'] }

// A host's samples: the history its agent keeps, else what this page
// collected from it (an agent before the history). With a VM: its rates
// (a point that doesn't list it had none).
export function hostRatePoints(host: VdfHostStats, collected: VdfRatePoint[] = [], vmId?: string): VdfRatePoint[] {
  if (host.history === undefined || host.history.length === 0) {
    return collected
  }

  return host.history.flatMap(point => {
    const at = Date.parse(point.at)

    if (Number.isNaN(at)) {
      return []
    }

    if (vmId === undefined) {
      return [{ at, allowed: point.allowedPerSec, dropped: point.blockedPerSec }]
    }

    const [allowed, dropped] = point.vms?.[vmId] ?? [0, 0]

    return [{ at, allowed, dropped }]
  })
}

// What this page samples from a host at each poll, for an agent without
// history: the host's rates, or a VM's.
export function sampleOf(host: VdfHostStats, vmId?: string): VdfRatePoint | undefined {
  const at = Date.parse(host.at ?? '')

  if (Number.isNaN(at)) {
    return undefined
  }

  if (vmId === undefined) {
    return { at, allowed: host.newAllowedPerSec ?? 0, dropped: host.newBlockedPerSec ?? 0 }
  }

  const vm = host.vms?.find(candidate => candidate.uuid === vmId)

  return { at, allowed: vm?.allowedPerSec ?? 0, dropped: vm?.blockedPerSec ?? 0 }
}

// The hosts' rates added up, per bucket of bucketMs from `since` to
// `until`: each host's mean in the bucket (two pages polling make denser
// samples, not higher rates); a bucket no host has a sample in is a gap
// (null), not a zero: nothing looked then.
export function sumRateSeries(
  hosts: VdfRatePoint[][],
  { since, until, bucketMs }: { since: number; until: number; bucketMs: number }
): VdfRateSeries {
  const first = Math.floor(since / bucketMs)
  const count = Math.max(0, Math.floor(until / bucketMs) - first + 1)
  const allowed = new Array<number | null>(count).fill(null)
  const dropped = new Array<number | null>(count).fill(null)

  for (const points of hosts) {
    const sums = new Map<number, { allowed: number; dropped: number; n: number }>()

    for (const point of points) {
      const index = Math.floor(point.at / bucketMs) - first

      if (index < 0 || index >= count) {
        continue
      }

      const sum = sums.get(index) ?? { allowed: 0, dropped: 0, n: 0 }

      sum.allowed += point.allowed
      sum.dropped += point.dropped
      sum.n++
      sums.set(index, sum)
    }

    for (const [index, sum] of sums) {
      allowed[index] = (allowed[index] ?? 0) + sum.allowed / sum.n
      dropped[index] = (dropped[index] ?? 0) + sum.dropped / sum.n
    }
  }

  const timestamp = (index: number) => (first + index) * bucketMs

  return {
    allowed: allowed.map((value, index) => ({ timestamp: timestamp(index), value })),
    dropped: dropped.map((value, index) => ({ timestamp: timestamp(index), value })),
  }
}

// The rule log's entries per minute (or bucketMs): dropped and allowed
// packets or connections, the agent's suppressed lines included, from
// `since` (the first bucket the entries cover, at most) to `until`. Unlike
// the Live rates, an empty bucket is a zero: the log was read, nothing was
// logged.
export function logRateSeries(
  entries: VdfRuleLogEntry[],
  { since, until, bucketMs }: { since: number; until: number; bucketMs: number }
): VdfRateSeries {
  const first = Math.floor(since / bucketMs)
  const count = Math.max(0, Math.floor(until / bucketMs) - first + 1)
  const allowed = new Array<number>(count).fill(0)
  const dropped = new Array<number>(count).fill(0)

  for (const entry of entries) {
    const index = Math.floor(Date.parse(entry.time) / bucketMs) - first

    if (!(index >= 0 && index < count)) {
      continue
    }

    const n = 1 + (entry.suppressed ?? 0)

    if (entry.verdict === 'DROP') {
      dropped[index] += n
    } else {
      allowed[index] += n
    }
  }

  const timestamp = (index: number) => (first + index) * bucketMs

  return {
    allowed: allowed.map((value, index) => ({ timestamp: timestamp(index), value })),
    dropped: dropped.map((value, index) => ({ timestamp: timestamp(index), value })),
  }
}

// a y-axis top for small rates: a round number above the highest value
// (1, 2, 5, 10, 20, 50…), so a quiet chart isn't drawn against 200
export function niceMax(series: VdfRateSeries) {
  const highest = Math.max(0, ...[...series.allowed, ...series.dropped].map(point => point.value ?? 0))

  for (let scale = 1; ; scale *= 10) {
    for (const step of [1, 2, 5]) {
      if (highest <= step * scale) {
        return step * scale
      }
    }
  }
}
