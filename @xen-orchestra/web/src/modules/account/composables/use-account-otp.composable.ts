import { type EditXoUserPayload, useXoUserEditJob } from '@/modules/user/jobs/xo-user-edit.job.ts'
import { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import { isXoUserOtpEnabled } from '@/modules/user/utils/xo-user.util.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoUser } from '@vates/types'
import { reactiveComputed } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function useAccountOtp(rawUser: MaybeRefOrGetter<XoUser>) {
  const user = toComputed(rawUser)

  const { $context } = useXoUserResource({}, () => 'me')

  const isOtpEnabled = computed(() => isXoUserOtpEnabled(user.value))

  const otpPayload = ref<EditXoUserPayload>()

  const {
    run,
    canRun: canEditOtp,
    isRunning: isEditingOtp,
    errorMessage: editOtpErrorMessage,
  } = useXoUserEditJob(user, otpPayload)

  async function saveOtp(otp: string | null) {
    otpPayload.value = { preferences: { otp } }

    try {
      await run()

      $context.forceReload()
    } catch (error) {
      console.error('Error when editing OTP authentication', error)
      return KEEP_OVERLAY_OPEN
    }
  }

  const { open: openEnableOtpDrawer } = useOverlay({
    component: () => import('@/modules/account/components/drawer/EnableOtpDrawer.vue'),
    events: {
      onConfirm: (secret: string) => saveOtp(secret),
      onCancel: true,
    },
  })

  const { open: openDisableOtpModal } = useOverlay({
    component: () => import('@/modules/account/components/modal/OtpDisableModal.vue'),
    events: {
      onConfirm: () => saveOtp(null),
      onCancel: true,
    },
  })

  const enableOtpDrawerProps = reactiveComputed(() => ({
    user: user.value,
  }))

  function enableOtp() {
    return openEnableOtpDrawer({ props: enableOtpDrawerProps })
  }

  function disableOtp() {
    return openDisableOtpModal()
  }

  return { isOtpEnabled, canEditOtp, isEditingOtp, editOtpErrorMessage, enableOtp, disableOtp }
}
