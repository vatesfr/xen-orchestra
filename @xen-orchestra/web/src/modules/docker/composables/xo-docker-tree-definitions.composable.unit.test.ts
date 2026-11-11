import { useXoDockerTreeDefinitions } from '@/modules/docker/composables/xo-docker-tree-definitions.composable.ts'
import { useXoDockerEngineCollection } from '@/modules/docker/remote-resources/use-xo-docker-engine-collection.ts'
import { useXoDockerTreeContainerCollection } from '@/modules/docker/remote-resources/use-xo-docker-tree-container-collection.ts'
import type { FrontXoDockerEngine, FrontXoDockerTreeContainer } from '@/modules/docker/types/docker.type.ts'
import { groupContainersByEngine } from '@/modules/docker/utils/xo-docker-tree.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createDockerEngine } from '@/test/create-docker-container.ts'
import { createVm } from '@/test/create-vm.ts'
import { mockXoVmCollection, vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport, mockModule } from '@/test/spy-on-module.ts'
import type { TreeNode } from '@core/packages/tree/types.ts'
import { useTree } from '@core/packages/tree/use-tree.ts'
import { VM_POWER_STATE } from '@vates/types'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

const VMS = [
  createVm({ id: 'vm-a' as FrontXoVm['id'], name_label: 'alpha' }),
  createVm({ id: 'vm-b' as FrontXoVm['id'], name_label: 'beta', power_state: VM_POWER_STATE.HALTED }),
]

const engines = ref<FrontXoDockerEngine[]>([])
const engineFetchError = ref<Error>()

mockModule(import('@/modules/docker/remote-resources/use-xo-docker-engine-collection.ts'), () => ({
  useXoDockerEngineCollection: (() => ({
    dockerEngines: engines,
    lastDockerEngineFetchError: engineFetchError,
  })) as unknown as typeof useXoDockerEngineCollection,
}))

mockXoVmCollection()

const useTreeContainers = mockedExport(useXoDockerTreeContainerCollection)

const WEB = {
  id: 'e-a_web',
  dockerId: 'web'.padEnd(64, '0'),
  name: 'web',
  state: 'running',
  $engine: 'e-a',
  $VM: 'vm-a',
} as FrontXoDockerTreeContainer

const engine = (id: string, $VM?: string) =>
  createDockerEngine({ id: id as FrontXoDockerEngine['id'], $VM: $VM as FrontXoVm['id'] })

beforeEach(() => {
  vmCollectionMock.reset()
  vmCollectionMock.vms.value = VMS
  engines.value = []
  engineFetchError.value = undefined
  setListedContainers([])
})

function setListedContainers(containers: FrontXoDockerTreeContainer[]) {
  useTreeContainers.mockReturnValue({
    containersByEngine: computed(() => groupContainersByEngine(containers)),
    loadedEngineIds: ref(new Set(containers.map(container => container.$engine))),
  })
}

// labels by depth, as the tree view shows them
const describeTree = (nodes: TreeNode[]): string[] =>
  nodes.flatMap(node => [
    `${'  '.repeat(node.depth)}${node.discriminator}:${node.label}`,
    ...(node.isBranch ? describeTree(node.rawChildren) : []),
  ])

// the engines whose containers the tree asks for, by request
const requestedEngineIds = () =>
  toValue(useTreeContainers.mock.calls.at(-1)![0] as MaybeRefOrGetter<FrontXoDockerEngine['id'][][]>)

function mountTree(isHostExpanded = () => false) {
  return mountComposable(() => {
    const { definitions, hostNodeIds } = useXoDockerTreeDefinitions(() => undefined, isHostExpanded)
    const { nodes } = useTree(definitions, { collapsedIds: ref(new Set()) })

    return { nodes, hostNodeIds }
  }).wrapper
}

it('lists the VMs running an engine, sorted by name, without listing containers while collapsed', () => {
  engines.value = [engine('e-b', 'vm-b'), engine('e-none'), engine('e-a', 'vm-a'), engine('e-x', 'vm-unknown')]

  const wrapper = mountTree()

  expect(describeTree(wrapper.vm.nodes)).toEqual(['containers:Containers', '  docker-host:alpha', '  docker-host:beta'])
  expect(wrapper.vm.hostNodeIds).toEqual(['containers.docker-hosts.e-a', 'containers.docker-hosts.e-b'])
  expect(requestedEngineIds()).toEqual([])
})

it('lists the containers of the expanded hosts which can list them', () => {
  engines.value = [engine('e-a', 'vm-a'), engine('e-b', 'vm-b')]
  setListedContainers([WEB])

  const wrapper = mountTree(() => true)

  expect(describeTree(wrapper.vm.nodes)).toEqual([
    'containers:Containers',
    '  docker-host:alpha',
    '    docker-container:web',
    '  docker-host:beta',
  ])
  // the VM of e-b is halted
  expect(requestedEngineIds()).toEqual([['e-a']])
})

it('is absent without engine', () => {
  const wrapper = mountTree()

  expect(wrapper.vm.nodes).toEqual([])
})

it('is absent when the XOA plan does not include Docker', () => {
  engines.value = [engine('e-a', 'vm-a')]
  engineFetchError.value = new Error('Failed to fetch: Forbidden', {
    cause: { status: 403, body: { error: 'feature Unauthorized' } },
  })

  const wrapper = mountTree()

  expect(wrapper.vm.nodes).toEqual([])
})
