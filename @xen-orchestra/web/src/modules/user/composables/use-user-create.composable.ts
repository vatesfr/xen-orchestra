import { useXoUserCreateJob } from '@/modules/user/jobs/xo-user-create.job.ts'
import type { NewUserPayload } from '@/modules/user/types.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { reactiveComputed } from '@vueuse/core'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function useUserCreate() {
  const { t } = useI18n()

  const newUser = ref<NewUserPayload>()

  const errorMessage = ref<string>()

  const { run } = useXoUserCreateJob(newUser)

  const { open } = useOverlay({
    component: () => import('@/modules/user/components/drawer/NewUserDrawer.vue'),
    events: {
      onConfirm: async (payload: NewUserPayload) => {
        newUser.value = payload
        errorMessage.value = undefined

        try {
          await run()
        } catch (error) {
          console.error('Error when creating user:', error)

          errorMessage.value =
            error instanceof ApiError && error.status === 409
              ? t('new-user:error-already-exists')
              : t('new-user:error-message')

          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const drawerProps = reactiveComputed(() => ({ errorMessage: errorMessage.value }))

  function createUser() {
    errorMessage.value = undefined

    return open({ props: drawerProps })
  }

  return { createUser }
}
