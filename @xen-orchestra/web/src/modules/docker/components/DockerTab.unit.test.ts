import DockerTab from '@/modules/docker/components/DockerTab.vue'
import type { useXoDockerContainerCollection } from '@/modules/docker/remote-resources/use-xo-docker-container-collection.ts'
import type { useXoDockerEngineCollection } from '@/modules/docker/remote-resources/use-xo-docker-engine-collection.ts'
import type { useXoDockerEngineInfo } from '@/modules/docker/remote-resources/use-xo-docker-engine-info.ts'
import type {
  FrontXoDockerContainer,
  FrontXoDockerEngine,
  FrontXoDockerEngineInfo,
} from '@/modules/docker/types/docker.type.ts'
import { summarizeContainers } from '@/modules/docker/utils/xo-docker.util.ts'
import { createDockerContainer, createDockerEngine } from '@/test/create-docker-container.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

const { engineState, infoState, containerState } = vi.hoisted(() => ({
  engineState: {} as Record<string, unknown>,
  infoState: {} as Record<string, unknown>,
  containerState: {} as Record<string, unknown>,
}))

vi.mock(import('@/modules/docker/remote-resources/use-xo-docker-engine-collection.ts'), () => ({
  useXoDockerEngineCollection: (() => engineState) as unknown as typeof useXoDockerEngineCollection,
}))

vi.mock(import('@/modules/docker/remote-resources/use-xo-docker-engine-info.ts'), () => ({
  useXoDockerEngineInfo: (() => infoState) as unknown as typeof useXoDockerEngineInfo,
}))

vi.mock(import('@/modules/docker/remote-resources/use-xo-docker-container-collection.ts'), () => ({
  useXoDockerContainerCollection: (() => containerState) as unknown as typeof useXoDockerContainerCollection,
}))

const CONNECTED_INFO: FrontXoDockerEngineInfo = {
  status: 'connected',
  asOf: Date.now(),
  engineVersion: '29.8.1',
  apiVersion: '1.43',
  operatingSystem: 'Debian GNU/Linux 13 (trixie)',
  storageDriver: 'overlayfs',
  rootless: true,
  containers: { total: 2, running: 1, paused: 0, stopped: 1 },
  images: 3,
  warnings: [],
  compose: { projects: [] },
}

const UNREACHABLE_INFO: FrontXoDockerEngineInfo = {
  status: 'unreachable',
  asOf: Date.now(),
  error: { code: 'SSH_UNREACHABLE', message: 'connect EHOSTUNREACH 192.168.1.11:22' },
}

function setEngines({
  engine,
  isReady = true,
  hasError = false,
}: {
  engine?: FrontXoDockerEngine
  isReady?: boolean
  hasError?: boolean
}) {
  Object.assign(engineState, {
    dockerEngine: ref(engine),
    areDockerEnginesReady: ref(isReady),
    hasDockerEngineFetchError: ref(hasError),
    reloadDockerEngines: vi.fn(),
  })
}

function setInfo(info: FrontXoDockerEngineInfo | undefined) {
  Object.assign(infoState, {
    dockerEngineInfo: ref(info),
    isDockerEngineInfoReady: ref(info !== undefined),
    hasDockerEngineInfoError: ref(false),
    reloadDockerEngineInfo: vi.fn(),
  })
}

function setContainers(containers: FrontXoDockerContainer[]) {
  const records = ref(containers)
  Object.assign(containerState, {
    dockerContainers: records,
    dockerContainersSummary: computed(() => summarizeContainers(records.value)),
    getDockerContainerById: (id: FrontXoDockerContainer['id']) => records.value.find(container => container.id === id),
    areDockerContainersReady: ref(true),
    hasDockerContainerFetchError: ref(false),
    reloadDockerContainers: vi.fn(),
  })
}

beforeEach(() => {
  setEngines({ engine: undefined })
  setInfo(undefined)
  setContainers([])
})

function mountTab(vm = createVm({ power_state: VM_POWER_STATE.RUNNING })) {
  return mount(DockerTab, { props: { vm }, global: createGlobalTestConfig() })
}

it('shows a loader while the engines are loading', () => {
  setEngines({ isReady: false })

  const wrapper = mountTab()

  expect(wrapper.find('.vts-state-hero .ui-loader').exists()).toBe(true)
  expect(wrapper.find('.docker-connection-form').exists()).toBe(false)
})

it('shows an error when the engines cannot be fetched', () => {
  setEngines({ isReady: false, hasError: true })

  const wrapper = mountTab()

  expect(wrapper.find('.vts-state-hero.error').exists()).toBe(true)
})

it('shows the offline hero when the VM is not running, not a connection error', () => {
  setEngines({ engine: createDockerEngine() })
  setInfo(UNREACHABLE_INFO)

  const wrapper = mountTab(createVm({ power_state: VM_POWER_STATE.HALTED }))

  expect(wrapper.text()).toContain(t('vm-shutdown'))
  expect(wrapper.find('.docker-engine-card').exists()).toBe(false)
  expect(wrapper.find('.ui-alert').exists()).toBe(false)
})

it('shows the connection form when the VM has no engine, the address pre-filled', () => {
  const wrapper = mountTab(
    createVm({ power_state: VM_POWER_STATE.RUNNING, mainIpAddress: '10.0.0.5', addresses: { '0/ipv4/0': '10.0.0.5' } })
  )

  expect(wrapper.find('.docker-connection-form').exists()).toBe(true)
  expect(wrapper.find('.docker-connection-form').text()).toContain(t('docker-not-configured-title'))
  expect(wrapper.find('.docker-address-field').text()).toContain('10.0.0.5')
})

it('shows the engine, the counters and the containers when the engine is connected', () => {
  setEngines({ engine: createDockerEngine() })
  setInfo(CONNECTED_INFO)
  setContainers([
    createDockerContainer({ name: 'web', state: 'running' }),
    createDockerContainer({
      name: 'job',
      dockerId: 'e5b2628a2b8a0a1f7f2727d3ea8b5f3556783f39855f2a043df733af21769470',
      state: 'exited',
      exitCode: 3,
    }),
  ])

  const wrapper = mountTab()

  expect(wrapper.find('.docker-engine-card').text()).toContain('29.8.1')
  expect(wrapper.find('.docker-engine-card').text()).toContain(t('connected'))
  expect(wrapper.find('.ui-alert').exists()).toBe(false)
  expect(wrapper.find('.docker-containers-summary-card .total').text()).toContain('2')
  expect(wrapper.find('.docker-containers-summary-card .running').text()).toContain('1')
  expect(wrapper.find('.docker-containers-summary-card .stopped').text()).toContain('1')
  expect(
    wrapper.findAll('.docker-containers-table tbody tr').map(row => row.find('.vts-stacked-text-cell .primary').text())
  ).toEqual(['web', 'job'])
  expect(wrapper.find('.docker-containers-table').text()).toContain(t('status:exited-with-code', { code: 3 }))
})

it.each([
  ['unreachable', UNREACHABLE_INFO],
  [
    'auth-failed',
    {
      status: 'auth-failed',
      asOf: Date.now(),
      error: { code: 'SSH_AUTH_FAILED', message: 'SSH authentication failed' },
    } as FrontXoDockerEngineInfo,
  ],
])('keeps the configured layout with a danger alert when the engine is %s', (status, info) => {
  setEngines({ engine: createDockerEngine() })
  setInfo(info)
  setContainers([createDockerContainer()])

  const wrapper = mountTab()

  expect(wrapper.find('.docker-connection-form').exists()).toBe(false)
  const card = wrapper.find('.docker-engine-card')
  expect(card.exists()).toBe(true)
  expect(card.text()).toContain(t('disconnected'))
  const alert = card.find('.ui-alert')
  expect(alert.classes()).toContain('accent--danger')
  expect(alert.text()).toContain(t(`docker-status:${status}`))
  expect(alert.text()).toContain(info.status === 'connected' ? '' : info.error.message)
  // "Configure monitoring" stays reachable
  expect(card.text()).toContain(t('action:configure-monitoring'))
  // the table is in its error state, it does not show stale containers
  expect(wrapper.find('.docker-containers-table .vts-state-hero.error').exists()).toBe(true)
  expect(wrapper.findAll('.docker-containers-table tbody tr')).toHaveLength(0)
})

it('shows the connection form of the engine when configuring the monitoring', async () => {
  setEngines({ engine: createDockerEngine({ host: 'docker.example.org' }) })
  setInfo(UNREACHABLE_INFO)

  const wrapper = mountTab()

  const configure = wrapper
    .findAll('.docker-engine-card button')
    .find(button => button.text() === t('action:configure-monitoring'))!
  await configure.trigger('click')

  expect(wrapper.find('.docker-connection-form').text()).toContain(t('docker-ssh-private-key-replace'))
})
