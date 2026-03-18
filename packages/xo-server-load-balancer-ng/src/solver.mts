import type { XoHost, XoVm } from '@vates/types'

import type { Constraint, MigrationPlan, Placement } from './constraint.mjs'

/**
 * Applies constraints in descending priority order and returns the combined
 * migration plan.
 *
 * Each constraint receives a placement that already reflects all moves from
 * higher-priority constraints in this pass, so lower-priority constraints
 * see committed results (e.g. affinity sees where anti-affinity placed VMs).
 *
 * The returned plan contains only VMs whose final destination differs from
 * their initial position. If a lower-priority constraint somehow moves a VM
 * back to its original host, that entry is removed (net no-op guard).
 *
 * Memory awareness: when `vms` is provided, each proposed move is tested
 * against simulated free memory on the destination host. Moves that would exceed
 * available memory are silently dropped (the caller is responsible for logging).
 * The simulation tracks:
 *   - departure: source host regains the VM's memory
 *   - arrival: destination host loses the VM's memory
 * so cascading moves (anti-affinity frees h1 → affinity can then fill h1) are
 * handled correctly within a single solve() call.
 *
 * Documented invariants:
 *   - Constraint sort is stable: equal-priority constraints preserve insertion order.
 *   - `initialPlacement` is never mutated.
 *   - The returned plan is a fresh Map; callers may mutate it safely.
 *   - A move is only committed when memory allows; memory bookkeeping is updated
 *     move-by-move so earlier moves within the same constraint affect later ones.
 */
export function solve(
  constraints: ReadonlyArray<Constraint>,
  initialPlacement: Placement,
  hosts: ReadonlyArray<XoHost>,
  /** Optional: running VMs in this pool, used for memory feasibility checks. */
  vms: ReadonlyArray<XoVm> = []
): MigrationPlan {
  // Stable descending sort — Array.prototype.sort is stable in Node 11+
  const sorted = [...constraints].sort((a, b) => b.priority - a.priority)

  // Index vm.memory.size by vm id for O(1) lookup during move filtering.
  const vmMemory = new Map<XoVm['id'], number>(vms.map(vm => [vm.id, vm.memory.size]))

  // Index hosts by id for O(1) lookup when processing moves.
  const hostIndex = new Map<XoHost['id'], XoHost>(hosts.map(h => [h.id, h]))

  // Simulated free memory keyed by host object, updated as moves are committed.
  // Only populated when vms are provided (skipping it avoids accessing
  // host.memory in test stubs that omit that field).
  const freeMemory = new Map<XoHost, number>()
  if (vmMemory.size > 0) {
    for (const host of hosts) {
      freeMemory.set(host, host.memory.size - host.memory.usage)
    }
  }

  const allMoves: MigrationPlan = new Map()
  let currentPlacement: Placement = initialPlacement

  for (const constraint of sorted) {
    const moves = constraint.apply(currentPlacement, hosts)
    if (moves.size === 0) continue

    let anyAccepted = false
    for (const [vmId, destHostId] of moves) {
      const vmMem = vmMemory.get(vmId)

      // Memory guard: reject the move if the destination host cannot fit this VM.
      if (vmMem !== undefined) {
        const destHost = hostIndex.get(destHostId)
        if (destHost !== undefined) {
          const destFree = freeMemory.get(destHost) ?? 0
          if (destFree < vmMem) continue
        }
      }

      // Update simulated memory for this accepted move.
      if (vmMem !== undefined) {
        const srcHostId = currentPlacement.get(vmId)
        const srcHost = srcHostId !== undefined ? hostIndex.get(srcHostId) : undefined
        if (srcHost !== undefined) {
          freeMemory.set(srcHost, (freeMemory.get(srcHost) ?? 0) + vmMem)
        }
        const destHost = hostIndex.get(destHostId)
        if (destHost !== undefined) {
          freeMemory.set(destHost, (freeMemory.get(destHost) ?? 0) - vmMem)
        }
      }

      allMoves.set(vmId, destHostId)
      anyAccepted = true
    }

    if (!anyAccepted) continue

    // Rebuild placement: initial state with all accumulated moves overlaid.
    const updated = new Map(initialPlacement)
    for (const [vmId, hostId] of allMoves) {
      updated.set(vmId, hostId)
    }
    currentPlacement = updated
  }

  // Remove entries where the final destination equals the original host.
  for (const [vmId, destHostId] of allMoves) {
    if (initialPlacement.get(vmId) === destHostId) {
      allMoves.delete(vmId)
    }
  }

  return allMoves
}
