import PoolUpdatesRun from '@/modules/pool/components/updates/PoolUpdatesRun.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import type {
  PoolRollingUpdateRecoveryHost,
  PoolRollingUpdateRecoveryRun,
  PoolRollingUpdateRecoveryUnrestoredItem,
} from '@vates/types'
import { mount } from '@vue/test-utils'

mockXoRoutes()

mockXoCollections('host')

beforeEach(() => {
  xoCollectionsMock.reset()
})

const ERROR = { code: 'HOST_OFFLINE', message: 'the host is offline', stack: 'Error: the host is offline\n    at x' }

const ITEMS: PoolRollingUpdateRecoveryUnrestoredItem[] = [
  { type: 'vm', id: 'vm-1', name: 'db', restorable: true },
  { type: 'vm', id: 'vm-2', name: 'web', restorable: true },
]

function mountRun(
  status: PoolRollingUpdateRecoveryRun['status'],
  state: 'running' | 'interrupted',
  {
    hosts = {},
    restoringItem,
  }: {
    hosts?: Record<string, PoolRollingUpdateRecoveryHost>
    restoringItem?: PoolRollingUpdateRecoveryUnrestoredItem
  } = {}
) {
  const run = {
    runId: 'run-1',
    poolId: 'pool-789',
    status,
    startedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    hosts,
    lastError: ERROR,
    haltedPinnedVms: {},
    vmConflicts: [],
    operatorChanges: [],
    unrestoredItems: ITEMS,
  } as unknown as PoolRollingUpdateRecoveryRun

  return mount(PoolUpdatesRun, {
    props: { run, state, task: undefined, restoredItems: [], restoringItem, isBusy: restoringItem !== undefined },
    global: createGlobalTestConfig(),
  })
}

// The details of the error repeat its message: only its summaries are counted
function countSummaries(wrapper: ReturnType<typeof mountRun>) {
  return wrapper.findAllComponents(UiInfo).filter(info => info.text() === ERROR.message).length
}

describe('PoolUpdatesRun', () => {
  it('shows the last error of a run which stopped', () => {
    expect(mountRun('failed', 'interrupted').findComponent(UiLogEntryViewer).exists()).toBe(true)
  })

  // The record keeps the error of the previous attempt until the run stops again
  it('hides the last error while the run is resumed', () => {
    const wrapper = mountRun('resuming', 'running')

    expect(wrapper.findComponent(UiLogEntryViewer).exists()).toBe(false)
    expect(wrapper.text()).not.toContain(ERROR.message)
  })

  it('hides the last error of a host while the run is resumed', () => {
    const steps = Object.fromEntries(
      ['linstor', 'linstorHealth', 'evacuate', 'update', 'reboot', 'enable', 'restoreVms'].map(name => [
        name,
        { status: 'pending' },
      ])
    )

    const host = { status: 'running', steps, lastError: ERROR } as unknown as PoolRollingUpdateRecoveryHost

    const wrapper = mountRun('resuming', 'running', { hosts: { 'host-1': host } })

    expect(wrapper.text()).not.toContain(ERROR.message)
  })

  it('sums up the error above the hosts, and keeps its details for the end of the page', () => {
    const wrapper = mountRun('failed', 'interrupted')

    const text = wrapper.text()

    expect(text.indexOf(ERROR.message)).toBeGreaterThan(-1)
    expect(text.indexOf(ERROR.message)).toBeLessThan(text.indexOf(t('action:force-close')))
    expect(text.indexOf(t('rolling-update:error-details'))).toBeGreaterThan(
      text.indexOf(t('rolling-update:unrestored-items'))
    )
  })

  it('does not repeat on the run the error of a host', () => {
    const steps = Object.fromEntries(
      ['linstor', 'linstorHealth', 'evacuate', 'update', 'reboot', 'enable', 'restoreVms'].map(name => [
        name,
        { status: 'pending' },
      ])
    )

    const host = { status: 'failed', steps, lastError: ERROR } as unknown as PoolRollingUpdateRecoveryHost

    const wrapper = mountRun('failed', 'interrupted', { hosts: { 'host-1': host } })

    expect(countSummaries(wrapper)).toBe(1)
    expect(wrapper.findAllComponents(UiLogEntryViewer)).toHaveLength(1)
  })

  it('shows which item is being restored', () => {
    const wrapper = mountRun('failed', 'interrupted', { restoringItem: ITEMS[1] })

    const restoreButtons = wrapper.findAllComponents(UiButton).filter(button => button.text() === t('action:restore'))

    expect(restoreButtons.map(button => button.props('busy'))).toEqual([false, true])
  })
})
