import { defineStore } from 'pinia'
import { onBeforeUnmount, ref, watch } from 'vue'

const beforeUnloadListener = function (e: BeforeUnloadEvent) {
  e.preventDefault()
  e.returnValue = '' // Required to trigger the modal on some browser. https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#browser_compatibility
}

export const useClosingConfirmationStore = defineStore('closing-confirmation', () => {
  const registeredIds = ref(new Set<symbol>())
  watch(
    () => registeredIds.value.size > 0,
    isConfirmationNeeded => {
      const eventMethod = isConfirmationNeeded ? 'addEventListener' : 'removeEventListener'

      window[eventMethod]('beforeunload', beforeUnloadListener)
    }
  )

  const register = () => {
    const id = Symbol('CLOSING_CONFIRMATION_ID')
    registeredIds.value.add(id)

    const unregister = () => registeredIds.value.delete(id)

    onBeforeUnmount(unregister)

    return unregister
  }

  return {
    register,
  }
})
