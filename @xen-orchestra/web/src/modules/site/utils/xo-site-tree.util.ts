import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { extractVmHostId } from '@/modules/vm/utils/xo-vm.util.ts'

export type XoSiteTreePoolContent = {
  restrictedHostVms: FrontXoVm[]
  restrictedHostCount: number
  hosts: FrontXoHost[]
  hostLessVms: FrontXoVm[]
}

export type XoSiteTreeLayout = {
  hasPoolLevel: boolean
  restrictedPoolCount: number
  poolLessContent: XoSiteTreePoolContent
  contentByPoolId: Map<FrontXoPool['id'], XoSiteTreePoolContent>
}

export function createXoSiteTreePoolContent(): XoSiteTreePoolContent {
  return { restrictedHostVms: [], restrictedHostCount: 0, hosts: [], hostLessVms: [] }
}

export function buildXoSiteTreeLayout({
  pools,
  hosts,
  vms,
}: {
  pools: FrontXoPool[]
  hosts: FrontXoHost[]
  vms: FrontXoVm[]
}): XoSiteTreeLayout {
  const poolLessContent = createXoSiteTreePoolContent()
  const contentByPoolId = new Map(pools.map(pool => [pool.id, createXoSiteTreePoolContent()]))
  const hostIds = new Set(hosts.map(host => host.id))
  const hasHostLevel = hosts.length > 0

  function getContent(poolId: FrontXoPool['id']) {
    return contentByPoolId.get(poolId) ?? poolLessContent
  }

  hosts.forEach(host => getContent(host.$pool).hosts.push(host))

  vms.forEach(vm => {
    const hostId = extractVmHostId(vm)

    if (hostId !== undefined && hostIds.has(hostId)) {
      return
    }

    const content = getContent(vm.$pool)

    if (hostId !== undefined && hasHostLevel) {
      content.restrictedHostVms.push(vm)

      return
    }

    content.hostLessVms.push(vm)
  })

  const contents = [poolLessContent, ...contentByPoolId.values()]

  contents.forEach(content => {
    content.restrictedHostCount = new Set(content.restrictedHostVms.map(vm => vm.$container)).size
  })

  const poolLessObjects = [
    ...poolLessContent.hosts,
    ...poolLessContent.restrictedHostVms,
    ...poolLessContent.hostLessVms,
  ]

  return {
    hasPoolLevel: pools.length > 0,
    restrictedPoolCount: new Set(poolLessObjects.map(poolLessObject => poolLessObject.$pool)).size,
    poolLessContent,
    contentByPoolId,
  }
}
