import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoSiteTreeDefinitions } from '@/modules/site/composables/xo-site-tree-definitions.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { XOA_NAME } from '@/shared/constants.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool, UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mockXoVmCollection, vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { useTree } from '@core/packages/tree/use-tree.ts'

mockXoCollections('pool', 'host')
mockXoVmCollection()

const UNKNOWN_HOST_ID = 'host-unknown' as FrontXoHost['id']

const pool = createPool({ name_label: 'Pool' })

const host = createHost({ name_label: 'Host', $pool: pool.id })

const poolLessHost = createHost({
  id: 'host-without-pool' as FrontXoHost['id'],
  name_label: 'Pool-less host',
  $pool: UNKNOWN_POOL_ID,
})

function createNamedVm(name: string, overrides: Partial<FrontXoVm>) {
  return createVm({ id: name as FrontXoVm['id'], name_label: name, ...overrides })
}

function readSiteTreeOutline() {
  const { wrapper } = mountComposable(() => {
    const { definitions } = useXoSiteTreeDefinitions(() => undefined)

    const { flatNodes } = useTree(definitions)

    return { flatNodes }
  })

  return wrapper.vm.flatNodes.map(({ node, depth }) => `${'  '.repeat(depth)}${node.label}`)
}

beforeEach(() => {
  xoCollectionsMock.reset()
  vmCollectionMock.reset()
})

describe('definitions', () => {
  it('holds the site alone without any object', () => {
    expect(readSiteTreeOutline()).toEqual([XOA_NAME])
  })

  it('nests the VMs in their host and the hosts in their pool', () => {
    xoCollectionsMock.pools.value = [pool]
    xoCollectionsMock.hosts.value = [host]
    vmCollectionMock.vms.value = [createNamedVm('VM', { $pool: pool.id, $container: host.id })]

    expect(readSiteTreeOutline()).toEqual([XOA_NAME, '  Pool', '    Host', '      VM'])
  })

  it('lists in their pool, after its hosts, the VMs on no host and those whose host is unknown', () => {
    xoCollectionsMock.pools.value = [pool]
    xoCollectionsMock.hosts.value = [host]
    vmCollectionMock.vms.value = [
      createNamedVm('VM on no host', { $pool: pool.id, $container: pool.id }),
      createNamedVm('VM on unknown host', { $pool: pool.id, $container: UNKNOWN_HOST_ID }),
    ]

    expect(readSiteTreeOutline()).toEqual([
      XOA_NAME,
      '  Pool',
      '    Host',
      '    VM on no host',
      '    VM on unknown host',
    ])
  })

  it('lists in the site the VMs whose host and pool are unknown', () => {
    vmCollectionMock.vms.value = [
      createNamedVm('VM 1', { $pool: UNKNOWN_POOL_ID, $container: UNKNOWN_HOST_ID }),
      createNamedVm('VM 2', { $pool: UNKNOWN_POOL_ID, $container: UNKNOWN_POOL_ID }),
    ]

    expect(readSiteTreeOutline()).toEqual([XOA_NAME, '  VM 1', '  VM 2'])
  })

  it('lists in the site, with their VMs, the hosts whose pool is unknown', () => {
    xoCollectionsMock.hosts.value = [poolLessHost]
    vmCollectionMock.vms.value = [createNamedVm('VM', { $pool: UNKNOWN_POOL_ID, $container: poolLessHost.id })]

    expect(readSiteTreeOutline()).toEqual([XOA_NAME, '  Pool-less host', '    VM'])
  })

  it('lists in the site the pools, then the pool-less hosts, then the parent-less VMs', () => {
    xoCollectionsMock.pools.value = [pool]
    xoCollectionsMock.hosts.value = [host, poolLessHost]
    vmCollectionMock.vms.value = [
      createNamedVm('Parent-less VM', { $pool: UNKNOWN_POOL_ID, $container: UNKNOWN_HOST_ID }),
    ]

    expect(readSiteTreeOutline()).toEqual([XOA_NAME, '  Pool', '    Host', '  Pool-less host', '  Parent-less VM'])
  })
})
