import { useIntervalFn } from '@vueuse/core'
import { onScopeDispose, ref } from 'vue'

const MEASURE_PREFIX = 'xo-perf:'

const LONG_TASK_THRESHOLD_MS = 50

export interface PerfMeasureRow {
  name: string
  count: number
  lastMs: number
  maxMs: number
  totalMs: number
}

export function useXoPerfReport() {
  const measures = ref<PerfMeasureRow[]>([])
  const longTaskCount = ref(0)
  const longestLongTaskMs = ref(0)
  const totalBlockingMs = ref(0)
  const heapUsedMb = ref<number>()

  function refresh() {
    const rowsByName = new Map<string, PerfMeasureRow>()

    performance
      .getEntriesByType('measure')
      .filter(entry => entry.name.startsWith(MEASURE_PREFIX))
      .forEach(entry => {
        const existing = rowsByName.get(entry.name)

        if (existing === undefined) {
          rowsByName.set(entry.name, {
            name: entry.name.slice(MEASURE_PREFIX.length),
            count: 1,
            lastMs: entry.duration,
            maxMs: entry.duration,
            totalMs: entry.duration,
          })

          return
        }

        existing.count += 1
        existing.lastMs = entry.duration
        existing.maxMs = Math.max(existing.maxMs, entry.duration)
        existing.totalMs += entry.duration
      })

    measures.value = [...rowsByName.values()].sort((a, b) => b.maxMs - a.maxMs)

    const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory

    if (memory !== undefined) {
      heapUsedMb.value = Math.round(memory.usedJSHeapSize / 1e6)
    }
  }

  let observer: PerformanceObserver | undefined

  if (typeof PerformanceObserver !== 'undefined') {
    observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        longTaskCount.value += 1
        longestLongTaskMs.value = Math.max(longestLongTaskMs.value, entry.duration)
        totalBlockingMs.value += Math.max(0, entry.duration - LONG_TASK_THRESHOLD_MS)
      })
    })

    try {
      observer.observe({ type: 'longtask', buffered: true })
    } catch {
      // The longtask entry type is not supported in every browser; skip it when missing.
    }
  }

  function clear() {
    performance.clearMeasures()
    measures.value = []
    longTaskCount.value = 0
    longestLongTaskMs.value = 0
    totalBlockingMs.value = 0
  }

  const { pause } = useIntervalFn(refresh, 1000, { immediateCallback: true })

  onScopeDispose(() => {
    pause()
    observer?.disconnect()
  })

  return {
    measures,
    longTaskCount,
    longestLongTaskMs,
    totalBlockingMs,
    heapUsedMb,
    refresh,
    clear,
  }
}
