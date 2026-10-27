import { type VdfInterface, useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import type { VdfDocument, VdfHostState, VdfHostStatusDocument, VdfLockedVif } from '@/modules/vdf/types.ts'
import { lockDrift, mergeLocking } from '@/modules/vdf/utils/vdf-locking.util.ts'
import { hostEnforces } from '@/modules/vdf/utils/vdf-status.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

// an interface whose addresses the firewall can't trust: unlocked, or
// locked to addresses its guest no longer uses (allowed and reported)
export type VdfLockIssue = {
  vmId: string
  vmName: string
  vifId: string
  device: string
  networkName?: string
  allowed?: string[]
  reported?: string[]
}

const fromAgent = (vif: VdfLockedVif): VdfLockIssue => ({
  vmId: vif.vm,
  vmName: vif.vmName,
  vifId: vif.vif,
  device: vif.device,
  networkName: vif.networkName,
  allowed: vif.allowed,
  reported: vif.reported,
})

const fromInterface = (vm: FrontXoVm, iface: VdfInterface): VdfLockIssue => ({
  vmId: vm.id,
  vmName: vm.name_label,
  vifId: iface.vif.id,
  device: iface.vif.device,
  networkName: iface.network?.name_label,
})

const byName = (issueA: VdfLockIssue, issueB: VdfLockIssue) =>
  issueA.vmName.localeCompare(issueB.vmName) || Number(issueA.device) - Number(issueB.device)

// A pool's interfaces that matter to the firewall (a policy applies to
// them, or a group with tags selects them) and can't be trusted with their
// addresses (vdf#15), as each host's agent reports them. For a host whose
// agent doesn't (older than this, or stopped), XO works it out the same
// way, from XAPI's VIFs and what the guests report. VDF locks not
// enforced (vdf#41) are listed apart, all of them: locked already, it's
// the host's agent that isn't enforcing them.
export function useVdfLockingIssues({
  hosts,
  hostOf,
  runningVms,
  document,
}: {
  hosts: MaybeRefOrGetter<{ host: { id: string }; status: VdfHostStatusDocument | undefined; state: VdfHostState }[]>
  hostOf: (vm: FrontXoVm) => { host: { id: string } } | undefined
  runningVms: MaybeRefOrGetter<FrontXoVm[]>
  document: MaybeRefOrGetter<VdfDocument>
}) {
  const { groupInterfaces, interfacesOf } = useVdfInterfaces()

  const report = computed(() =>
    mergeLocking(
      toValue(hosts).map(({ host, status, state }) => ({ hostId: host.id, status, current: hostEnforces(state) }))
    )
  )

  // VDF locks not enforced, whatever the host (vdf#41): the agent stopped,
  // older (it counts them among its unlocked VIFs, as XAPI shows them), or
  // not listing them as enforced
  const vdfUnenforced = computed(() =>
    toValue(runningVms)
      .flatMap(vm =>
        interfacesOf(vm)
          .filter(iface => iface.lock === 'vdf-unenforced')
          .map(iface => fromInterface(vm, iface))
      )
      .sort(byName)
  )

  // locks to a prefix, XAPI's or VDF's: the guest may use any address in it
  const prefixed = computed(() =>
    toValue(runningVms)
      .flatMap(vm =>
        interfacesOf(vm)
          .filter(iface => iface.lockPrefix === true)
          .map(iface => fromInterface(vm, iface))
      )
      .sort(byName)
  )

  const vdfUnenforcedIds = computed(() => new Set(vdfUnenforced.value.map(issue => issue.vifId)))

  const worked = computed(() => {
    const groups = Object.values(toValue(document).groups).filter(group => (group.tags ?? []).length > 0)
    const unlocked: VdfLockIssue[] = []
    const stale: VdfLockIssue[] = []

    for (const vm of toValue(runningVms)) {
      const hostId = hostOf(vm)?.host.id

      if (hostId !== undefined && report.value.reportingHostIds.has(hostId)) {
        continue
      }

      const seen = new Set<string>()

      for (const iface of groups.flatMap(group => groupInterfaces(vm, group))) {
        if (seen.has(iface.vif.id)) {
          continue
        }

        seen.add(iface.vif.id)

        const drift = lockDrift(iface.vif, vm.addresses, iface.network?.defaultIsLocked)

        if (iface.lock === 'unlocked') {
          unlocked.push(fromInterface(vm, iface))
        } else if (iface.lock !== 'vdf-unenforced' && drift !== undefined) {
          stale.push({ ...fromInterface(vm, iface), ...drift })
        }
      }
    }

    return { unlocked, stale }
  })

  // what agents list as unlocked, without the VDF locks listed apart
  const reportedUnlocked = computed(() => report.value.unlocked.filter(vif => !vdfUnenforcedIds.value.has(vif.vif)))

  const unlocked = computed(() => [...reportedUnlocked.value.map(fromAgent), ...worked.value.unlocked].sort(byName))

  const stale = computed(() => [...report.value.stale.map(fromAgent), ...worked.value.stale].sort(byName))

  return {
    unlocked,
    // complete: agents list 20 interfaces at most
    unlockedCount: computed(
      () =>
        report.value.unlockedCount -
        (report.value.unlocked.length - reportedUnlocked.value.length) +
        worked.value.unlocked.length
    ),
    stale,
    staleCount: computed(() => report.value.staleCount + worked.value.stale.length),
    vdfUnenforced,
    prefixed,
  }
}
