import { type RegisterAppliancePayload, useXoaRegisterJob } from '@/modules/appliance/jobs/xoa-register.job.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { HttpCodes } from '@core/types/http-codes.type.ts'
import { reactiveComputed } from '@vueuse/core'
import { ref } from 'vue'

export function useRegisterAppliance({ renew }: { renew: boolean } = { renew: false }) {
  const payload = ref<RegisterAppliancePayload>()

  const wrongCredentials = ref(false)

  const { run, isRunning: isRegistering } = useXoaRegisterJob(payload)

  const { open } = useOverlay({
    component: () => import('@/modules/appliance/components/drawer/RegisterApplianceDrawer.vue'),
    events: {
      onConfirm: async (newPayload: RegisterAppliancePayload) => {
        payload.value = { ...newPayload, renew }
        wrongCredentials.value = false

        try {
          await run()
        } catch (error) {
          if (error instanceof ApiError && error.status === HttpCodes.Unauthorized) {
            wrongCredentials.value = true
          } else {
            console.error('Error when registering the appliance', error)
          }

          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    wrongCredentials: wrongCredentials.value,
  }))

  function openRegisterApplianceDrawer() {
    wrongCredentials.value = false

    return open({ props })
  }

  return {
    openRegisterApplianceDrawer,
    isRegistering,
  }
}
