import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { buildXoSiteTreeLayout, type XoSiteTreePoolContent } from '@/modules/site/utils/xo-site-tree.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool, OTHER_POOL_ID, UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'

const RESTRICTED_HOST_ID = 'host-restricted' as FrontXoHost['id']

const OTHER_RESTRICTED_HOST_ID = 'host-restricted-2' as FrontXoHost['id']

const pool = createPool()

const host = createHost({ $pool: pool.id })

const poolLessHost = createHost({ id: 'host-without-pool' as FrontXoHost['id'], $pool: UNKNOWN_POOL_ID })

function createVmOn(hostId: FrontXoHost['id'], poolId: FrontXoPool['id'], id = 'vm-123') {
  return createVm({ id: id as FrontXoVm['id'], $pool: poolId, $container: hostId })
}

function createVmOnNoHost(poolId: FrontXoPool['id'], id = 'vm-123') {
  return createVm({ id: id as FrontXoVm['id'], $pool: poolId, $container: poolId })
}

function createContent(overrides: Partial<XoSiteTreePoolContent> = {}): XoSiteTreePoolContent {
  return { restrictedHostVms: [], restrictedHostCount: 0, hosts: [], hostLessVms: [], ...overrides }
}

describe('buildXoSiteTreeLayout', () => {
  it('lays out nothing without any object', () => {
    expect(buildXoSiteTreeLayout({ pools: [], hosts: [], vms: [] })).toEqual({
      hasPoolLevel: false,
      restrictedPoolCount: 0,
      poolLessContent: createContent(),
      contentByPoolId: new Map(),
    })
  })

  it('has a pool level as soon as a pool is known', () => {
    expect(buildXoSiteTreeLayout({ pools: [pool], hosts: [], vms: [] })).toEqual({
      hasPoolLevel: true,
      restrictedPoolCount: 0,
      poolLessContent: createContent(),
      contentByPoolId: new Map([[pool.id, createContent()]]),
    })
  })

  it('lists the hosts in their pool, and leaves the VMs of a known host out of the contents', () => {
    const vm = createVmOn(host.id, pool.id)

    expect(buildXoSiteTreeLayout({ pools: [pool], hosts: [host], vms: [vm] })).toEqual({
      hasPoolLevel: true,
      restrictedPoolCount: 0,
      poolLessContent: createContent(),
      contentByPoolId: new Map([[pool.id, createContent({ hosts: [host] })]]),
    })
  })

  it('lists as pool-less the hosts whose pool is restricted', () => {
    expect(buildXoSiteTreeLayout({ pools: [pool], hosts: [host, poolLessHost], vms: [] })).toEqual({
      hasPoolLevel: true,
      restrictedPoolCount: 1,
      poolLessContent: createContent({ hosts: [poolLessHost] }),
      contentByPoolId: new Map([[pool.id, createContent({ hosts: [host] })]]),
    })
  })

  it('leaves out of the contents a VM on a known host whose pool is restricted', () => {
    const vm = createVmOn(poolLessHost.id, UNKNOWN_POOL_ID)

    expect(buildXoSiteTreeLayout({ pools: [], hosts: [poolLessHost], vms: [vm] }).poolLessContent).toEqual(
      createContent({ hosts: [poolLessHost] })
    )
  })

  it('lists as host-less in its pool a VM on no host', () => {
    const vm = createVmOnNoHost(pool.id)

    expect(buildXoSiteTreeLayout({ pools: [pool], hosts: [host], vms: [vm] }).contentByPoolId).toEqual(
      new Map([[pool.id, createContent({ hosts: [host], hostLessVms: [vm] })]])
    )
  })

  it('lists as host-less, pool-less, a VM on no host whose pool is restricted', () => {
    const vm = createVmOnNoHost(UNKNOWN_POOL_ID)

    expect(buildXoSiteTreeLayout({ pools: [pool], hosts: [host], vms: [vm] }).poolLessContent).toEqual(
      createContent({ hostLessVms: [vm] })
    )
  })

  it('lists in its pool, as on a restricted host, a VM whose host is restricted', () => {
    const vm = createVmOn(RESTRICTED_HOST_ID, pool.id)

    expect(buildXoSiteTreeLayout({ pools: [pool], hosts: [host], vms: [vm] }).contentByPoolId).toEqual(
      new Map([[pool.id, createContent({ restrictedHostVms: [vm], restrictedHostCount: 1, hosts: [host] })]])
    )
  })

  it('lists as pool-less, on a restricted host, a VM whose host and pool are restricted', () => {
    const vm = createVmOn(RESTRICTED_HOST_ID, UNKNOWN_POOL_ID)

    expect(buildXoSiteTreeLayout({ pools: [pool], hosts: [host], vms: [vm] }).poolLessContent).toEqual(
      createContent({ restrictedHostVms: [vm], restrictedHostCount: 1 })
    )
  })

  it('tells apart the VMs on a restricted host as soon as a host is known, whatever its pool', () => {
    const vm = createVmOn(RESTRICTED_HOST_ID, pool.id)

    expect(buildXoSiteTreeLayout({ pools: [pool], hosts: [poolLessHost], vms: [vm] }).contentByPoolId).toEqual(
      new Map([[pool.id, createContent({ restrictedHostVms: [vm], restrictedHostCount: 1 })]])
    )
  })

  it('lists as host-less the VMs whose host is restricted when no host is known', () => {
    const poolVm = createVmOn(RESTRICTED_HOST_ID, pool.id, 'vm-1')
    const poolLessVm = createVmOn(RESTRICTED_HOST_ID, UNKNOWN_POOL_ID, 'vm-2')

    expect(buildXoSiteTreeLayout({ pools: [pool], hosts: [], vms: [poolVm, poolLessVm] })).toEqual({
      hasPoolLevel: true,
      restrictedPoolCount: 1,
      poolLessContent: createContent({ hostLessVms: [poolLessVm] }),
      contentByPoolId: new Map([[pool.id, createContent({ hostLessVms: [poolVm] })]]),
    })
  })

  it('counts each restricted host of a pool once, however many VMs it runs', () => {
    const vms = [
      createVmOn(RESTRICTED_HOST_ID, pool.id, 'vm-1'),
      createVmOn(RESTRICTED_HOST_ID, pool.id, 'vm-2'),
      createVmOn(OTHER_RESTRICTED_HOST_ID, pool.id, 'vm-3'),
    ]

    expect(buildXoSiteTreeLayout({ pools: [pool], hosts: [host], vms }).contentByPoolId).toEqual(
      new Map([[pool.id, createContent({ restrictedHostVms: vms, restrictedHostCount: 2, hosts: [host] })]])
    )
  })

  it('counts each restricted pool once, whether a host or a VM belongs to it', () => {
    const vms = [
      createVmOn(RESTRICTED_HOST_ID, UNKNOWN_POOL_ID, 'vm-1'),
      createVmOnNoHost(UNKNOWN_POOL_ID, 'vm-2'),
      createVmOnNoHost(OTHER_POOL_ID, 'vm-3'),
    ]

    expect(buildXoSiteTreeLayout({ pools: [pool], hosts: [poolLessHost], vms }).restrictedPoolCount).toBe(2)
  })

  it('keeps the hosts and the VMs in the order it is given them', () => {
    const firstPool = createPool({ id: 'pool-1' as FrontXoPool['id'] })
    const secondPool = createPool({ id: 'pool-2' as FrontXoPool['id'] })
    const firstHost = createHost({ id: 'host-1' as FrontXoHost['id'], $pool: firstPool.id })
    const secondHost = createHost({ id: 'host-2' as FrontXoHost['id'], $pool: firstPool.id })
    const firstVm = createVmOnNoHost(secondPool.id, 'vm-1')
    const secondVm = createVmOnNoHost(secondPool.id, 'vm-2')
    const firstRestrictedHostVm = createVmOn(RESTRICTED_HOST_ID, secondPool.id, 'vm-3')
    const secondRestrictedHostVm = createVmOn(RESTRICTED_HOST_ID, secondPool.id, 'vm-4')

    expect(
      buildXoSiteTreeLayout({
        pools: [firstPool, secondPool],
        hosts: [firstHost, secondHost],
        vms: [firstRestrictedHostVm, firstVm, secondRestrictedHostVm, secondVm],
      }).contentByPoolId
    ).toEqual(
      new Map([
        [firstPool.id, createContent({ hosts: [firstHost, secondHost] })],
        [
          secondPool.id,
          createContent({
            restrictedHostVms: [firstRestrictedHostVm, secondRestrictedHostVm],
            restrictedHostCount: 1,
            hostLessVms: [firstVm, secondVm],
          }),
        ],
      ])
    )
  })
})
