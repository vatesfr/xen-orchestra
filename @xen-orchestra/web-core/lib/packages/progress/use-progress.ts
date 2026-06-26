import { toComputed } from '@core/utils/to-computed.util.ts'
import type { Progress } from './types.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

const MIN_FILL_WIDTH = 0
const MAX_FILL_WIDTH = 100

export function useProgress(rawCurrent: MaybeRefOrGetter<number>, rawTotal: MaybeRefOrGetter<number>): Progress {
  const current = toComputed(rawCurrent)

  const total = toComputed(rawTotal)

  const percentage = computed(() => (total.value === 0 ? 0 : (current.value / total.value) * 100))

  const percentageCap = computed(() => Math.max(100, Math.ceil(percentage.value / 100) * 100))

  const fillWidth = computed(
    () => `${Math.max(MIN_FILL_WIDTH, Math.min(MAX_FILL_WIDTH, Math.floor((current.value / total.value) * 100)))}%`
  )

  return {
    current,
    total,
    percentage,
    fillWidth,
    percentageCap,
  }
}
