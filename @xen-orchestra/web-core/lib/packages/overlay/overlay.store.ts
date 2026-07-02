import type { RegisteredOverlay } from '@core/packages/overlay/types.ts'
import { defineStore } from 'pinia'
import { computed, shallowReactive } from 'vue'

export const useOverlayStore = defineStore('overlay', () => {
  const overlays = shallowReactive(new Map<symbol | string, RegisteredOverlay>())

  const addOverlay = (overlay: RegisteredOverlay) => {
    overlays.set(overlay.id, overlay)
  }

  const removeOverlay = (id: symbol | string) => {
    overlays.delete(id)
  }

  return {
    overlays: computed(() => Array.from(overlays.values())),
    getOverlay: (id: symbol | string) => overlays.get(id),
    addOverlay,
    removeOverlay,
  }
})
