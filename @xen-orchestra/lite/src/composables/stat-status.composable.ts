import type { Stat } from '@/composables/fetch-stats.composable'
import type { StatData } from '@/types/stat'
import type { MaybeRef } from '@vueuse/core'
import { computed, type ComputedRef, toRef } from 'vue'

export const useStatStatus = (
  _stats: MaybeRef<Stat<any>[]>,
  _data: MaybeRef<StatData[]>,
  _isFetching: MaybeRef<boolean>
) => {
  const stats = toRef(_stats)
  const data = toRef(_data)
  const isFetching = toRef(_isFetching)

  const _isStatFetched: ComputedRef<boolean> = computed(() => stats.value.length === data.value.length)

  const isStatEmpty: ComputedRef<boolean> = computed(
    () => !isFetching.value && stats.value.length === 0 && data.value.length === 0
  )

  const isLoading: ComputedRef<boolean> = computed(() => isFetching.value || !_isStatFetched.value)

  return {
    isStatEmpty,
    isLoading,
  }
}
