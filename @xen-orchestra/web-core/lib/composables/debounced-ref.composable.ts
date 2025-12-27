import { useDebounceFn } from '@vueuse/shared'
import { type Ref, type ComputedRef, ref, computed, watch } from 'vue'

export type UseDebouncedRefReturn<TValue> = {
  value: Ref<TValue>
  debouncedValue: ComputedRef<TValue>
  isDebouncing: ComputedRef<boolean>
  forceUpdate: () => void
}

export function useDebouncedRef<TValue>(initialValue: TValue, delay: number): UseDebouncedRefReturn<TValue> {
  const value = ref(initialValue) as Ref<TValue>

  const debouncedValue = ref(initialValue) as Ref<TValue>

  const updater = useDebounceFn(() => {
    debouncedValue.value = value.value
  }, delay)

  watch(value, newValue => {
    if (!newValue) {
      debouncedValue.value = newValue
    } else {
      updater()
    }
  })

  const isDebouncing = computed(() => debouncedValue.value !== value.value)

  function forceUpdate() {
    debouncedValue.value = value.value
  }

  return {
    value,
    debouncedValue: computed(() => debouncedValue.value),
    isDebouncing,
    forceUpdate,
  }
}
