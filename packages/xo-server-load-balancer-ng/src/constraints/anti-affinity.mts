import type { XoHost, XoVm } from '@vates/types'

import type { Constraint, MigrationPlan, Placement } from '../constraint.mjs'

/**
 * Anti-affinity constraint: VMs in the same group must be spread across
 * distinct hosts, minimising the difference in per-host group-VM count.
 *
 * Algorithm (greedy):
 *   1. Count group VMs per host from the current placement.
 *   2. While max_count − min_count > 1:
 *      a. Source = host with the most group VMs.
 *      b. Destination = host with the fewest group VMs where
 *         dest_count + 1 < source_count.
 *         (This condition ensures the move makes progress without overshoot.)
 *      c. VM = lexicographically smallest VM id on the source host.
 *         Within a single group all candidates yield the same count delta,
 *         so lex order gives deterministic, stable output.
 *      d. Record the move and update the simulated counts.
 *
 * Documented assumptions:
 *   - `vmIds` contains only VMs for which `VM.assert_can_migrate` succeeded on
 *     at least one available host (filtered upstream before constraint construction).
 *   - VMs absent from `placement` (e.g. stopped concurrently) are silently skipped.
 *   - Only hosts present in the `hosts` array are considered as destinations.
 */
export class AntiAffinityConstraint implements Constraint {
  // Higher priority than affinity (10 > 5) — applied first by the solver.
  readonly priority = 10

  constructor(
    /** The group name from `xo:load:balancer:anti-affinity=<group>`. */
    readonly group: string,
    /**
     * VM ids belonging to this group.
     * Pre-filtered: only VMs for which `VM.assert_can_migrate` succeeded.
     */
    readonly vmIds: ReadonlyArray<XoVm['id']>
  ) {}

  apply(placement: Placement, hosts: ReadonlyArray<XoHost>): MigrationPlan {
    const moves: MigrationPlan = new Map()

    if (hosts.length <= 1 || this.vmIds.length === 0) {
      return moves
    }

    // Per-host group-VM count; every available host starts at 0.
    const hostCount = new Map<XoHost['id'], number>(hosts.map(h => [h.id, 0]))

    // Mutable vm→host index derived from `placement`.
    // Only includes VMs that are on an available host.
    const vmHost = new Map<XoVm['id'], XoHost['id']>()
    for (const vmId of this.vmIds) {
      const hostId = placement.get(vmId)
      if (hostId === undefined || !hostCount.has(hostId)) {
        continue
      }
      vmHost.set(vmId, hostId)
      hostCount.set(hostId, (hostCount.get(hostId) ?? 0) + 1)
    }

    // Greedy improvement loop — terminates because each iteration strictly
    // reduces the source host's count, bounding total iterations by vmIds.length.
    for (;;) {
      const source = findMaxHost(hostCount)
      if (source === undefined) break

      const { hostId: sourceId, count: sourceCount } = source
      if (sourceCount - findMinCount(hostCount) <= 1) break

      const destId = findBestDest(hostCount, sourceId, sourceCount)
      if (destId === undefined) break

      const vmId = findFirstVmOnHost(vmHost, sourceId)
      if (vmId === undefined) break

      // Record move and update simulated state.
      moves.set(vmId, destId)
      hostCount.set(sourceId, sourceCount - 1)
      hostCount.set(destId, (hostCount.get(destId) ?? 0) + 1)
      vmHost.set(vmId, destId)
    }

    return moves
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Returns the host with the highest group-VM count, or undefined if all are 0. */
function findMaxHost(hostCount: Map<XoHost['id'], number>): { hostId: XoHost['id']; count: number } | undefined {
  let bestId: XoHost['id'] | undefined
  let bestCount = 0

  for (const [hostId, count] of hostCount) {
    if (count > bestCount) {
      bestCount = count
      bestId = hostId
    }
  }

  return bestId !== undefined ? { hostId: bestId, count: bestCount } : undefined
}

/** Returns the minimum group-VM count across all hosts. */
function findMinCount(hostCount: Map<XoHost['id'], number>): number {
  let min = Infinity
  for (const count of hostCount.values()) {
    if (count < min) min = count
  }
  return min === Infinity ? 0 : min
}

/**
 * Returns the host with the fewest group VMs satisfying `count + 1 < sourceCount`,
 * or undefined if no valid destination exists.
 */
function findBestDest(
  hostCount: Map<XoHost['id'], number>,
  sourceId: XoHost['id'],
  sourceCount: number
): XoHost['id'] | undefined {
  let bestId: XoHost['id'] | undefined
  let bestCount = Infinity

  for (const [hostId, count] of hostCount) {
    if (hostId !== sourceId && count + 1 < sourceCount && count < bestCount) {
      bestCount = count
      bestId = hostId
    }
  }

  return bestId
}

/** Returns the lexicographically smallest VM id currently assigned to `hostId`. */
function findFirstVmOnHost(vmHost: Map<XoVm['id'], XoHost['id']>, hostId: XoHost['id']): XoVm['id'] | undefined {
  let found: XoVm['id'] | undefined

  for (const [vmId, hId] of vmHost) {
    if (hId === hostId && (found === undefined || vmId < found)) {
      found = vmId
    }
  }

  return found
}
