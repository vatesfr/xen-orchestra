import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function useCenteredWindow<TItem>(
  rawItems: MaybeRefOrGetter<TItem[]>,
  rawCurrentIndex: MaybeRefOrGetter<number>,
  visibleCount: number
) {
  const items = toComputed(rawItems)
  const currentIndex = toComputed(rawCurrentIndex)

  const isExpanded = ref(false)

  const hasHiddenItems = computed(() => items.value.length > visibleCount)

  const visibleItems = computed(() => {
    if (isExpanded.value || !hasHiddenItems.value) {
      return items.value
    }

    const lastStart = items.value.length - visibleCount
    const centeredStart = currentIndex.value - Math.floor(visibleCount / 2)
    const start = Math.min(Math.max(centeredStart, 0), lastStart)

    return items.value.slice(start, start + visibleCount)
  })

  return {
    isExpanded,
    hasHiddenItems,
    visibleItems,
  }
}
