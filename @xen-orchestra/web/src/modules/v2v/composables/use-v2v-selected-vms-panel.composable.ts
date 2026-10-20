import { usePanelStore } from '@core/stores/panel.store.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { onMounted, watch } from 'vue'

// The selected VMs panel always has content, so the side panel opens it like a selection; on a small screen, where it
// would cover the table, it stays closed until asked for
export function useV2vSelectedVmsPanel() {
  const panelStore = usePanelStore()
  const uiStore = useUiStore()

  function closeOnSmallScreen() {
    if (uiStore.isSmall) {
      panelStore.collapse()
    }
  }

  // After the side panel's own watcher, which opens a panel holding a selection on a small screen
  onMounted(closeOnSmallScreen)
  watch(() => uiStore.isSmall, closeOnSmallScreen, { flush: 'post' })
}
