import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { isRollingUpdateLive } from '@/modules/pool/utils/rolling-update.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { fetchGet } from '@/shared/utils/fetch.util.ts'
import { HttpCodes } from '@core/types/http-codes.type.ts'
import type { PoolRollingUpdateRecovery } from '@vates/types'
import { useIntervalFn } from '@vueuse/core'
import { ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'

const LIVE_POLLING_INTERVAL_MS = 5_000

const IDLE_POLLING_INTERVAL_MS = 30_000

// A 404 tells that the pool has no run only when the record is what is missing: the pool itself is not found
// while xo-server is not connected to it yet, e.g. right after its restart
function isNoRecoveryError(error: unknown) {
  return (
    error instanceof ApiError &&
    error.status === HttpCodes.NotFound &&
    (error.cause?.data as { type?: unknown } | undefined)?.type === 'rollingUpdateRecovery'
  )
}

// Not a remote resource: a pool without recovery answers 404, and a remote resource does not tell
// which status a failed request got
export function usePoolRollingUpdateRecovery(poolId: MaybeRefOrGetter<FrontXoPool['id']>) {
  const recovery = shallowRef<PoolRollingUpdateRecovery>()

  const isRecoveryReady = ref(false)

  const hasRecoveryError = ref(false)

  let lastRequestId = 0

  async function reloadRecovery() {
    const id = toValue(poolId)
    const requestId = ++lastRequestId

    let data: PoolRollingUpdateRecovery | undefined
    let hasError = false

    try {
      data = await fetchGet<PoolRollingUpdateRecovery>(`pools/${id}/rolling_update_recovery`)
    } catch (error) {
      hasError = !isNoRecoveryError(error)
    }

    // The pool changed while the request was pending, or a later request already answered: its answer is the newer
    if (id !== toValue(poolId) || requestId !== lastRequestId) {
      return
    }

    if (!hasError) {
      recovery.value = data
    }

    hasRecoveryError.value = hasError
    isRecoveryReady.value = true
  }

  watch(
    () => toValue(poolId),
    () => {
      recovery.value = undefined
      isRecoveryReady.value = false
      void reloadRecovery()
    },
    { immediate: true }
  )

  useIntervalFn(reloadRecovery, () =>
    isRollingUpdateLive(recovery.value) ? LIVE_POLLING_INTERVAL_MS : IDLE_POLLING_INTERVAL_MS
  )

  return { recovery, isRecoveryReady, hasRecoveryError, reloadRecovery }
}
