import PoolUpdatesRun from '@/modules/pool/components/updates/PoolUpdatesRun.vue'
import PoolUpdatesStart from '@/modules/pool/components/updates/PoolUpdatesStart.vue'
import type { useXoPoolMissingPatchesCollection } from '@/modules/pool/remote-resources/use-xo-pool-missing-patches-collection.ts'
import type { useXoPoolTasksCollection } from '@/modules/pool/remote-resources/use-xo-pool-tasks-collection.ts'
import type { useXoTasksConversion } from '@/modules/task/composables/xo-tasks-conversion.composable.ts'
import UpdatesPage from '@/pages/pool/[id]/updates.vue'
import { fetchGet } from '@/shared/utils/fetch.util.ts'
import { createApiError } from '@/test/create-api-error.ts'
import { createPool } from '@/test/create-pool.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoTaskUtils } from '@/test/mock-xo-task-utils.ts'
import { mockedExport, mockModule } from '@/test/spy-on-module.ts'
import type { PoolRollingUpdateRecovery } from '@vates/types'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'

const LIVE_POLLING_INTERVAL_MS = 5_000

const fetchGetMock = mockedExport(fetchGet)

const poolMissingPatches = ref<unknown[]>([])

// What the server answers once the list is reloaded
let reloadedMissingPatches: unknown[] = []

const reloadPoolMissingPatches = vi.fn(async () => {
  poolMissingPatches.value = reloadedMissingPatches
})

mockModule(import('@/modules/pool/remote-resources/use-xo-pool-missing-patches-collection.ts'), () => ({
  useXoPoolMissingPatchesCollection: (() => ({
    poolMissingPatches,
    reloadPoolMissingPatches,
  })) as unknown as typeof useXoPoolMissingPatchesCollection,
}))

mockModule(import('@/modules/pool/remote-resources/use-xo-pool-tasks-collection.ts'), () => ({
  useXoPoolTasksCollection: (() => ({
    getTaskById: () => undefined,
    sortedTasks: ref([]),
  })) as unknown as typeof useXoPoolTasksCollection,
}))

mockModule(import('@/modules/task/composables/xo-tasks-conversion.composable.ts'), () => ({
  useXoTasksConversion: (() => ({ convertedTasks: ref([]) })) as unknown as typeof useXoTasksConversion,
}))

mockXoTaskUtils()

// The page reads the status only
const RUNNING = { status: 'running', hosts: {}, vmConflicts: [] } as unknown as PoolRollingUpdateRecovery

beforeEach(() => {
  vi.useFakeTimers()

  poolMissingPatches.value = [{ name: 'xapi' }]
  reloadedMissingPatches = []
  reloadPoolMissingPatches.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

// Mounts the page on a running run, then lets the run end without leaving a record
async function mountPageOnRunWhichClosesItself() {
  fetchGetMock.mockResolvedValue(RUNNING)

  const wrapper = mount(UpdatesPage, {
    props: { pool: createPool() },
    global: createGlobalTestConfig({ stubs: { PoolUpdatesRun: true, PoolUpdatesStart: true } }),
  })

  await flushPromises()

  expect(wrapper.findComponent(PoolUpdatesRun).exists()).toBe(true)

  fetchGetMock.mockRejectedValue(createApiError(404))

  await vi.advanceTimersByTimeAsync(LIVE_POLLING_INTERVAL_MS)
  await flushPromises()

  return wrapper
}

describe('run which closes itself', () => {
  it('reloads the missing patches and shows the pool as up to date', async () => {
    const wrapper = await mountPageOnRunWhichClosesItself()

    expect(reloadPoolMissingPatches).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain(t('rolling-update:pool-up-to-date'))
    expect(wrapper.findComponent(PoolUpdatesStart).exists()).toBe(false)
  })

  it('goes back to the start when patches are still missing', async () => {
    reloadedMissingPatches = [{ name: 'xapi' }]

    const wrapper = await mountPageOnRunWhichClosesItself()

    expect(reloadPoolMissingPatches).toHaveBeenCalledOnce()
    expect(wrapper.findComponent(PoolUpdatesStart).exists()).toBe(true)
  })
})
