import { IK_DISABLED } from '@core/utils/injection-keys.util.ts'
import { computed, inject, type MaybeRefOrGetter, provide, toValue } from 'vue'

export function useDisabled(condition?: MaybeRefOrGetter<boolean>) {
  const previousValue = inject(
    IK_DISABLED,
    computed(() => false)
  )

  const currentValue = computed(() => previousValue.value || toValue(condition ?? false))

  provide(IK_DISABLED, currentValue)

  return currentValue
}
