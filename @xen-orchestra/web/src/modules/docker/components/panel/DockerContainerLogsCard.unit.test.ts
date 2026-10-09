import DockerContainerLogsCard from '@/modules/docker/components/panel/DockerContainerLogsCard.vue'
import type { useXoDockerContainerLogs } from '@/modules/docker/remote-resources/use-xo-docker-container-logs.ts'
import { createDockerContainer } from '@/test/create-docker-container.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { d, t } from '@/test/i18n.ts'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import type { XoDockerLogs } from '@vates/types'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { logsState, useLogs } = vi.hoisted(() => {
  const logsState = {} as Record<string, unknown>

  return { logsState, useLogs: vi.fn(() => logsState) }
})

vi.mock(import('@/modules/docker/remote-resources/use-xo-docker-container-logs.ts'), async importOriginal => ({
  ...(await importOriginal()),
  useXoDockerContainerLogs: useLogs as unknown as typeof useXoDockerContainerLogs,
}))

function setLogs(logs: XoDockerLogs | undefined, { hasError = false }: { hasError?: boolean } = {}) {
  Object.assign(logsState, {
    dockerContainerLogs: ref(logs),
    areDockerContainerLogsReady: ref(logs !== undefined),
    hasDockerContainerLogsError: ref(hasError),
  })
}

function createLogs(overrides: Partial<XoDockerLogs> = {}): XoDockerLogs {
  return {
    entries: [
      { timestamp: '2026-09-25T08:42:01.123456789Z', stream: 'stdout', message: 'nginx: ready' },
      { timestamp: '2026-09-25T08:42:02.000000000Z', stream: 'stderr', message: 'upstream timed out' },
    ],
    truncated: false,
    timedOut: false,
    asOf: 1790327410123,
    ...overrides,
  }
}

function mountCard(container = createDockerContainer()) {
  return mount(DockerContainerLogsCard, { props: { container }, global: createGlobalTestConfig() })
}

beforeEach(() => {
  useLogs.mockClear()
  setLogs(undefined)
})

it('fetches the logs of the container it is mounted for', () => {
  const container = createDockerContainer()

  mountCard(container)

  const [, getContainerId] = useLogs.mock.calls[0] as unknown as [unknown, () => string]
  expect(getContainerId()).toBe(container.id)
})

it('shows the last lines, one per entry, the error stream marked', () => {
  setLogs(createLogs())

  const wrapper = mountCard()

  const viewer = wrapper.find('.ui-log-entry-viewer')
  expect(viewer.find('.label').text()).toBe(t('logs-last-n-lines', { n: 50 }))
  // in local time, like the other dates
  const date = (timestamp: string) => d(new Date(timestamp), { key: 'datetime_short', second: '2-digit' })
  expect(viewer.find('code').text()).toBe(
    `${date('2026-09-25T08:42:01.123Z')} nginx: ready\n${date('2026-09-25T08:42:02Z')} [stderr] upstream timed out`
  )
  expect(wrapper.text()).toContain(t('logs-read-only-info', { n: 10 }))
  expect(wrapper.text()).not.toContain(t('logs-truncated'))
  expect(wrapper.text()).not.toContain(t('logs-timed-out'))
})

it('follows the tail of the logs', () => {
  setLogs(createLogs())

  const wrapper = mountCard()

  expect(wrapper.findComponent(UiLogEntryViewer).props('autoScroll')).toBe(true)
})

it('follows the tail only while the user stays at the bottom', async () => {
  const wrapper = mount(UiLogEntryViewer, {
    props: { label: 'Logs', content: 'a', size: 'small', accent: 'info', autoScroll: true },
    global: createGlobalTestConfig(),
  })
  const element = wrapper.find('code').element
  // no layout in happy-dom: 100px per line, one line visible
  Object.defineProperty(element, 'scrollHeight', { get: () => element.textContent!.trim().split('\n').length * 100 })
  Object.defineProperty(element, 'clientHeight', { value: 100 })
  Object.defineProperty(element, 'scrollTop', { value: 0, writable: true })

  // the icon-only buttons have an accessible name
  expect(wrapper.findAll('.actions button').map(button => button.attributes('aria-label'))).toEqual([
    t('action:copy'),
    t('action:open-in-new-tab'),
  ])

  // at the bottom: follows the new lines
  await wrapper.setProps({ content: 'a\nb' })
  expect(element.scrollTop).toBe(200)

  // scrolled up to read: stays there
  element.scrollTop = 0
  await wrapper.setProps({ content: 'a\nb\nc' })
  expect(element.scrollTop).toBe(0)
})

it('says when the logs have been cut', () => {
  setLogs(createLogs({ truncated: true }))

  const wrapper = mountCard()

  expect(wrapper.find('.notice').text()).toContain(t('logs-truncated'))
})

it('says when reading the logs timed out, instead of the truncation', () => {
  setLogs(createLogs({ truncated: true, timedOut: true }))

  const wrapper = mountCard()

  expect(wrapper.find('.notice').text()).toContain(t('logs-timed-out'))
  expect(wrapper.text()).not.toContain(t('logs-truncated'))
  expect(wrapper.find('.ui-log-entry-viewer').classes()).toContain('accent--warning')
})

it('says when the container has no log', () => {
  setLogs(createLogs({ entries: [] }))

  const wrapper = mountCard()

  expect(wrapper.find('.ui-log-entry-viewer').exists()).toBe(false)
  expect(wrapper.find('.vts-state-hero').text()).toContain(t('no-log-available'))
})

it('shows a loader, then an error when the logs cannot be read', () => {
  const wrapper = mountCard()
  expect(wrapper.find('.vts-state-hero .ui-loader').exists()).toBe(true)

  setLogs(undefined, { hasError: true })
  const failed = mountCard()
  expect(failed.find('.vts-state-hero.error').exists()).toBe(true)
})
