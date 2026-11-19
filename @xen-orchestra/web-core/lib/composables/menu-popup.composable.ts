import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { placeOverlay } from '@core/utils/placement.util.ts'
import { onClickOutside, useEventListener } from '@vueuse/core'
import type { Options } from 'placement.js'
import { type MaybeRefOrGetter, ref, type Ref, toValue, watch } from 'vue'

type MenuPopupOptions = {
  isOpen: Ref<boolean>
  anchor: MaybeRefOrGetter<HTMLElement | undefined>
  placement: MaybeRefOrGetter<Options['placement']>
  closesOnClickOutside: boolean
  hasOpenSubmenu: MaybeRefOrGetter<boolean>
  onClosed: () => void
}

export function useMenuPopup(
  menu: MaybeRefOrGetter<HTMLElement | null | undefined>,
  { isOpen, anchor, placement, closesOnClickOutside, hasOpenSubmenu, onClosed }: MenuPopupOptions
) {
  const placementSide = ref<string>()

  const overlayStore = useOverlayStore()

  let overlayCountOnOpen = 0

  let stopClickOutside: (() => void) | undefined

  function close(restoreFocus = false) {
    isOpen.value = false

    if (restoreFocus) {
      toValue(anchor)?.focus()
    }
  }

  function hasFocusInside() {
    const list = document.activeElement?.closest('.menu-list')

    if (list === null || list === undefined) {
      return false
    }

    return list !== toValue(anchor)?.closest('.menu-list')
  }

  function place(menuElement: HTMLElement, reference: HTMLElement) {
    placeOverlay(reference, menuElement, { placement: toValue(placement) })

    placementSide.value = menuElement.dataset.placement?.split('-')[0]

    if (closesOnClickOutside) {
      stopClickOutside = onClickOutside(menuElement, () => close(), {
        ignore: () => [reference, '.menu-list'],
        controls: false,
      })
    }
  }

  watch(
    isOpen,
    opened => {
      if (!opened) {
        stopClickOutside?.()
        stopClickOutside = undefined
        onClosed()
        return
      }

      overlayCountOnOpen = overlayStore.overlays.length

      const menuElement = toValue(menu)
      const reference = toValue(anchor)

      if (menuElement !== null && menuElement !== undefined && reference !== undefined) {
        place(menuElement, reference)
      }
    },
    { immediate: true, flush: 'post' }
  )

  watch(
    isOpen,
    opened => {
      if (!opened && hasFocusInside()) {
        toValue(anchor)?.focus()
      }
    },
    { flush: 'pre' }
  )

  useEventListener(
    () => (isOpen.value ? window : undefined),
    'keydown',
    (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || toValue(hasOpenSubmenu)) {
        return
      }

      if (overlayStore.overlays.length > overlayCountOnOpen) {
        return
      }

      event.preventDefault()
      close(true)
    },
    { capture: true }
  )

  return { placementSide, close }
}
