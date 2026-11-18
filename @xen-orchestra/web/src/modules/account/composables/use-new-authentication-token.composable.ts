import {
  type NewAuthenticationTokenPayload,
  useXoAuthenticationTokenCreateJob,
} from '@/modules/account/jobs/xo-authentication-token-create.job.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export function useNewAuthenticationToken() {
  const payload = ref<NewAuthenticationTokenPayload>()

  const { run } = useXoAuthenticationTokenCreateJob(payload)

  const { open: openNewAuthenticationTokenDrawer } = useOverlay({
    component: () => import('@/modules/account/components/drawer/AuthenticationTokenDrawer.vue'),
    events: {
      onConfirm: async (newPayload: NewAuthenticationTokenPayload) => {
        payload.value = newPayload

        try {
          await run()
        } catch (error) {
          console.error('Error when creating authentication token', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  return {
    openNewAuthenticationTokenDrawer,
  }
}
