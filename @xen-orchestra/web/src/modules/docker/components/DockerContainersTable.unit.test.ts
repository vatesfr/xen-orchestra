import DockerContainersTable from '@/modules/docker/components/DockerContainersTable.vue'
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import { createDockerContainer } from '@/test/create-docker-container.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { n, t } from '@/test/i18n.ts'
import type { XoDockerContainerStats } from '@vates/types'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'

function createStats(overrides: Partial<XoDockerContainerStats> = {}): XoDockerContainerStats {
  return {
    sampledAt: 1790327410123,
    cpuPercent: 3.1,
    onlineCpus: 4,
    memoryUsage: 641728512,
    memoryLimit: 8330301440,
    memoryPercent: 7.7,
    networkRx: 1296,
    networkTx: 126,
    blockRead: 0,
    blockWrite: 4096,
    pids: 5,
    ...overrides,
  }
}

const OTHER_ID = 'e5b2628a2b8a0a1f7f2727d3ea8b5f3556783f39855f2a043df733af21769470'

function mountTable(
  containers: FrontXoDockerContainer[],
  { isReady = true, hasError = false }: { isReady?: boolean; hasError?: boolean } = {}
) {
  return mount(DockerContainersTable, {
    props: { containers, isReady, hasError },
    global: createGlobalTestConfig(),
  })
}

/**
 * The cells of each row, keyed by the label of their column
 */
function findRows(wrapper: VueWrapper) {
  const headers = wrapper.findAll('thead th').map(header => header.text())

  return wrapper.findAll('tbody tr').map(row => {
    const cells = row.findAll('td')

    return Object.fromEntries(headers.map((header, index) => [header, cells[index]]))
  })
}

async function search(wrapper: VueWrapper, value: string) {
  await wrapper.find('.ui-query-search-bar input').setValue(value)
  await wrapper.find('.ui-query-search-bar').trigger('submit')
  await nextTick()
}

it('shows the CPU usage as a percentage: `cpuPercent` is already in percent (docker stats)', () => {
  const wrapper = mountTable([createDockerContainer({ stats: createStats({ cpuPercent: 3.1 }) })])

  const [row] = findRows(wrapper)

  // `n(…, 'percent')` expects a ratio: without the /100, 3.1 would read "310%"
  expect(row[t('cpu')].text()).toBe(n(0.031, 'percent'))
  expect(row[t('cpu')].text()).not.toContain('310')
})

it('can show a CPU usage above 100% on a multi-core VM, like docker stats', () => {
  const wrapper = mountTable([createDockerContainer({ stats: createStats({ cpuPercent: 180 }) })])

  expect(findRows(wrapper)[0][t('cpu')].text()).toBe(n(1.8, 'percent'))
})

it('shows the memory usage on a binary scale', () => {
  const wrapper = mountTable([createDockerContainer({ stats: createStats({ memoryUsage: 641728512 }) })])

  const memory = findRows(wrapper)[0][t('memory')]

  expect(memory.text()).toContain('612')
  expect(memory.find('.unit').text()).toBe('MiB')
})

it('shows loaders while the stats are pending, and nothing for a stopped container', () => {
  const wrapper = mountTable([
    createDockerContainer({ name: 'warming', statsPending: true, stats: undefined }),
    createDockerContainer({
      name: 'stopped',
      dockerId: OTHER_ID,
      state: 'exited',
      exitCode: 0,
      startedAt: undefined,
      stats: undefined,
    }),
  ])

  const [warming, stopped] = findRows(wrapper)

  expect(warming[t('cpu')].find('.ui-loader').exists()).toBe(true)
  expect(warming[t('memory')].find('.ui-loader').exists()).toBe(true)
  expect(stopped[t('cpu')].find('.ui-loader').exists()).toBe(false)
  expect(stopped[t('cpu')].text()).toBe('')
  expect(stopped[t('memory')].text()).toBe('')
  expect(stopped[t('uptime')].text()).toBe('')
})

it('shows the memory of a first sample, the CPU usage staying pending', () => {
  const wrapper = mountTable([
    createDockerContainer({ statsPending: true, stats: createStats({ cpuPercent: null, memoryUsage: 641728512 }) }),
  ])

  const [row] = findRows(wrapper)

  expect(row[t('cpu')].find('.ui-loader').exists()).toBe(true)
  expect(row[t('memory')].text()).toContain('612')
})

it('shows the name above the short id', () => {
  const wrapper = mountTable([createDockerContainer({ name: 'xo-nginx' })])

  const name = findRows(wrapper)[0][t('name')]

  expect(name.find('.primary').text()).toBe('xo-nginx')
  expect(name.find('.secondary').text()).toBe('1b5d79f4a1c9')
})

it('shows an exited container in danger with its exit code, even 0', () => {
  const wrapper = mountTable([createDockerContainer({ state: 'exited', exitCode: 0 })])

  const tag = findRows(wrapper)[0][t('state')].find('.ui-tag')

  expect(tag.text()).toBe(t('status:exited-with-code', { code: 0 }))
  expect(tag.classes()).toContain('accent--danger')
})

it('shows the health of a running container in its state', () => {
  const wrapper = mountTable([createDockerContainer({ state: 'running', health: 'unhealthy' })])

  const tag = findRows(wrapper)[0][t('state')].find('.ui-tag')

  expect(tag.text()).toBe(t('status:running-with-health', { health: t('status:unhealthy') }))
  expect(tag.classes()).toContain('accent--warning')
})

it('shows each published port once, although Docker lists it for IPv4 and IPv6', () => {
  const wrapper = mountTable([
    createDockerContainer({
      ports: [
        { ip: '0.0.0.0', privatePort: 80, publicPort: 8080, protocol: 'tcp' },
        { ip: '::', privatePort: 80, publicPort: 8080, protocol: 'tcp' },
        { privatePort: 443, protocol: 'tcp' },
      ],
    }),
  ])

  expect(
    findRows(wrapper)[0]
      [t('ports')].findAll('.ui-tag')
      .map(tag => tag.text())
  ).toEqual(['8080→80', '443/tcp'])
})

it('filters the containers on their name, image, Compose project or labels', async () => {
  const wrapper = mountTable([
    createDockerContainer({ name: 'xo-nginx', image: 'nginx:alpine' }),
    createDockerContainer({
      name: 'demo-cache-1',
      dockerId: OTHER_ID,
      image: 'redis:7',
      compose: { project: 'demo', service: 'cache' },
      labels: { tier: 'backend' },
    }),
  ])

  const names = () => findRows(wrapper).map(row => row[t('name')].find('.primary').text())

  await search(wrapper, 'NGINX')
  expect(names()).toEqual(['xo-nginx'])

  await search(wrapper, 'demo')
  expect(names()).toEqual(['demo-cache-1'])

  await search(wrapper, 'backend')
  expect(names()).toEqual(['demo-cache-1'])

  await search(wrapper, '')
  expect(names()).toEqual(['xo-nginx', 'demo-cache-1'])
})

it('says when no container matches the filter', async () => {
  const wrapper = mountTable([createDockerContainer()])

  await search(wrapper, 'nothing-matches')

  expect(wrapper.find('tbody tr').exists()).toBe(false)
  expect(wrapper.find('.vts-state-hero').text()).toContain(t('no-result'))
})

it('says when the engine has no container', () => {
  const wrapper = mountTable([])

  expect(wrapper.find('.vts-state-hero').text()).toContain(t('no-container-detected'))
})

it('shows an error, not stale containers, when the engine cannot be reached', () => {
  const wrapper = mountTable([], { hasError: true })

  expect(wrapper.find('.vts-state-hero.error').text()).toContain(t('docker-unreachable'))
})

it('shows a loader while the containers are loading', () => {
  const wrapper = mountTable([], { isReady: false })

  expect(wrapper.find('.vts-state-hero .ui-loader').exists()).toBe(true)
})
