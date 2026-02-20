import { GRANULARITY, RRD_STEP_FROM_STRING } from '@/shared/utils/rest-api-stats.ts'
import type { XoHost } from '@vates/types'
import type { XapiHostStats } from '@vates/types/common'
import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'

/**
 * Fetches CPU stats for hosts currently visible in the topology.
 * Only polls hosts that are in the `visibleHostIds` set (i.e. their parent pool is expanded).
 * Uses "minutes" granularity (1 request per host per 60s) to keep cost low on large infras.
 */
export function useTopologyHostStats(visibleHostIds: Ref<Set<XoHost['id']>>) {
  const cpuByHost = ref<Map<XoHost['id'], number | undefined>>(new Map())
  const activePollers = new Map<XoHost['id'], ReturnType<typeof setTimeout>>()
  const abortControllers = new Map<XoHost['id'], AbortController>()

  const granularity = GRANULARITY.Minutes
  const pollInterval = RRD_STEP_FROM_STRING[granularity] * 1000

  async function fetchHostCpu(hostId: XoHost['id']) {
    const controller = new AbortController()
    abortControllers.set(hostId, controller)

    try {
      const resp = await fetch(`/rest/v0/hosts/${hostId}/stats?granularity=${granularity}`, {
        credentials: 'include',
        signal: controller.signal,
      })

      if (!resp.ok) {
        return
      }

      const data: XapiHostStats = await resp.json()
      const cpus = data.stats.cpus

      if (cpus == null) {
        return
      }

      const cores = Object.values(cpus)

      if (cores.length === 0) {
        return
      }

      // Take the last (most recent) data point, average across all cores
      let sum = 0
      let count = 0

      for (const core of cores) {
        const last = core[core.length - 1]

        if (last != null) {
          sum += last
          count++
        }
      }

      if (count > 0) {
        const next = new Map(cpuByHost.value)
        next.set(hostId, Math.round(sum / count))
        cpuByHost.value = next
      }
    } catch {
      // Aborted or network error — ignore
    } finally {
      abortControllers.delete(hostId)
    }
  }

  function startPolling(hostId: XoHost['id']) {
    if (activePollers.has(hostId)) {
      return
    }

    // Fetch immediately, then poll
    fetchHostCpu(hostId)
    const timer = setInterval(() => fetchHostCpu(hostId), pollInterval)
    activePollers.set(hostId, timer)
  }

  function stopPolling(hostId: XoHost['id']) {
    const timer = activePollers.get(hostId)

    if (timer != null) {
      clearInterval(timer)
      activePollers.delete(hostId)
    }

    const controller = abortControllers.get(hostId)

    if (controller != null) {
      controller.abort()
      abortControllers.delete(hostId)
    }
  }

  watch(
    visibleHostIds,
    (current, previous) => {
      const prev = previous ?? new Set<XoHost['id']>()

      // Start polling for newly visible hosts
      for (const id of current) {
        if (!prev.has(id)) {
          startPolling(id)
        }
      }

      // Stop polling for hosts that are no longer visible
      for (const id of prev) {
        if (!current.has(id)) {
          stopPolling(id)
        }
      }
    },
    { immediate: true }
  )

  onScopeDispose(() => {
    for (const id of activePollers.keys()) {
      stopPolling(id)
    }
    cpuByHost.value = new Map()
  })

  return {
    cpuByHost: computed(() => cpuByHost.value),
  }
}
