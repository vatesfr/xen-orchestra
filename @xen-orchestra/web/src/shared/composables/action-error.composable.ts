import { ref } from 'vue'

export function useActionError() {
  const error = ref<unknown>()

  function clearError() {
    error.value = undefined
  }

  async function runAction(action: () => Promise<unknown>): Promise<boolean> {
    clearError()

    try {
      await action()

      return true
    } catch (actionError) {
      error.value = actionError

      return false
    }
  }

  return { error, clearError, runAction }
}
