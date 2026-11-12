import { useKubernetesClusterStats } from '@/modules/kubernetes/composables/use-kubernetes-cluster-stats.composable.ts'
import type { useXoKubernetesNodeCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-node-collection.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createKubernetesCluster } from '@/test/create-kubernetes-cluster.ts'
import { createKubernetesNode } from '@/test/create-kubernetes-node.ts'
import { createVmStats } from '@/test/create-vm-stats.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { VM_POWER_STATE } from '@vates/types'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

const { useXoKubernetesNodeCollectionMock, useXoVmCollectionMock } = vi.hoisted(() => ({
  useXoKubernetesNodeCollectionMock: vi.fn(),
  useXoVmCollectionMock: vi.fn(),
}))

vi.mock(import('@/modules/kubernetes/remote-resources/use-xo-kubernetes-node-collection.ts'), () => ({
  useXoKubernetesNodeCollection: useXoKubernetesNodeCollectionMock as unknown as typeof useXoKubernetesNodeCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: useXoVmCollectionMock as unknown as typeof useXoVmCollection,
}))

const cluster = createKubernetesCluster({ id: 'cluster-1' })

function givenClusterNodes(nodes: XoKubernetesNode[], vms: FrontXoVm[]) {
  useXoKubernetesNodeCollectionMock.mockReturnValue({
    nodesByCluster: ref(new Map([[cluster.id, nodes]])),
    areNodesReady: ref(true),
  })

  useXoVmCollectionMock.mockReturnValue({
    getVmById: (id: FrontXoVm['id'] | undefined) => vms.find(vm => vm.id === id),
    areVmsReady: ref(true),
  })
}

function givenStatsResponses(statusByVmId: Record<string, number>) {
  const fetchMock = vi.fn(async (url: string) => {
    const vmId = url.match(/vms\/([^/]+)\/stats/)![1]

    return new Response(JSON.stringify(createVmStats({ stats: { cpus: { '0': [10] } } })), {
      status: statusByVmId[vmId] ?? 200,
    })
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

function createNodeWithVm(id: string, power_state: FrontXoVm['power_state'] = VM_POWER_STATE.RUNNING) {
  const vm = createVm({ id: `vm-${id}` as FrontXoVm['id'], power_state })

  return { node: createKubernetesNode({ id, vm_id: vm.id }), vm }
}

async function mountClusterStats() {
  const { wrapper } = mountComposable(() => useKubernetesClusterStats(cluster))

  await flushPromises()

  return wrapper
}

beforeEach(() => {
  useXoKubernetesNodeCollectionMock.mockReset()
  useXoVmCollectionMock.mockReset()
})

it('fetches the stats of the running VM of every node', async () => {
  const first = createNodeWithVm('node-1')
  const second = createNodeWithVm('node-2')

  givenClusterNodes([first.node, second.node], [first.vm, second.vm])
  givenStatsResponses({})

  const wrapper = await mountClusterStats()

  expect(wrapper.vm.vmsStats).toHaveLength(2)
  expect(wrapper.vm.excludedNodeCount).toBe(0)
  expect(wrapper.vm.hasError).toBe(false)
})

it('excludes the nodes whose VM is halted, unknown or has no stats', async () => {
  const running = createNodeWithVm('node-1')
  const halted = createNodeWithVm('node-2', VM_POWER_STATE.HALTED)
  const failing = createNodeWithVm('node-3')
  const withoutVm = createKubernetesNode({ id: 'node-4', vm_id: undefined })
  const unknownVm = createKubernetesNode({ id: 'node-5', vm_id: 'vm-unknown' as FrontXoVm['id'] })

  givenClusterNodes(
    [running.node, halted.node, failing.node, withoutVm, unknownVm],
    [running.vm, halted.vm, failing.vm]
  )
  givenStatsResponses({ [failing.vm.id]: 500 })

  const wrapper = await mountClusterStats()

  expect(wrapper.vm.vmsStats).toHaveLength(1)
  expect(wrapper.vm.excludedNodeCount).toBe(4)
  expect(wrapper.vm.hasError).toBe(false)
})

it('reports an error when the stats of every VM failed', async () => {
  const { node, vm } = createNodeWithVm('node-1')

  givenClusterNodes([node], [vm])
  givenStatsResponses({ [vm.id]: 500 })

  const wrapper = await mountClusterStats()

  expect(wrapper.vm.vmsStats).toEqual([])
  expect(wrapper.vm.hasError).toBe(true)
})

it('does not report an error when no node has a running VM', async () => {
  const { node, vm } = createNodeWithVm('node-1', VM_POWER_STATE.HALTED)

  givenClusterNodes([node], [vm])
  givenStatsResponses({})

  const wrapper = await mountClusterStats()

  expect(wrapper.vm.excludedNodeCount).toBe(1)
  expect(wrapper.vm.hasError).toBe(false)
})
