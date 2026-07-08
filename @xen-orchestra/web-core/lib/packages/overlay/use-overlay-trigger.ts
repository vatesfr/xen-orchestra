import { IK_OVERLAY_KEY } from '@core/packages/overlay/injection-keys'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store'
import { computed, inject } from 'vue'

export function useOverlayTrigger() {
  const overlayKey = inject(IK_OVERLAY_KEY, undefined)

  const triggerKey = Symbol('overlay trigger')

  const overlayStore = useOverlayStore()

  const overlay = computed(() => {
    if (overlayKey === undefined) {
      return undefined
    }

    return overlayStore.get(overlayKey.value)
  })

  const status = computed(() => overlay.value?.status ?? 'idle')

  const isBusy = computed(() => overlay.value?.lastTrigger === triggerKey && status.value === 'busy')

  const isDisabled = computed(() => status.value !== 'idle')

  function trigger() {
    if (overlay.value) {
      overlay.value.lastTrigger = triggerKey
    }
  }

  return { isBusy, isDisabled, trigger }
}
