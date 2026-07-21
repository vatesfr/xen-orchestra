import { useUiStore } from '@core/stores/ui.store.ts'
import { watch, type Ref } from 'vue'

export function useSidebarResponsiveExpand(isExpanded: Ref<boolean>) {
  const uiStore = useUiStore()

  let desktopExpanded = isExpanded.value

  watch(
    () => uiStore.isSmall,
    (isSmall, wasSmall) => {
      if (isSmall && !wasSmall) {
        desktopExpanded = isExpanded.value
      } else if (!isSmall && wasSmall) {
        isExpanded.value = desktopExpanded
      }
    }
  )
}
