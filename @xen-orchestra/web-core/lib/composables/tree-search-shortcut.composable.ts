import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { type SidebarSide, useSidebar } from '@core/packages/sidebar'
import { onKeyStroke } from '@vueuse/core'
import { type MaybeRefOrGetter, nextTick, toValue } from 'vue'

type Focusable = { focus: () => void }

function isTreeSearchShortcut(event: KeyboardEvent) {
  return (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k'
}

export function useTreeSearchShortcut(
  treeSearch: MaybeRefOrGetter<Focusable | null | undefined>,
  options: { side?: SidebarSide; beforeFocus?: () => void } = {}
) {
  const sidebar = useSidebar(options.side)

  const overlayStore = useOverlayStore()

  onKeyStroke(isTreeSearchShortcut, async event => {
    event.preventDefault()

    if (event.repeat || overlayStore.overlays.length > 0) {
      return
    }

    sidebar.toggleExpand(true)
    options.beforeFocus?.()

    await nextTick()

    toValue(treeSearch)?.focus()
  })
}
