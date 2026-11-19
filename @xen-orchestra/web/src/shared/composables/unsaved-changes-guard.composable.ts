import { useDiscardChangesModal } from '@core/composables/modals/use-discard-changes-modal.ts'
import { useEventListener } from '@vueuse/core'
import { type MaybeRefOrGetter, onScopeDispose, toValue } from 'vue'
import { useRouter } from 'vue-router'

export function useUnsavedChangesGuard(hasUnsavedChanges: MaybeRefOrGetter<boolean>) {
  const router = useRouter()

  const { open: openDiscardChangesModal } = useDiscardChangesModal()

  let pendingAnswer: Promise<boolean> | undefined

  const removeGuard = router.beforeEach((to, from) => {
    if (to.path === from.path || !toValue(hasUnsavedChanges)) {
      return true
    }

    if (pendingAnswer !== undefined) {
      return false
    }

    pendingAnswer = openDiscardChangesModal()
      .then(({ event }) => event === 'onConfirm')
      .finally(() => {
        pendingAnswer = undefined
      })

    return pendingAnswer
  })

  onScopeDispose(removeGuard)

  // A tab closed or reloaded cannot show the modal: the browser asks with its own dialog
  useEventListener(window, 'beforeunload', event => {
    if (toValue(hasUnsavedChanges)) {
      event.preventDefault()
    }
  })
}
