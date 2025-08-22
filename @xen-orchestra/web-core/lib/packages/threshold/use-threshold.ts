import type { ThresholdConfig, ThresholdResult } from '@core/packages/threshold/type.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'

export function useThreshold<TPayload>(
  rawCurrentValue: MaybeRefOrGetter<number>,
  rawConfig: MaybeRefOrGetter<ThresholdConfig<TPayload>>
): ComputedRef<ThresholdResult<TPayload>> {
  const currentValue = computed(() => toValue(rawCurrentValue))

  const config = computed(() => toValue(rawConfig))

  return computed(
    () =>
      Object.entries(config.value)
        .map(([value, payload]) => ({ value: value === 'default' ? -Infinity : Number(value), payload }))
        .sort((a, b) => b.value - a.value)
        .find(threshold => currentValue.value >= threshold.value)!
  )
}
