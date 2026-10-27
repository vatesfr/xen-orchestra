import { type VdfInterface, useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import type { VdfDocument, VdfHostState, VdfHostStatusDocument, VdfLockedVif } from '@/modules/vdf/types.ts'
import { lockDrift, mergeLocking } from '@/modules/vdf/utils/vdf-locking.util.ts'
import { hostEnforces } from '@/modules/vdf/utils/vdf-status.util.ts'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
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
// enforced (vdf#41) are listed apart: locked already, it's the host's
// agent that isn't enforcing them (an agent reports them all, not only
// those that matter).
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

  const { getVifById } = useXoVifCollection()

  const report = computed(() =>
    mergeLocking(
      toValue(hosts).map(({ host, status, state }) => ({ hostId: host.id, status, current: hostEnforces(state) }))
    )
  )

  const worked = computed(() => {
    const groups = Object.values(toValue(document).groups).filter(group => (group.tags ?? []).length > 0)
    const unlocked: VdfLockIssue[] = []
    const stale: VdfLockIssue[] = []
    const vdfUnenforced: VdfLockIssue[] = []

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

        const drift = lockDrift(iface.vif, vm.addresses)

        if (iface.lock === 'unlocked') {
          unlocked.push(fromInterface(vm, iface))
        } else if (iface.lock === 'vdf-unenforced') {
          vdfUnenforced.push(fromInterface(vm, iface))
        } else if (drift !== undefined) {
          stale.push({ ...fromInterface(vm, iface), ...drift })
        }
      }
    }

    return { unlocked, stale, vdfUnenforced }
  })

  // the VDF locks agents report not enforced, as XO knows their VIFs (one
  // the agent lists as unlocked too stays there)
  const reportedVdfUnenforced = computed(() => {
    const listed = new Set(report.value.unlocked.map(vif => vif.vif))
    const vmById = new Map(toValue(runningVms).map(vm => [vm.id, vm]))

    return report.value.vdfUnenforced.flatMap(vifId => {
      const vif = getVifById(vifId as FrontXoVif['id'])
      const vm = vif === undefined ? undefined : vmById.get(vif.$VM)
      const iface = vm === undefined ? undefined : interfacesOf(vm).find(candidate => candidate.vif.id === vifId)

      return iface === undefined || listed.has(vifId) ? [] : [fromInterface(vm!, iface)]
    })
  })

  const unlocked = computed(() => [...report.value.unlocked.map(fromAgent), ...worked.value.unlocked].sort(byName))

  const stale = computed(() => [...report.value.stale.map(fromAgent), ...worked.value.stale].sort(byName))

  return {
    unlocked,
    // complete: agents list 20 interfaces at most
    unlockedCount: computed(() => report.value.unlockedCount + worked.value.unlocked.length),
    stale,
    staleCount: computed(() => report.value.staleCount + worked.value.stale.length),
    vdfUnenforced: computed(() => [...reportedVdfUnenforced.value, ...worked.value.vdfUnenforced].sort(byName)),
  }
}
