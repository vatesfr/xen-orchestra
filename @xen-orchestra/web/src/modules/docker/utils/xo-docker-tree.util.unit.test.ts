import type { DockerTreeHost, FrontXoDockerTreeContainer } from '@/modules/docker/types/docker.type.ts'
import {
  canListContainers,
  getDockerContainerIcon,
  getDockerEngineKindLabel,
  getDockerHostIcon,
  getDockerTreeHosts,
  getEngineIdChunksToLoad,
  groupContainersByEngine,
  isDockerHostRowActive,
  MAX_LISTED_ENGINES,
} from '@/modules/docker/utils/xo-docker-tree.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createDockerEngine } from '@/test/create-docker-container.ts'
import { createVm } from '@/test/create-vm.ts'
import { VM_POWER_STATE } from '@vates/types'

const engine = (id: string, $VM?: string, overrides = {}) =>
  createDockerEngine({ id: id as DockerTreeHost['id'], $VM: $VM as FrontXoVm['id'], ...overrides })

const vm = (id: string, name_label: string, overrides: Partial<FrontXoVm> = {}) =>
  createVm({ id: id as FrontXoVm['id'], name_label, ...overrides })

const host = (id: string, overrides: Partial<DockerTreeHost> = {}): DockerTreeHost => ({
  id: id as DockerTreeHost['id'],
  engine: engine(id, 'vm-' + id),
  vm: vm('vm-' + id, id),
  label: id,
  ...overrides,
})

const container = (name: string, $engine: string, overrides: Partial<FrontXoDockerTreeContainer> = {}) =>
  ({
    id: `${$engine}_${name}`,
    dockerId: name.padEnd(64, '0'),
    name,
    state: 'running',
    $engine,
    ...overrides,
  }) as FrontXoDockerTreeContainer

describe('getDockerTreeHosts', () => {
  it('joins the engines with their VMs, sorted by VM name, without the engines of an unknown VM or without VM', () => {
    const vms = [vm('vm-b', 'beta'), vm('vm-a', 'alpha')]
    const hosts = getDockerTreeHosts(
      [engine('e-b', 'vm-b'), engine('e-none'), engine('e-unknown', 'vm-unknown'), engine('e-a', 'vm-a')],
      id => vms.find(vm => vm.id === id)
    )

    expect(hosts.map(({ id, label, vm }) => [id, label, vm.id])).toEqual([
      ['e-a', 'alpha', 'vm-a'],
      ['e-b', 'beta', 'vm-b'],
    ])
  })
})

describe('canListContainers', () => {
  it('only for a running VM whose engine is not failing', () => {
    expect(canListContainers(host('a'))).toBe(true)
    expect(canListContainers(host('a', { engine: engine('a', 'vm-a', { connectionStatus: 'idle' }) }))).toBe(true)
    expect(canListContainers(host('a', { engine: engine('a', 'vm-a', { connectionStatus: 'error' }) }))).toBe(false)
    expect(canListContainers(host('a', { vm: vm('vm-a', 'a', { power_state: VM_POWER_STATE.HALTED }) }))).toBe(false)
  })
})

describe('getEngineIdChunksToLoad', () => {
  it('the expanded hosts which can list their containers, by chunks of 10', () => {
    const hosts = Array.from({ length: 25 }, (_, i) => host(`e${i}`))
    hosts[3] = host('e3', { engine: engine('e3', 'vm-e3', { connectionStatus: 'error' }) })

    const chunks = getEngineIdChunksToLoad(hosts, host => host.id !== 'e0')

    expect(chunks.map(chunk => chunk.length)).toEqual([MAX_LISTED_ENGINES, MAX_LISTED_ENGINES, 3])
    expect(chunks.flat()).not.toContain('e0')
    expect(chunks.flat()).not.toContain('e3')
  })

  it('nothing when no host is expanded', () => {
    expect(getEngineIdChunksToLoad([host('a')], () => false)).toEqual([])
  })
})

describe('groupContainersByEngine', () => {
  it('groups the containers by engine, sorted by name', () => {
    const byEngine = groupContainersByEngine([container('web', 'a'), container('db', 'b'), container('api', 'a')])

    expect(byEngine.get('a' as DockerTreeHost['id'])?.map(c => c.name)).toEqual(['api', 'web'])
    expect(byEngine.get('b' as DockerTreeHost['id'])?.map(c => c.name)).toEqual(['db'])
  })
})

describe('icons and labels', () => {
  it('the icon of a host tells its kind and its state', () => {
    expect(getDockerHostIcon(host('a'))).toBe('object:docker-host:connected')
    expect(
      getDockerHostIcon(host('a', { engine: engine('a', 'vm-a', { kind: 'podman', connectionStatus: 'idle' }) }))
    ).toBe('object:podman-host')
    expect(getDockerHostIcon(host('a', { engine: engine('a', 'vm-a', { connectionStatus: 'error' }) }))).toBe(
      'object:docker-host:error'
    )
    expect(getDockerHostIcon(host('a', { vm: vm('vm-a', 'a', { power_state: VM_POWER_STATE.HALTED }) }))).toBe(
      'object:docker-host:halted'
    )
  })

  it('the icon of a container follows its state', () => {
    expect(getDockerContainerIcon({ state: 'running' })).toBe('object:container:running')
    expect(getDockerContainerIcon({ state: 'running', health: 'unhealthy' })).toBe('object:container:warning')
    expect(getDockerContainerIcon({ state: 'paused' })).toBe('object:container:paused')
    expect(getDockerContainerIcon({ state: 'exited' })).toBe('object:container:danger')
    expect(getDockerContainerIcon({ state: 'created' })).toBe('object:container:halted')
  })

  it('kind labels, unknown until connected', () => {
    expect(getDockerEngineKindLabel({ kind: 'docker' })).toBe('Docker')
    expect(getDockerEngineKindLabel({ kind: 'podman' })).toBe('Podman')
    expect(getDockerEngineKindLabel({})).toBeUndefined()
  })
})

describe('isDockerHostRowActive', () => {
  const base = {
    hostId: 'e-a',
    routeEngineId: 'e-a',
    selectedContainerId: undefined,
    isCollapsed: false,
    containerIds: ['c1'],
  }

  it('is active on its Containers tab without a selected container', () => {
    expect(isDockerHostRowActive(base)).toBe(true)
  })

  it('is not active on another page or another host', () => {
    expect(isDockerHostRowActive({ ...base, routeEngineId: undefined })).toBe(false)
    expect(isDockerHostRowActive({ ...base, routeEngineId: 'e-b' })).toBe(false)
  })

  it('leaves the highlight to the selected container when its row is shown', () => {
    expect(isDockerHostRowActive({ ...base, selectedContainerId: 'c1' })).toBe(false)
    expect(isDockerHostRowActive({ ...base, selectedContainerId: 'c1', isCollapsed: true })).toBe(true)
    expect(isDockerHostRowActive({ ...base, selectedContainerId: 'c2' })).toBe(true)
  })
})
