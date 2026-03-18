import type { XoHost, XoVm } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'

import type { Constraint, MigrationPlan, Placement } from '../constraint.mjs'
import { AffinityConstraint, type AntiAffinityData } from '../constraints/affinity.mjs'
import { AntiAffinityConstraint } from '../constraints/anti-affinity.mjs'
import { solve } from '../solver.mjs'
import { getVmConfig } from '../tag-parser.mjs'

const log = createLogger('xo:load-balancer-ng')

// ─── Coalition building ───────────────────────────────────────────────────────

/**
 * Computes the transitive closure of affinity groups linked by shared VMs.
 *
 * If VM A has tags [web, db] and VM B has tags [db, cache], then web/db/cache
 * form one coalition and all their VMs must end up on the same host.
 *
 * Uses union-find with path compression.
 */
function buildAffinityCoalitions(
  affinityGroupVms: ReadonlyMap<string, ReadonlySet<XoVm['id']>>
): Map<ReadonlySet<string>, ReadonlySet<XoVm['id']>> {
  // Union-find over group names.
  const parent = new Map<string, string>([...affinityGroupVms.keys()].map(g => [g, g]))

  function find(g: string): string {
    let root = g
    while (parent.get(root) !== root) {
      root = parent.get(root) ?? root
    }
    // Path compression.
    let cur = g
    while (cur !== root) {
      const next = parent.get(cur) ?? root
      parent.set(cur, root)
      cur = next
    }
    return root
  }

  function union(a: string, b: string): void {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  // Merge groups that share at least one VM.
  const vmToFirstGroup = new Map<XoVm['id'], string>()
  for (const [group, vmIds] of affinityGroupVms) {
    for (const vmId of vmIds) {
      const existing = vmToFirstGroup.get(vmId)
      if (existing !== undefined) {
        union(group, existing)
      } else {
        vmToFirstGroup.set(vmId, group)
      }
    }
  }

  // Collect groups and VMs by coalition root.
  const byRoot = new Map<string, { groups: Set<string>; vms: Set<XoVm['id']> }>()
  for (const [group, vmIds] of affinityGroupVms) {
    const root = find(group)
    let entry = byRoot.get(root)
    if (entry === undefined) {
      entry = { groups: new Set(), vms: new Set() }
      byRoot.set(root, entry)
    }
    entry.groups.add(group)
    for (const vmId of vmIds) entry.vms.add(vmId)
  }

  const result = new Map<ReadonlySet<string>, ReadonlySet<XoVm['id']>>()
  for (const { groups, vms } of byRoot.values()) {
    result.set(groups, vms)
  }
  return result
}

// ─── Constraint extraction ────────────────────────────────────────────────────

/**
 * Parses VM tags and builds anti-affinity + affinity constraints.
 *
 * VMs with the `xo:load:balancer:ignore` tag are excluded from all groups.
 * They are still physically on hosts (and their memory is already reflected in
 * `host.memory.usage`), but the load balancer will not move them.
 *
 * Returns:
 *   - `constraints`: list of `AntiAffinityConstraint` and `AffinityConstraint`
 *   - `ignoredVmIds`: VMs skipped due to the ignore tag (for caller logging)
 */
export function extractConstraints(vms: ReadonlyArray<XoVm>): {
  constraints: ReadonlyArray<Constraint>
  ignoredVmIds: ReadonlyArray<XoVm['id']>
} {
  const ignoredVmIds: XoVm['id'][] = []

  // group name → vm ids with that anti-affinity tag
  const antiAffinityGroupVms = new Map<string, Set<XoVm['id']>>()
  // group name → vm ids with that affinity tag
  const affinityGroupVms = new Map<string, Set<XoVm['id']>>()
  // vm id → set of anti-affinity group names it belongs to
  const vmAntiAffinityGroups = new Map<XoVm['id'], Set<string>>()

  for (const vm of vms) {
    const config = getVmConfig(vm.tags)

    if (config.ignored) {
      ignoredVmIds.push(vm.id)
      continue
    }

    for (const group of config.antiAffinityGroups) {
      let vmSet = antiAffinityGroupVms.get(group)
      if (vmSet === undefined) {
        vmSet = new Set()
        antiAffinityGroupVms.set(group, vmSet)
      }
      vmSet.add(vm.id)

      let groupSet = vmAntiAffinityGroups.get(vm.id)
      if (groupSet === undefined) {
        groupSet = new Set()
        vmAntiAffinityGroups.set(vm.id, groupSet)
      }
      groupSet.add(group)
    }

    for (const group of config.affinityGroups) {
      let vmSet = affinityGroupVms.get(group)
      if (vmSet === undefined) {
        vmSet = new Set()
        affinityGroupVms.set(group, vmSet)
      }
      vmSet.add(vm.id)
    }
  }

  const constraints: Constraint[] = []

  // One AntiAffinityConstraint per group (need ≥ 2 VMs to be meaningful).
  for (const [group, vmIds] of antiAffinityGroupVms) {
    if (vmIds.size >= 2) {
      constraints.push(new AntiAffinityConstraint(group, [...vmIds]))
    }
  }

  // One AffinityConstraint per transitive coalition (need ≥ 2 VMs).
  const coalitions = buildAffinityCoalitions(affinityGroupVms)
  for (const [coalitionGroups, coalitionVmIds] of coalitions) {
    if (coalitionVmIds.size < 2) continue

    // Build AntiAffinityData for VMs in this coalition that also have
    // anti-affinity tags. This lets AffinityConstraint skip moves that would
    // violate an anti-affinity constraint (anti-affinity has priority).
    const vmGroupsForCoalition = new Map<XoVm['id'], ReadonlySet<string>>()
    const relevantGroups = new Set<string>()
    for (const vmId of coalitionVmIds) {
      const groups = vmAntiAffinityGroups.get(vmId)
      if (groups !== undefined && groups.size > 0) {
        vmGroupsForCoalition.set(vmId, groups)
        for (const g of groups) relevantGroups.add(g)
      }
    }

    let antiAffinityData: AntiAffinityData | undefined
    if (vmGroupsForCoalition.size > 0) {
      const groupVmsForCoalition = new Map<string, ReadonlySet<XoVm['id']>>()
      for (const group of relevantGroups) {
        const vmSet = antiAffinityGroupVms.get(group)
        if (vmSet !== undefined) groupVmsForCoalition.set(group, vmSet)
      }
      antiAffinityData = { vmGroups: vmGroupsForCoalition, groupVms: groupVmsForCoalition }
    }

    constraints.push(new AffinityConstraint(coalitionGroups, [...coalitionVmIds], antiAffinityData))
  }

  return { constraints, ignoredVmIds }
}

// ─── Plan entry point ─────────────────────────────────────────────────────────

/**
 * Computes a migration plan for a pool using affinity + anti-affinity tags.
 *
 * Inputs:
 *   - `hosts`: all enabled, running hosts in the pool
 *   - `vms`:   all running VMs in the pool (including ignored ones — they are
 *              filtered here and their memory is already in host.memory.usage)
 *
 * Returns a map of `vmId → destHostId` for VMs that need to migrate.
 * Returns an empty map when no action is needed.
 *
 * This function is pure: no I/O, no side-effects. The caller is responsible
 * for fetching objects from XO and for executing the returned plan.
 */
export function computeSimplePlan(hosts: ReadonlyArray<XoHost>, vms: ReadonlyArray<XoVm>): MigrationPlan {
  if (hosts.length <= 1) {
    log.debug('skipping simple plan: fewer than 2 hosts', { hostCount: hosts.length })
    return new Map()
  }

  const { constraints, ignoredVmIds } = extractConstraints(vms)

  for (const vmId of ignoredVmIds) {
    log.warn('VM skipped: ignore tag', { vmId })
  }

  if (constraints.length === 0) {
    log.debug('skipping simple plan: no constraints found')
    return new Map()
  }

  const ignoredSet = new Set(ignoredVmIds)
  const activeVms = vms.filter(vm => !ignoredSet.has(vm.id))

  // Build placement from $container (host id for running VMs).
  // Ignored VMs' memory is already reflected in host.memory.usage so they
  // are excluded from both the placement and the memory simulation.
  const placement: Placement = new Map(activeVms.map(vm => [vm.id, vm.$container as XoHost['id']]))

  return solve(constraints, placement, hosts, activeVms)
}
