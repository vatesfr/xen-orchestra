import {
  type EditAuthenticationTokenPayload,
  useXoAuthenticationTokenEditJob,
} from '@/modules/account/jobs/xo-authentication-token-edit.job.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoAuthenticationToken } from '@vates/types'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useEditAuthenticationToken(rawToken: MaybeRefOrGetter<XoAuthenticationToken>) {
  const token = toComputed(rawToken)

  const payload = ref<EditAuthenticationTokenPayload>()

  const {
    run,
    canRun: canEditAuthenticationToken,
    isRunning: isEditingAuthenticationToken,
    errorMessage: editAuthenticationTokenErrorMessage,
  } = useXoAuthenticationTokenEditJob(token, payload)

  const { open } = useOverlay({
    component: () => import('@/modules/account/components/drawer/AuthenticationTokenDrawer.vue'),
    events: {
      onConfirm: async ({ description }: EditAuthenticationTokenPayload) => {
        payload.value = { description }

        try {
          await run()
        } catch (error) {
          console.error('Error when editing authentication token', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    token: token.value,
  }))

  function editAuthenticationToken() {
    return open({ props })
  }

  return {
    editAuthenticationToken,
    canEditAuthenticationToken,
    isEditingAuthenticationToken,
    editAuthenticationTokenErrorMessage,
  }
}
