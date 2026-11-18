import { type EditXoUserPayload, useXoUserEditJob } from '@/modules/user/jobs/xo-user-edit.job.ts'
import { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoUser } from '@vates/types'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useEditAccount(rawUser: MaybeRefOrGetter<XoUser>) {
  const user = toComputed(rawUser)

  const { $context } = useXoUserResource({}, () => 'me')

  const payload = ref<EditXoUserPayload>()

  const {
    run,
    canRun: canEditAccount,
    isRunning: isEditingAccount,
    errorMessage: editAccountErrorMessage,
  } = useXoUserEditJob(user, payload)

  const { open } = useOverlay({
    component: () => import('@/modules/account/components/drawer/EditAccountDrawer.vue'),
    events: {
      onConfirm: async (newPayload: EditXoUserPayload) => {
        payload.value = newPayload

        try {
          await run()

          $context.forceReload()
        } catch (error) {
          console.error('Error when editing account', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    user: user.value,
  }))

  function editAccount() {
    return open({ props })
  }

  return {
    editAccount,
    canEditAccount,
    isEditingAccount,
    editAccountErrorMessage,
  }
}
