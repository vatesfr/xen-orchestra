import { createHostStats } from '@/test/create-host-stats.ts'
import type { XoHost } from '@vates/types'
import type { XapiHostStats, XapiPoolStats } from '@vates/types/common'

type PoolStatsEntry = Partial<XapiHostStats> | { error: Record<string, unknown> }

/**
 * Builds an `XapiPoolStats` from one entry per host. A `Partial<XapiHostStats>`
 * entry goes through {@link createHostStats}; an `{ error }` entry models a host
 * whose stats the pool could not fetch, which the API reports in place of them.
 */
export function createPoolStats(hosts: Record<string, PoolStatsEntry> = {}): XapiPoolStats {
  return Object.fromEntries(
    Object.entries(hosts).map(([hostId, entry]) => [
      hostId as XoHost['id'],
      'error' in entry ? entry : createHostStats(entry),
    ])
  )
}

// The pool stats no pool chart card can plot, keyed by what they lack, as the end of a test name
export const POOL_STATS_WITHOUT_SAMPLES = {
  'for a pool without host': createPoolStats(),
  'when the stats of every host failed': createPoolStats({ 'host-1': { error: { code: 'boom' } } }),
}
