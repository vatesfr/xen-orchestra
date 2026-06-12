import { useUiStore } from '@core/stores/ui.store'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePanelStore = defineStore('panel', () => {
  const uiStore = useUiStore()
  const isExpanded = useLocalStorage('panel.expanded', true)
  const isLocked = useLocalStorage('panel.locked', true)

  const cssHorizontalOffset = computed(() => (isExpanded.value ? 0 : '100%'))
  const actsAsFloating = computed(() => uiStore.isSmall || !isLocked.value)

  function expand() {
    isExpanded.value = true
  }

  function collapse() {
    isExpanded.value = false
  }

  function syncWithSelection(hasSelection: boolean) {
    if (!actsAsFloating.value) {
      return
    }
    if (!hasSelection && isExpanded.value) {
      collapse()
    } else if (hasSelection && !isExpanded.value) {
      expand()
    }
  }

  function toggleLock() {
    const next = !isLocked.value
    isLocked.value = next
    if (next && !uiStore.isSmall && !isExpanded.value) {
      expand()
    }
  }

  return {
    isExpanded,
    isLocked,
    actsAsFloating,
    expand,
    collapse,
    toggleLock,
    syncWithSelection,
    cssHorizontalOffset,
  }
})
