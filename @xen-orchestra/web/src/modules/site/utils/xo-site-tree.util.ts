import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { extractVmHostId } from '@/modules/vm/utils/xo-vm.util.ts'
import { safePushInMap } from '@/shared/utils/map.util.ts'

export type XoSiteTreeOrphans = {
  poolLessHosts: FrontXoHost[]
  hostLessVmsByPool: Map<FrontXoPool['id'], FrontXoVm[]>
  parentLessVms: FrontXoVm[]
}

export function findXoSiteTreeOrphans({
  pools,
  hosts,
  vms,
}: {
  pools: FrontXoPool[]
  hosts: FrontXoHost[]
  vms: FrontXoVm[]
}): XoSiteTreeOrphans {
  const poolIds = new Set(pools.map(pool => pool.id))
  const hostIds = new Set(hosts.map(host => host.id))

  const hostLessVmsByPool = new Map<FrontXoPool['id'], FrontXoVm[]>()
  const parentLessVms: FrontXoVm[] = []

  vms.forEach(vm => {
    const hostId = extractVmHostId(vm)

    if (hostId !== undefined && hostIds.has(hostId)) {
      return
    }

    if (poolIds.has(vm.$pool)) {
      safePushInMap(hostLessVmsByPool, vm.$pool, vm)

      return
    }

    parentLessVms.push(vm)
  })

  return {
    poolLessHosts: hosts.filter(host => !poolIds.has(host.$pool)),
    hostLessVmsByPool,
    parentLessVms,
  }
}
