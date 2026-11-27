import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSiteTreeDefinitions } from '@/modules/site/composables/xo-site-tree-definitions.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { XOA_NAME } from '@/shared/constants.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool, OTHER_POOL_ID, UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mockXoVmCollection, vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { useTree } from '@core/packages/tree/use-tree.ts'

mockXoCollections('pool', 'host')
mockXoVmCollection()

const RESTRICTED_HOST_ID = 'host-restricted' as FrontXoHost['id']

const OTHER_RESTRICTED_HOST_ID = 'host-restricted-2' as FrontXoHost['id']

const pool = createPool({ name_label: 'Pool' })

const host = createHost({ name_label: 'Host', $pool: pool.id })

const poolLessHost = createHost({
  id: 'host-without-pool' as FrontXoHost['id'],
  name_label: 'Pool-less host',
  $pool: UNKNOWN_POOL_ID,
})

function createNamedVm(name: string, location: { pool: FrontXoPool['id']; host?: FrontXoHost['id'] }) {
  return createVm({
    id: name as FrontXoVm['id'],
    name_label: name,
    $pool: location.pool,
    $container: location.host ?? location.pool,
  })
}

function mountSiteTree() {
  const tree = mountComposableWithI18n(() => {
    const { definitions } = useXoSiteTreeDefinitions(() => undefined)

    const { flatNodes } = useTree(definitions)

    return { flatNodes }
  })

  return {
    outline: tree.flatNodes.map(({ node, depth }) => `${'  '.repeat(depth)}${node.label}`),
    nodeIds: tree.flatNodes.map(({ id }) => id),
    t: tree.t,
  }
}

beforeEach(() => {
  xoCollectionsMock.reset()
  vmCollectionMock.reset()
})

describe('definitions', () => {
  it('holds the site alone without any object', () => {
    expect(mountSiteTree().outline).toEqual([XOA_NAME])
  })

  it('nests the VMs in their host and the hosts in their pool', () => {
    xoCollectionsMock.pools.value = [pool]
    xoCollectionsMock.hosts.value = [host]
    vmCollectionMock.vms.value = [createNamedVm('VM', { pool: pool.id, host: host.id })]

    expect(mountSiteTree().outline).toEqual([XOA_NAME, '  Pool', '    Host', '      VM'])
  })

  it('lists the VMs on no host in their pool, after its hosts', () => {
    xoCollectionsMock.pools.value = [pool]
    xoCollectionsMock.hosts.value = [host]
    vmCollectionMock.vms.value = [createNamedVm('VM on no host', { pool: pool.id })]

    expect(mountSiteTree().outline).toEqual([XOA_NAME, '  Pool', '    Host', '    VM on no host'])
  })

  it('lists the VMs in the site when no pool and no host is known', () => {
    vmCollectionMock.vms.value = [
      createNamedVm('VM 1', { pool: UNKNOWN_POOL_ID, host: RESTRICTED_HOST_ID }),
      createNamedVm('VM 2', { pool: UNKNOWN_POOL_ID }),
    ]

    expect(mountSiteTree().outline).toEqual([XOA_NAME, '  VM 1', '  VM 2'])
  })

  it('lists the VMs in their pool when no host is known', () => {
    xoCollectionsMock.pools.value = [pool]
    vmCollectionMock.vms.value = [
      createNamedVm('VM 1', { pool: pool.id, host: RESTRICTED_HOST_ID }),
      createNamedVm('VM 2', { pool: pool.id }),
    ]

    expect(mountSiteTree().outline).toEqual([XOA_NAME, '  Pool', '    VM 1', '    VM 2'])
  })

  it('groups before the hosts of a pool its VMs whose host is restricted', () => {
    xoCollectionsMock.pools.value = [pool]
    xoCollectionsMock.hosts.value = [host]
    vmCollectionMock.vms.value = [
      createNamedVm('VM on host', { pool: pool.id, host: host.id }),
      createNamedVm('VM on restricted host', { pool: pool.id, host: RESTRICTED_HOST_ID }),
    ]

    const { outline, t } = mountSiteTree()

    expect(outline).toEqual([
      XOA_NAME,
      '  Pool',
      `    ${t('restricted-host', 1)}`,
      '      VM on restricted host',
      '    Host',
      '      VM on host',
    ])
  })

  it('lists in the site the hosts whose pool is restricted when no pool is known, after the VMs whose host is restricted', () => {
    xoCollectionsMock.hosts.value = [poolLessHost]
    vmCollectionMock.vms.value = [
      createNamedVm('VM on host', { pool: UNKNOWN_POOL_ID, host: poolLessHost.id }),
      createNamedVm('VM on restricted host', { pool: UNKNOWN_POOL_ID, host: RESTRICTED_HOST_ID }),
      createNamedVm('VM on no host', { pool: UNKNOWN_POOL_ID }),
    ]

    const { outline, t } = mountSiteTree()

    expect(outline).toEqual([
      XOA_NAME,
      `  ${t('restricted-host', 1)}`,
      '    VM on restricted host',
      '  Pool-less host',
      '    VM on host',
      '  VM on no host',
    ])
  })

  it('groups before the pools the hosts and the VMs whose pool is restricted', () => {
    xoCollectionsMock.pools.value = [pool]
    xoCollectionsMock.hosts.value = [host, poolLessHost]
    vmCollectionMock.vms.value = [
      createNamedVm('VM on restricted host', { pool: UNKNOWN_POOL_ID, host: RESTRICTED_HOST_ID }),
      createNamedVm('VM on no host', { pool: UNKNOWN_POOL_ID }),
    ]

    const { outline, t } = mountSiteTree()

    expect(outline).toEqual([
      XOA_NAME,
      `  ${t('restricted-pool', 1)}`,
      `    ${t('restricted-host', 1)}`,
      '      VM on restricted host',
      '    Pool-less host',
      '    VM on no host',
      '  Pool',
      '    Host',
    ])
  })

  it('names its groups in the plural when they stand for several hosts or pools', () => {
    xoCollectionsMock.pools.value = [pool]
    xoCollectionsMock.hosts.value = [host]
    vmCollectionMock.vms.value = [
      createNamedVm('VM 1', { pool: UNKNOWN_POOL_ID, host: RESTRICTED_HOST_ID }),
      createNamedVm('VM 2', { pool: OTHER_POOL_ID, host: OTHER_RESTRICTED_HOST_ID }),
    ]

    const { outline, t } = mountSiteTree()

    expect(outline).toEqual([
      XOA_NAME,
      `  ${t('restricted-pool', 2)}`,
      `    ${t('restricted-host', 2)}`,
      '      VM 1',
      '      VM 2',
      '  Pool',
      '    Host',
    ])
  })

  it('gives the group of each pool its own node', () => {
    const otherPool = createPool({ id: 'pool-other' as FrontXoPool['id'], name_label: 'Other pool' })

    xoCollectionsMock.pools.value = [pool, otherPool]
    xoCollectionsMock.hosts.value = [host]
    vmCollectionMock.vms.value = [
      createNamedVm('VM 1', { pool: pool.id, host: RESTRICTED_HOST_ID }),
      createNamedVm('VM 2', { pool: otherPool.id, host: RESTRICTED_HOST_ID }),
    ]

    const { nodeIds } = mountSiteTree()

    expect(new Set(nodeIds).size).toBe(nodeIds.length)
  })
})
