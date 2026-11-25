import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { findXoSiteTreeOrphans } from '@/modules/site/utils/xo-site-tree.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool, UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'

const UNKNOWN_HOST_ID = 'host-unknown' as FrontXoHost['id']

const pool = createPool()

const host = createHost({ $pool: pool.id })

function createVmOnNoHost(overrides: Partial<FrontXoVm> = {}) {
  const poolId = overrides.$pool ?? pool.id

  return createVm({ $pool: poolId, $container: poolId, ...overrides })
}

describe('findXoSiteTreeOrphans', () => {
  it('finds no orphan without any object', () => {
    expect(findXoSiteTreeOrphans({ pools: [], hosts: [], vms: [] })).toEqual({
      poolLessHosts: [],
      hostLessVmsByPool: new Map(),
      parentLessVms: [],
    })
  })

  it('finds no orphan when every host has its pool and every VM its host', () => {
    const vm = createVm({ $pool: pool.id, $container: host.id })

    expect(findXoSiteTreeOrphans({ pools: [pool], hosts: [host], vms: [vm] })).toEqual({
      poolLessHosts: [],
      hostLessVmsByPool: new Map(),
      parentLessVms: [],
    })
  })

  it('lists as pool-less the hosts whose pool is unknown', () => {
    const poolLessHost = createHost({ id: UNKNOWN_HOST_ID, $pool: UNKNOWN_POOL_ID })

    expect(findXoSiteTreeOrphans({ pools: [pool], hosts: [host, poolLessHost], vms: [] }).poolLessHosts).toEqual([
      poolLessHost,
    ])
  })

  it('leaves on its host a VM whose pool alone is unknown', () => {
    const poolLessHost = createHost({ $pool: UNKNOWN_POOL_ID })
    const vm = createVm({ $pool: UNKNOWN_POOL_ID, $container: poolLessHost.id })

    expect(findXoSiteTreeOrphans({ pools: [], hosts: [poolLessHost], vms: [vm] })).toEqual({
      poolLessHosts: [poolLessHost],
      hostLessVmsByPool: new Map(),
      parentLessVms: [],
    })
  })

  it('groups by pool the VMs on no host', () => {
    const vm = createVmOnNoHost()

    expect(findXoSiteTreeOrphans({ pools: [pool], hosts: [host], vms: [vm] })).toEqual({
      poolLessHosts: [],
      hostLessVmsByPool: new Map([[pool.id, [vm]]]),
      parentLessVms: [],
    })
  })

  it('groups by pool the VMs whose host is unknown', () => {
    const vm = createVm({ $pool: pool.id, $container: UNKNOWN_HOST_ID })

    expect(findXoSiteTreeOrphans({ pools: [pool], hosts: [host], vms: [vm] })).toEqual({
      poolLessHosts: [],
      hostLessVmsByPool: new Map([[pool.id, [vm]]]),
      parentLessVms: [],
    })
  })

  it('lists as parent-less the VMs whose host and pool are unknown', () => {
    const vm = createVm({ $pool: UNKNOWN_POOL_ID, $container: UNKNOWN_HOST_ID })

    expect(findXoSiteTreeOrphans({ pools: [pool], hosts: [host], vms: [vm] })).toEqual({
      poolLessHosts: [],
      hostLessVmsByPool: new Map(),
      parentLessVms: [vm],
    })
  })

  it('lists as parent-less the VMs on no host whose pool is unknown', () => {
    const vm = createVmOnNoHost({ $pool: UNKNOWN_POOL_ID })

    expect(findXoSiteTreeOrphans({ pools: [pool], hosts: [host], vms: [vm] })).toEqual({
      poolLessHosts: [],
      hostLessVmsByPool: new Map(),
      parentLessVms: [vm],
    })
  })

  it('keeps the hosts and the VMs in the order it is given them', () => {
    const firstHost = createHost({ id: 'host-1' as FrontXoHost['id'], $pool: UNKNOWN_POOL_ID })
    const secondHost = createHost({ id: 'host-2' as FrontXoHost['id'], $pool: UNKNOWN_POOL_ID })
    const firstPoolVm = createVmOnNoHost({ id: 'vm-1' as FrontXoVm['id'] })
    const secondPoolVm = createVm({ id: 'vm-2' as FrontXoVm['id'], $pool: pool.id, $container: UNKNOWN_HOST_ID })
    const firstParentLessVm = createVmOnNoHost({ id: 'vm-3' as FrontXoVm['id'], $pool: UNKNOWN_POOL_ID })
    const secondParentLessVm = createVmOnNoHost({ id: 'vm-4' as FrontXoVm['id'], $pool: UNKNOWN_POOL_ID })

    expect(
      findXoSiteTreeOrphans({
        pools: [pool],
        hosts: [firstHost, secondHost],
        vms: [firstParentLessVm, firstPoolVm, secondParentLessVm, secondPoolVm],
      })
    ).toEqual({
      poolLessHosts: [firstHost, secondHost],
      hostLessVmsByPool: new Map([[pool.id, [firstPoolVm, secondPoolVm]]]),
      parentLessVms: [firstParentLessVm, secondParentLessVm],
    })
  })
})
