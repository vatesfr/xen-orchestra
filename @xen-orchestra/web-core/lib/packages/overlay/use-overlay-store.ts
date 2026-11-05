import type { Overlay } from '@core/packages/overlay/types.ts'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useOverlayStore = defineStore('overlay', () => {
  const registry = ref(new Map<symbol, Overlay>())

  function register(overlay: Overlay) {
    registry.value.set(overlay.key, overlay)
  }

  function unregister(overlay: Overlay) {
    if (registry.value.get(overlay.key) === overlay) {
      registry.value.delete(overlay.key)
    }
  }

  function abortAll() {
    registry.value.forEach(overlay => overlay.abort())
  }

  function isCurrent(key: symbol): boolean {
    return Array.from(registry.value.keys()).at(-1) === key
  }

  function get(key: symbol): Overlay | undefined {
    return registry.value.get(key)
  }

  return {
    overlays: computed(() => Array.from(registry.value.values())),
    register,
    unregister,
    abortAll,
    isCurrent,
    get,
  }
})
