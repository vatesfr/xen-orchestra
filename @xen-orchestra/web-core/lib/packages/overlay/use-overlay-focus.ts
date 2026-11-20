import { IK_OVERLAY_KEY } from '@core/packages/overlay/injection-keys.ts'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { inject, onMounted, onUnmounted, toValue, type MaybeRefOrGetter } from 'vue'

/**
 * Moves the focus to the target once the calling component is mounted, unless
 * a nested component already took it, then gives it back to the element that
 * had it when the overlay was opened once the component is unmounted.
 */
export function useOverlayFocus(target: MaybeRefOrGetter<HTMLElement | null | undefined>) {
  const overlayKey = inject(IK_OVERLAY_KEY, undefined)

  if (overlayKey === undefined) {
    return
  }

  const returnFocusTarget = useOverlayStore().get(overlayKey.value)?.returnFocusTarget

  onMounted(() => {
    const element = toValue(target)

    if (element && !element.contains(document.activeElement)) {
      element.focus()
    }
  })

  onUnmounted(() => {
    if (returnFocusTarget instanceof HTMLElement && returnFocusTarget.isConnected) {
      returnFocusTarget.focus()
    }
  })
}
