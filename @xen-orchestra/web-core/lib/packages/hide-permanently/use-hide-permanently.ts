import type { PermanentlyHideableId } from '@core/packages/hide-permanently/types.ts'
import { makeDestructurable, useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

export function useHidePermanently(id: PermanentlyHideableId) {
  const hiddenItems = useLocalStorage('permanently-hidden-items', new Set<PermanentlyHideableId>())

  const isVisible = computed(() => !hiddenItems.value.has(id))

  function hidePermanently() {
    hiddenItems.value.add(id)
  }

  return makeDestructurable({ isVisible, hidePermanently } as const, [isVisible, hidePermanently] as const)
}
