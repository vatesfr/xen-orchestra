import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { type SidebarSide, useSidebar } from '@core/packages/sidebar'
import { onKeyStroke } from '@vueuse/core'
import { type MaybeRefOrGetter, nextTick, toValue } from 'vue'

const SHORTCUT_KEY = 'k'

const IS_MAC = navigator.userAgent.includes('Mac')

export const TREE_SEARCH_SHORTCUT_LABEL = `${IS_MAC ? '⌘' : 'Ctrl'}+${SHORTCUT_KEY.toUpperCase()}`

export const TREE_SEARCH_ARIA_KEY_SHORTCUTS = `${IS_MAC ? 'Meta' : 'Control'}+${SHORTCUT_KEY.toUpperCase()}`

function isTreeSearchShortcut(event: KeyboardEvent) {
  return (
    (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === SHORTCUT_KEY
  )
}

export function useTreeSearchShortcut(
  treeSearch: MaybeRefOrGetter<{ focus: () => void } | null | undefined>,
  options: { side?: MaybeRefOrGetter<SidebarSide>; beforeFocus?: () => void } = {}
) {
  const overlayStore = useOverlayStore()

  onKeyStroke(isTreeSearchShortcut, async event => {
    if (overlayStore.overlays.length > 0) {
      return
    }

    event.preventDefault()

    if (event.repeat) {
      return
    }

    useSidebar(toValue(options.side)).toggleExpand(true)
    options.beforeFocus?.()

    await nextTick()

    toValue(treeSearch)?.focus()
  })
}
