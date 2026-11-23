import { usePoolRollingUpdateRecovery } from '@/modules/pool/composables/use-pool-rolling-update-recovery.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { fetchGet } from '@/shared/utils/fetch.util.ts'
import { createApiError } from '@/test/create-api-error.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockedExport } from '@/test/spy-on-module.ts'
import type { PoolRollingUpdateRecovery } from '@vates/types'
import { flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

const fetchGetMock = mockedExport(fetchGet)

const POOL_ID = 'pool-1' as FrontXoPool['id']
const OTHER_POOL_ID = 'pool-2' as FrontXoPool['id']

// The composable reads the status only
function createRecovery(status: PoolRollingUpdateRecovery['status']) {
  return { status } as PoolRollingUpdateRecovery
}

function mountRecovery(poolId = ref(POOL_ID)) {
  return mountComposable(() => usePoolRollingUpdateRecovery(poolId)).wrapper.vm
}

// A request of which the test chooses when it answers
function createPendingRequest() {
  let answer!: (recovery: PoolRollingUpdateRecovery) => void

  const request = new Promise<PoolRollingUpdateRecovery>(resolve => {
    answer = resolve
  })

  return { request, answer }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('load', () => {
  it('reads the recovery record of the pool', async () => {
    const recovery = createRecovery('interrupted')
    fetchGetMock.mockResolvedValue(recovery)

    const vm = mountRecovery()

    expect(vm.isRecoveryReady).toBe(false)

    await flushPromises()

    expect(fetchGetMock).toHaveBeenCalledWith(`pools/${POOL_ID}/rolling_update_recovery`)
    expect(vm.recovery).toBe(recovery)
    expect(vm.isRecoveryReady).toBe(true)
    expect(vm.hasRecoveryError).toBe(false)
  })

  it('takes a 404 as a pool without run, not as an error', async () => {
    fetchGetMock.mockRejectedValue(createApiError(404))

    const vm = mountRecovery()
    await flushPromises()

    expect(vm.recovery).toBeUndefined()
    expect(vm.isRecoveryReady).toBe(true)
    expect(vm.hasRecoveryError).toBe(false)
  })

  it('reports an error when the first request fails', async () => {
    fetchGetMock.mockRejectedValue(createApiError(500))

    const vm = mountRecovery()
    await flushPromises()

    expect(vm.recovery).toBeUndefined()
    expect(vm.isRecoveryReady).toBe(true)
    expect(vm.hasRecoveryError).toBe(true)
  })
})

describe('reload', () => {
  it('keeps the last record and reports an error when a reload fails', async () => {
    const recovery = createRecovery('interrupted')
    fetchGetMock.mockResolvedValue(recovery)

    const vm = mountRecovery()
    await flushPromises()

    fetchGetMock.mockRejectedValue(createApiError(500))
    await vm.reloadRecovery()

    expect(vm.recovery).toBe(recovery)
    expect(vm.hasRecoveryError).toBe(true)
  })

  it('clears the error once a reload answers', async () => {
    fetchGetMock.mockRejectedValue(createApiError(500))

    const vm = mountRecovery()
    await flushPromises()

    const recovery = createRecovery('interrupted')
    fetchGetMock.mockResolvedValue(recovery)
    await vm.reloadRecovery()

    expect(vm.recovery).toBe(recovery)
    expect(vm.hasRecoveryError).toBe(false)
  })

  it('drops the record once the run is closed', async () => {
    fetchGetMock.mockResolvedValue(createRecovery('succeeded'))

    const vm = mountRecovery()
    await flushPromises()

    fetchGetMock.mockRejectedValue(createApiError(404))
    await vm.reloadRecovery()

    expect(vm.recovery).toBeUndefined()
    expect(vm.hasRecoveryError).toBe(false)
  })

  it('ignores the answer of a request which a later one overtook', async () => {
    fetchGetMock.mockRejectedValue(createApiError(404))

    const vm = mountRecovery()
    await flushPromises()

    const overtaken = createPendingRequest()
    fetchGetMock.mockReturnValueOnce(overtaken.request)
    const overtakenReload = vm.reloadRecovery()

    const latest = createRecovery('succeeded')
    fetchGetMock.mockResolvedValueOnce(latest)
    await vm.reloadRecovery()

    overtaken.answer(createRecovery('running'))
    await overtakenReload

    expect(vm.recovery).toBe(latest)
  })
})

describe('pool change', () => {
  it('forgets the record of the previous pool and reads the one of the new pool', async () => {
    fetchGetMock.mockResolvedValue(createRecovery('interrupted'))

    const poolId = ref(POOL_ID)
    const vm = mountRecovery(poolId)
    await flushPromises()

    const pending = createPendingRequest()
    fetchGetMock.mockReturnValue(pending.request)
    poolId.value = OTHER_POOL_ID
    await flushPromises()

    expect(fetchGetMock).toHaveBeenLastCalledWith(`pools/${OTHER_POOL_ID}/rolling_update_recovery`)
    expect(vm.recovery).toBeUndefined()
    expect(vm.isRecoveryReady).toBe(false)

    const recovery = createRecovery('running')
    pending.answer(recovery)
    await flushPromises()

    expect(vm.recovery).toBe(recovery)
    expect(vm.isRecoveryReady).toBe(true)
  })

  it('ignores the answer of a request for the previous pool', async () => {
    const previous = createPendingRequest()
    fetchGetMock.mockReturnValueOnce(previous.request)
    fetchGetMock.mockRejectedValue(createApiError(404))

    const poolId = ref(POOL_ID)
    const vm = mountRecovery(poolId)

    poolId.value = OTHER_POOL_ID
    await flushPromises()

    previous.answer(createRecovery('running'))
    await flushPromises()

    expect(vm.recovery).toBeUndefined()
  })
})

describe('polling', () => {
  it('reloads the record every 5 seconds while the run is live', async () => {
    vi.useFakeTimers()
    fetchGetMock.mockResolvedValue(createRecovery('running'))

    mountRecovery()
    await flushPromises()

    expect(fetchGetMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5_000)

    expect(fetchGetMock).toHaveBeenCalledTimes(2)
  })

  it('reloads the record every 30 seconds only when no run is live', async () => {
    vi.useFakeTimers()
    fetchGetMock.mockRejectedValue(createApiError(404))

    mountRecovery()
    await flushPromises()

    await vi.advanceTimersByTimeAsync(29_000)

    expect(fetchGetMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1_000)

    expect(fetchGetMock).toHaveBeenCalledTimes(2)
  })
})
