import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { type VdfLockHost, type VdfLockVif, vdfLockUnavailable, vifLock } from '@/modules/vdf/utils/vdf-locking.util.ts'
import { hostState, parseHostStatus } from '@/modules/vdf/utils/vdf-status.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { extractVmHostId } from '@/modules/vm/utils/xo-vm.util.ts'
import { VM_POWER_STATE } from '@vates/types'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'

// VIF LOCKS (vdf#41) as the hosts' agents enforce them: a VDF lock counts
// only where the agent of the host the VM runs on reports enforcing it,
// read from each host's vdf:status (followed through the host
// collection's events, a stale heartbeat seen within 15 s)
export function useVdfVifLocks() {
  const { hosts } = useXoHostCollection()

  const now = useNow({ interval: 15_000 })

  // only freshness matters here: no document to compare with
  const lockHosts = computed(
    () =>
      new Map(
        hosts.value.map(host => {
          const status = parseHostStatus(host.otherConfig)
          const state = hostState(status, '', { live: host.power_state === 'Running', now: now.value.getTime() })

          return [host.id, { host, status, state } satisfies VdfLockHost & { host: typeof host }]
        })
      )
  )

  const isRunning = (vm: FrontXoVm) => vm.power_state === VM_POWER_STATE.RUNNING

  // the host a running VM is on, with its agent's status
  function lockHostOf(vm: FrontXoVm) {
    const hostId = isRunning(vm) ? extractVmHostId(vm) : undefined

    return hostId === undefined ? undefined : lockHosts.value.get(hostId)
  }

  function lockOf(vm: FrontXoVm, vif: VdfLockVif & { id: string }, network: FrontXoNetwork | undefined) {
    return vifLock(vif, network?.defaultIsLocked, { running: isRunning(vm), host: lockHostOf(vm) })
  }

  // why VDF can't lock this VM's interfaces, or undefined
  function vdfLockUnavailableFor(vm: FrontXoVm) {
    return vdfLockUnavailable({
      running: isRunning(vm),
      host: lockHostOf(vm),
      poolHosts: [...lockHosts.value.values()].filter(({ host }) => host.$pool === vm.$pool),
    })
  }

  return { lockOf, lockHostOf, vdfLockUnavailableFor }
}
