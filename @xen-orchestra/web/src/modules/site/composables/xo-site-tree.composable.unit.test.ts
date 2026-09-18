import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSiteTree } from '@/modules/site/composables/xo-site-tree.composable.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { nextTick, ref } from 'vue'

// Read only when the composable runs, so the module-scope refs are already initialized
const pools = ref<FrontXoPool[]>([])
const arePoolsReady = ref(true)
const hostsByPool = ref(new Map<FrontXoPool['id'], FrontXoHost[]>())
const areHostsReady = ref(true)
const vmsByHost = ref(new Map<FrontXoHost['id'], FrontXoVm[]>())
const hostLessVmsByPool = ref(new Map<FrontXoPool['id'], FrontXoVm[]>())
const areVmsReady = ref(true)

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({ pools, arePoolsReady })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ hostsByPool, areHostsReady })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vmsByHost, hostLessVmsByPool, areVmsReady })) as unknown as typeof useXoVmCollection,
}))

const FULL_SITE_TREE = [
  { label: 'Xen Orchestra Appliance', depth: 0 },
  { label: 'Test Pool', depth: 1 },
  { label: 'Test Host', depth: 2 },
  { label: 'Test Vm', depth: 3 },
]

const SITE_TREE_WITH_POOL_COLLAPSED = [
  { label: 'Xen Orchestra Appliance', depth: 0 },
  { label: 'Test Pool', depth: 1 },
]

const pool = createPool({ name_label: 'Test Pool' })
const host = createHost({ name_label: 'Test Host', $pool: pool.id })
const vm = createVm({ name_label: 'Test Vm', $container: host.id, $pool: pool.id })

beforeEach(() => {
  localStorage.clear()

  pools.value = []
  hostsByPool.value = new Map()
  vmsByHost.value = new Map()
  hostLessVmsByPool.value = new Map()
  arePoolsReady.value = true
  areHostsReady.value = true
  areVmsReady.value = true
})

function givenFullSite() {
  pools.value = [pool]
  hostsByPool.value = new Map([[pool.id, [host]]])
  vmsByHost.value = new Map([[host.id, [vm]]])
}

function mountSiteTree() {
  const { wrapper } = mountComposable(() => useXoSiteTree())

  return wrapper
}

type SiteTreeWrapper = ReturnType<typeof mountSiteTree>

function readTree(wrapper: SiteTreeWrapper) {
  return wrapper.vm.treeItems.map(({ node, depth }) => ({ label: node.label, depth }))
}

function collapseBranch(wrapper: SiteTreeWrapper, label: string) {
  const branch = wrapper.vm.treeItems.find(item => item.node.label === label)?.node

  if (branch === undefined || !branch.isBranch) {
    throw new Error(`no branch labelled ${label} in the tree`)
  }

  branch.toggleCollapse(true)
}

describe('isReady', () => {
  it('is ready once the pools, the hosts and the vms have loaded', () => {
    const wrapper = mountSiteTree()

    expect(wrapper.vm.isReady).toBe(true)
  })

  it('is not ready while any of the three collections is still loading', () => {
    const wrapper = mountSiteTree()

    arePoolsReady.value = false

    expect(wrapper.vm.isReady).toBe(false)

    arePoolsReady.value = true
    areHostsReady.value = false

    expect(wrapper.vm.isReady).toBe(false)

    areHostsReady.value = true
    areVmsReady.value = false

    expect(wrapper.vm.isReady).toBe(false)
  })
})

describe('treeItems', () => {
  it('nests the pools, their hosts and their vms under the appliance', () => {
    givenFullSite()

    const wrapper = mountSiteTree()

    expect(readTree(wrapper)).toEqual(FULL_SITE_TREE)
  })

  it('lists the vms without host after the hosts of their pool', () => {
    givenFullSite()
    hostLessVmsByPool.value = new Map([
      [pool.id, [createVm({ name_label: 'Host Less Vm', $container: pool.id as FrontXoVm['$container'] })]],
    ])

    const wrapper = mountSiteTree()

    expect(readTree(wrapper)).toEqual([...FULL_SITE_TREE, { label: 'Host Less Vm', depth: 2 }])
  })

  it('keeps a pool without host and a host without vm', () => {
    const emptyPool = createPool({ id: 'pool-000' as FrontXoPool['id'], name_label: 'Empty Pool' })

    pools.value = [pool, emptyPool]
    hostsByPool.value = new Map([[pool.id, [host]]])

    const wrapper = mountSiteTree()

    expect(readTree(wrapper)).toEqual([
      { label: 'Xen Orchestra Appliance', depth: 0 },
      { label: 'Test Pool', depth: 1 },
      { label: 'Test Host', depth: 2 },
      { label: 'Empty Pool', depth: 1 },
    ])
  })

  it('expands every branch again while a search is active', async () => {
    givenFullSite()

    const wrapper = mountSiteTree()

    collapseBranch(wrapper, 'Test Pool')

    expect(readTree(wrapper)).toEqual(SITE_TREE_WITH_POOL_COLLAPSED)

    wrapper.vm.filter = 'test'
    await nextTick()

    expect(readTree(wrapper)).toEqual(FULL_SITE_TREE)
  })

  it('collapses the branches again once the search is cleared', async () => {
    givenFullSite()

    const wrapper = mountSiteTree()

    collapseBranch(wrapper, 'Test Pool')

    wrapper.vm.filter = 'test'
    await nextTick()

    wrapper.vm.filter = ''
    await nextTick()

    expect(readTree(wrapper)).toEqual(SITE_TREE_WITH_POOL_COLLAPSED)
  })

  it('forgets the branches collapsed for the previous search terms', async () => {
    givenFullSite()

    const wrapper = mountSiteTree()

    wrapper.vm.filter = 'test'
    await nextTick()

    collapseBranch(wrapper, 'Test Pool')

    wrapper.vm.filter = 'test pool'
    await nextTick()

    expect(readTree(wrapper)).toEqual(FULL_SITE_TREE)
  })

  it('remembers the branches collapsed in a previous session', async () => {
    givenFullSite()

    const previousWrapper = mountSiteTree()

    collapseBranch(previousWrapper, 'Test Pool')
    await nextTick()
    previousWrapper.unmount()

    const wrapper = mountSiteTree()

    expect(readTree(wrapper)).toEqual(SITE_TREE_WITH_POOL_COLLAPSED)
  })
})
