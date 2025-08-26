import type { ProgressGroup, UseProgressGroupOptions } from './types.ts'
import { useArrayMap } from '@vueuse/shared'
import { computed, markRaw, type MaybeRefOrGetter, reactive, toValue } from 'vue'
import { useProgress } from './use-progress.ts'

export function useProgressGroup<TSource extends { current: number; total: number }>(
  rawSources: MaybeRefOrGetter<TSource[]>,
  options?: UseProgressGroupOptions
): ProgressGroup<TSource>

export function useProgressGroup<TSource>(
  rawSources: MaybeRefOrGetter<TSource[]>,
  fn: (item: TSource) => { current: number; total: number },
  options?: UseProgressGroupOptions
): ProgressGroup<TSource>

export function useProgressGroup<TSource>(
  rawSources: MaybeRefOrGetter<TSource[]>,
  fnOrOptions?: UseProgressGroupOptions | ((item: TSource) => { current: number; total: number }),
  optionsOrNone?: UseProgressGroupOptions
): ProgressGroup<TSource> {
  const fn =
    typeof fnOrOptions === 'function' ? fnOrOptions : (item: TSource) => item as { current: number; total: number }
  const options = typeof fnOrOptions === 'function' ? optionsOrNone : fnOrOptions

  const progressItems = useArrayMap(rawSources, source => {
    const { current, total } = fn(source)

    return {
      source: typeof source === 'object' && source !== null ? markRaw(source) : source,
      ...useProgress(current, total),
    }
  })

  const highestPercentage = computed(() =>
    progressItems.value.reduce((highestPercentage, item) => Math.max(highestPercentage, item.percentage.value), 0)
  )

  const highestPercentageCap = computed(() =>
    progressItems.value.reduce((highestCap, item) => Math.max(highestCap, item.percentageCap.value), 100)
  )

  const normalizedProgressItems = useArrayMap(progressItems, item => {
    const fillWidth = computed(() => `${(item.percentage.value / highestPercentageCap.value) * 100}%`)

    return reactive({
      ...item,
      fillWidth,
    })
  })

  const sortedProgressItems = computed(() => {
    switch (toValue(options?.sort)) {
      case 'asc':
        return [...normalizedProgressItems.value].sort((a, b) => a.percentage - b.percentage)
      case 'desc':
        return [...normalizedProgressItems.value].sort((a, b) => b.percentage - a.percentage)
      default:
        return normalizedProgressItems.value
    }
  })

  return {
    progressItems: sortedProgressItems,
    highestPercentage,
    highestPercentageCap,
  }
}
