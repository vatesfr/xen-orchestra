import type { ThresholdConfig, ThresholdResult } from '@core/packages/threshold/type.ts'
import { toComputed } from '@core/utils/to-computed.util'
import { computed, type ComputedRef, type MaybeRefOrGetter } from 'vue'

export function useThreshold<TPayload>(
  rawCurrentValue: MaybeRefOrGetter<number>,
  rawConfig: MaybeRefOrGetter<ThresholdConfig<TPayload>>
): ComputedRef<ThresholdResult<TPayload>> {
  const currentValue = toComputed(rawCurrentValue)

  const config = toComputed(rawConfig)

  return computed(
    () =>
      Object.entries(config.value)
        .map(([value, payload]) => ({ value: value === 'default' ? -Infinity : Number(value), payload }))
        .sort((a, b) => b.value - a.value)
        .find(threshold => currentValue.value >= threshold.value)!
  )
}
