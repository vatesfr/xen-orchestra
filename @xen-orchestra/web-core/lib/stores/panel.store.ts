import { useResizableWidth } from '@core/composables/resizable-width.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, watch } from 'vue'

export const PANEL_TRANSITION_DURATION = 250

export const usePanelStore = defineStore('panel', () => {
  const uiStore = useUiStore()
  const isExpanded = useLocalStorage('panel.expanded', true, { listenToStorageChanges: false })
  const isLocked = useLocalStorage('panel.locked', true)

  const resizableWidth = useResizableWidth('right', 'panel.custom-width')

  const cssWidth = computed(() => `${resizableWidth.width.value}px`)

  const cssHorizontalOffset = computed(() => (isExpanded.value ? 0 : '100%'))
  /* Panel closes automatically when it has no content (true on small UI or when not locked) */
  const syncsOpenStateWithSelection = computed(() => uiStore.isSmall || !isLocked.value)

  function expand() {
    isExpanded.value = true
  }

  function collapse() {
    isExpanded.value = false
  }

  function syncWithSelection(hasSelection: boolean) {
    if (!syncsOpenStateWithSelection.value) {
      return
    }
    if (!hasSelection && isExpanded.value) {
      collapse()
    } else if (hasSelection && !isExpanded.value) {
      expand()
    }
  }

  function toggleLock() {
    isLocked.value = !isLocked.value
  }

  watch(
    [() => uiStore.isSmall, isLocked],
    () => {
      /* Expand when locked on large UI (also when locked from another tab), if not expanded */
      if (!uiStore.isSmall && isLocked.value && !isExpanded.value) {
        expand()
      }
    },
    { immediate: true }
  )

  return {
    isExpanded,
    isLocked,
    syncsOpenStateWithSelection,
    expand,
    collapse,
    toggleLock,
    syncWithSelection,
    cssHorizontalOffset,
    cssWidth,
    ...resizableWidth,
  }
})
