import { useClamp, useMax } from '@vueuse/math'
import type { MaybeRefOrGetter } from '@vueuse/shared'
import { computed, toValue } from 'vue'

export function useProgress(valueProp: MaybeRefOrGetter<number>, maxProp?: MaybeRefOrGetter<number | undefined>) {
  const value = useMax(0, () => toValue(valueProp))

  const max = computed(() => toValue(maxProp) ?? 100)

  const percentage = computed(() => (max.value <= 0 ? 0 : (value.value / max.value) * 100))

  const maxPercentage = computed(() => Math.ceil(percentage.value / 100) * 100)

  const fillWidth = useClamp(() => (percentage.value / maxPercentage.value) * 100 || 0, 0, 100)

  const steps = computed(() => {
    const max = maxPercentage.value / 100

    return max === 0 ? [0.5, 1] : [max / 2, max]
  })

  return { value, max, percentage, fillWidth, steps }
}
