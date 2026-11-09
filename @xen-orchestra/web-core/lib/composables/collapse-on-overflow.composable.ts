import { type MaybeElementRef, unrefElement, useResizeObserver } from '@vueuse/core'
import { type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

export function useCollapseOnOverflow(
  container: MaybeElementRef,
  content: MaybeElementRef,
  maxCollapsedCount: MaybeRefOrGetter<number>
) {
  const collapsedCount = ref(0)

  const requiredWidths: number[] = []

  function update() {
    const element = unrefElement(container)

    if (element === null || element === undefined) {
      return
    }

    if (element.scrollWidth > element.clientWidth) {
      if (collapsedCount.value < toValue(maxCollapsedCount)) {
        requiredWidths[collapsedCount.value] = element.scrollWidth
        collapsedCount.value++
      }

      return
    }

    if (collapsedCount.value > 0 && element.clientWidth >= requiredWidths[collapsedCount.value - 1]) {
      collapsedCount.value--
    }
  }

  function reset() {
    requiredWidths.length = 0
    collapsedCount.value = 0
  }

  useResizeObserver([container, content], () => update())

  watch(
    () => toValue(maxCollapsedCount),
    max => {
      if (collapsedCount.value > max) {
        collapsedCount.value = max
      }
    }
  )

  return { collapsedCount, reset }
}
