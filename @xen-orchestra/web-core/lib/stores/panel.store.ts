import { useUiStore } from '@core/stores/ui.store'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePanelStore = defineStore('panel', () => {
  const uiStore = useUiStore()
  const isExpanded = useLocalStorage('panel.expanded', true)
  const isLocked = useLocalStorage('panel.locked', true)

  const cssVerticalOffset = '16.5rem'
  const cssHorizontalOffset = computed(() => (isExpanded.value ? 0 : '100%'))
  const actsAsFloating = computed(() => uiStore.isSmall || !isLocked.value)

  function expand() {
    isExpanded.value = true
  }

  function collapse() {
    isExpanded.value = false
  }

  function toggleExpand(value?: boolean) {
    isExpanded.value = typeof value === 'boolean' ? value : !isExpanded.value
  }

  function syncWithSelection(hasSelection: boolean) {
    if (!actsAsFloating.value) return
    if (!hasSelection && isExpanded.value) collapse()
    else if (hasSelection && !isExpanded.value) expand()
  }

  function toggleLock(value?: boolean) {
    const next = typeof value === 'boolean' ? value : !isLocked.value
    isLocked.value = next
    if (next && !uiStore.isSmall && !isExpanded.value) {
      expand()
    }
  }

  return {
    actsAsFloating,
    collapse,
    cssHorizontalOffset,
    cssVerticalOffset,
    expand,
    isExpanded,
    isLocked,
    syncWithSelection,
    toggleExpand,
    toggleLock,
  }
})
