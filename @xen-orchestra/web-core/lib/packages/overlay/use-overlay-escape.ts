import { IK_OVERLAY_KEY } from '@core/packages/overlay/injection-keys'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store'
import { onKeyStroke } from '@vueuse/core'
import { inject } from 'vue'

/**
 * Calls the handler when Escape is pressed while the calling component is the
 * current (topmost) overlay and is not busy. The handler is expected to emit
 * the component's own close event, so that Escape goes through the exact same
 * pipeline as a pointer interaction.
 */
export function useOverlayEscape(handler: () => void) {
  const overlayKey = inject(IK_OVERLAY_KEY, undefined)

  if (overlayKey === undefined) {
    return
  }

  const overlayStore = useOverlayStore()

  onKeyStroke('Escape', () => {
    if (!overlayStore.isCurrent(overlayKey.value)) {
      return
    }

    const overlay = overlayStore.get(overlayKey.value)

    if (overlay?.status !== 'idle') {
      return
    }

    handler()
  })
}
