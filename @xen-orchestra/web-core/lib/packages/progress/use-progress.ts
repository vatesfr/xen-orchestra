import { toComputed } from '@core/utils/to-computed.util.ts'
import type { Progress } from './types.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useProgress(rawCurrent: MaybeRefOrGetter<number>, rawTotal: MaybeRefOrGetter<number>): Progress {
  const current = toComputed(rawCurrent)

  const total = toComputed(rawTotal)

  const percentage = computed(() => (total.value === 0 ? 0 : (current.value / total.value) * 100))

  const percentageCap = computed(() => Math.max(100, Math.ceil(percentage.value / 100) * 100))

  const fillWidth = computed(() => `${(percentage.value / percentageCap.value) * 100}%`)

  return {
    current,
    total,
    percentage,
    fillWidth,
    percentageCap,
  }
}
