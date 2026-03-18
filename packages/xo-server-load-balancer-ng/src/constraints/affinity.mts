import type { XoHost, XoVm } from '@vates/types'

import type { Constraint, MigrationPlan, Placement } from '../constraint.mjs'

// ─── Anti-affinity conflict data ──────────────────────────────────────────────

/**
 * Data passed to AffinityConstraint so it can detect anti-affinity conflicts
 * at apply() time without performing any I/O.
 *
 * A conflict exists when moving a VM to the affinity target host would place it
 * on the same host as another VM in one of its anti-affinity groups.
 * In that case the VM is skipped: anti-affinity has priority.
 * Only the conflicting VM is excluded — the rest of the coalition is unaffected.
 */
export type AntiAffinityData = {
  /** Maps each coalition VM id → the anti-affinity group names it belongs to. */
  readonly vmGroups: ReadonlyMap<XoVm['id'], ReadonlySet<string>>
  /** Maps each anti-affinity group name → all VM ids in that group. */
  readonly groupVms: ReadonlyMap<string, ReadonlySet<XoVm['id']>>
}

const EMPTY_ANTI_AFFINITY_DATA: AntiAffinityData = {
  vmGroups: new Map(),
  groupVms: new Map(),
}

// ─── AffinityConstraint ───────────────────────────────────────────────────────

/**
 * Affinity constraint: all VMs in a coalition must be colocated on the same host.
 *
 * A coalition is the transitive closure of affinity groups linked by shared VMs:
 * if VM A has tags [web, db] and VM B has tags [db, cache], then web/db/cache
 * form one coalition and all three groups' VMs must end up on the same host.
 * Coalition merging happens upstream in extractConstraints(), not here.
 *
 * Algorithm:
 *   1. Count coalition VMs per host from the current placement.
 *   2. Target = the host with the most coalition VMs already on it.
 *      Ties are broken by Map iteration order (stable, deterministic).
 *   3. For each coalition VM not already on the target host:
 *      a. If moving it to the target would violate any of its anti-affinity
 *         constraints → skip the VM (anti-affinity priority rule).
 *      b. Otherwise → add it to the migration plan.
 *
 * Documented assumptions:
 *   - `vmIds` contains only VMs for which `VM.assert_can_migrate` succeeded.
 *   - VMs absent from `placement` (e.g. stopped concurrently) are silently skipped.
 *   - Only hosts present in the `hosts` array are considered.
 */
export class AffinityConstraint implements Constraint {
  // Lower priority than anti-affinity (5 < 10) — applied after it by the solver.
  readonly priority = 5

  readonly #antiAffinityData: AntiAffinityData

  constructor(
    /** Names of all groups merged into this coalition (for logging/debugging). */
    readonly groups: ReadonlySet<string>,
    /**
     * VM ids of all VMs in this coalition.
     * Pre-filtered: only VMs for which `VM.assert_can_migrate` succeeded.
     */
    readonly vmIds: ReadonlyArray<XoVm['id']>,
    /**
     * Anti-affinity data for per-VM conflict detection.
     * Omit when no VM in this coalition has anti-affinity tags.
     */
    antiAffinityData: AntiAffinityData = EMPTY_ANTI_AFFINITY_DATA
  ) {
    this.#antiAffinityData = antiAffinityData
  }

  apply(placement: Placement, hosts: ReadonlyArray<XoHost>): MigrationPlan {
    const moves: MigrationPlan = new Map()

    if (hosts.length <= 1 || this.vmIds.length === 0) {
      return moves
    }

    // Count coalition VMs per available host.
    const hostCount = new Map<XoHost['id'], number>(hosts.map(h => [h.id, 0]))
    for (const vmId of this.vmIds) {
      const hostId = placement.get(vmId)
      if (hostId === undefined || !hostCount.has(hostId)) continue
      hostCount.set(hostId, (hostCount.get(hostId) ?? 0) + 1)
    }

    // Target = host already holding the most coalition VMs.
    const targetId = findHostWithMostVms(hostCount)
    if (targetId === undefined) return moves // no coalition VMs in placement

    // Plan moves for VMs not yet on the target host.
    for (const vmId of this.vmIds) {
      const currentHostId = placement.get(vmId)
      if (currentHostId === undefined || !hostCount.has(currentHostId)) continue
      if (currentHostId === targetId) continue

      // Anti-affinity priority: skip this VM if colocating it with the coalition
      // would place it on a host that already has another VM from the same
      // anti-affinity group.
      if (this.#wouldViolateAntiAffinity(vmId, targetId, placement)) {
        continue
      }

      moves.set(vmId, targetId)
    }

    return moves
  }

  /**
   * Returns true if placing `vmId` on `targetHostId` would violate any of
   * its anti-affinity constraints given the current `placement`.
   *
   * Conflict condition: another VM in the same anti-affinity group is already
   * on `targetHostId` in the current (post-anti-affinity) placement.
   */
  #wouldViolateAntiAffinity(vmId: XoVm['id'], targetHostId: XoHost['id'], placement: Placement): boolean {
    const aaGroups = this.#antiAffinityData.vmGroups.get(vmId)
    if (aaGroups === undefined || aaGroups.size === 0) return false

    for (const group of aaGroups) {
      const groupVms = this.#antiAffinityData.groupVms.get(group)
      if (groupVms === undefined) continue

      for (const otherVmId of groupVms) {
        if (otherVmId !== vmId && placement.get(otherVmId) === targetHostId) {
          return true
        }
      }
    }

    return false
  }
}

// ─── Private helper ───────────────────────────────────────────────────────────

/**
 * Returns the host id with the highest VM count.
 * Returns undefined only when every host has count 0 (no VMs in placement).
 * Ties are broken by Map insertion order (hosts array order).
 */
function findHostWithMostVms(hostCount: Map<XoHost['id'], number>): XoHost['id'] | undefined {
  let bestId: XoHost['id'] | undefined
  let bestCount = 0

  for (const [hostId, count] of hostCount) {
    if (count > bestCount) {
      bestCount = count
      bestId = hostId
    }
  }

  return bestId
}
