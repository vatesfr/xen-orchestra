import {
  type ChangeXoUserPasswordPayload,
  useXoUserPasswordChangeJob,
} from '@/modules/account/jobs/xo-user-password-change.job.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export function useEditAccountPassword() {
  const payload = ref<ChangeXoUserPasswordPayload>()

  const {
    run,
    canRun: canEditAccountPassword,
    isRunning: isEditingAccountPassword,
    errorMessage: editAccountPasswordErrorMessage,
  } = useXoUserPasswordChangeJob(payload)

  const { open: editAccountPassword } = useOverlay({
    component: () => import('@/modules/account/components/drawer/EditPasswordDrawer.vue'),
    events: {
      onConfirm: async (newPayload: ChangeXoUserPasswordPayload) => {
        payload.value = newPayload

        try {
          await run()
        } catch (error) {
          console.error('Error when changing password', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  return {
    editAccountPassword,
    canEditAccountPassword,
    isEditingAccountPassword,
    editAccountPasswordErrorMessage,
  }
}
