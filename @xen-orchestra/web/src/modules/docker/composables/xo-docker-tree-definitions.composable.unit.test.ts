import type { FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createDockerEngine } from '@/test/create-docker-container.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { TreeNode } from '@core/packages/tree/types.ts'
import { useTree } from '@core/packages/tree/use-tree.ts'
import { VM_POWER_STATE } from '@vates/types'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

const VMS = [
  createVm({ id: 'vm-a' as FrontXoVm['id'], name_label: 'alpha' }),
  createVm({ id: 'vm-b' as FrontXoVm['id'], name_label: 'beta', power_state: VM_POWER_STATE.HALTED }),
]

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({
    getVmById: (id: FrontXoVm['id']) => VMS.find(vm => vm.id === id),
  })) as unknown as typeof useXoVmCollection,
}))

const engine = (id: string, $VM?: string) =>
  createDockerEngine({ id: id as FrontXoDockerEngine['id'], $VM: $VM as FrontXoVm['id'] })

function stubFetch(engines: Response | FrontXoDockerEngine[]) {
  const urls: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      urls.push(decodeURIComponent(url))
      if (url.includes('/docker-engines')) {
        return engines instanceof Response ? engines : Response.json(engines)
      }
      return Response.json([
        { id: 'e-a_web', dockerId: 'web'.padEnd(64, '0'), name: 'web', state: 'running', $engine: 'e-a', $VM: 'vm-a' },
      ])
    })
  )
  return urls
}

// labels by depth, as the tree view shows them
const describeTree = (nodes: TreeNode[]): string[] =>
  nodes.flatMap(node => [
    `${'  '.repeat(node.depth)}${node.discriminator}:${node.label}`,
    ...(node.isBranch ? describeTree(node.rawChildren) : []),
  ])

// the remote resources are cached by URL, for the module
beforeEach(() => {
  vi.resetModules()
})

async function mountTree(isHostExpanded = () => false) {
  const { useXoDockerTreeDefinitions } =
    await import('@/modules/docker/composables/xo-docker-tree-definitions.composable.ts')

  return mountComposable(() => {
    const { definitions, hostNodeIds } = useXoDockerTreeDefinitions(() => undefined, isHostExpanded)
    const { nodes } = useTree(definitions, { collapsedIds: ref(new Set()) })

    return { nodes, hostNodeIds }
  }).wrapper
}

it('lists the VMs running an engine, sorted by name, without connecting while collapsed', async () => {
  const urls = stubFetch([engine('e-b', 'vm-b'), engine('e-none'), engine('e-a', 'vm-a'), engine('e-x', 'vm-unknown')])

  const wrapper = await mountTree()
  await flushPromises()

  expect(describeTree(wrapper.vm.nodes)).toEqual(['containers:Containers', '  docker-host:alpha', '  docker-host:beta'])
  expect(wrapper.vm.hostNodeIds).toEqual(['containers.docker-hosts.e-a', 'containers.docker-hosts.e-b'])
  expect(urls.some(url => url.includes('/docker-containers'))).toBe(false)
  expect(urls.find(url => url.includes('/docker-engines'))).not.toContain('filter=')
})

it('lists the containers of the expanded hosts which can list them, without stats', async () => {
  const urls = stubFetch([engine('e-a', 'vm-a'), engine('e-b', 'vm-b')])

  const wrapper = await mountTree(() => true)
  await flushPromises()
  await flushPromises()

  expect(describeTree(wrapper.vm.nodes)).toEqual([
    'containers:Containers',
    '  docker-host:alpha',
    '    docker-container:web',
    '  docker-host:beta',
  ])
  // the VM of e-b is halted
  const listing = urls.filter(url => url.includes('/docker-containers'))
  expect(listing).toHaveLength(1)
  expect(listing[0]).toContain('filter=$engine:|(e-a)')
  expect(listing[0]).not.toContain('stats')
})

it('is absent without engine', async () => {
  stubFetch([])

  const wrapper = await mountTree()
  await flushPromises()

  expect(wrapper.vm.nodes).toEqual([])
})

it('is absent when the XOA plan does not include Docker', async () => {
  stubFetch(Response.json({ error: 'feature Unauthorized' }, { status: 403 }))

  const wrapper = await mountTree()
  await flushPromises()

  expect(wrapper.vm.nodes).toEqual([])
})
