import { useXoGroupCreateJob } from '@/modules/group/jobs/xo-group-create.job.ts'
import type { NewGroupPayload } from '@/modules/group/types.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { reactiveComputed } from '@vueuse/core'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function useGroupCreate() {
  const { t } = useI18n()

  const newGroup = ref<NewGroupPayload>()

  const errorMessage = ref<string>()

  const { run } = useXoGroupCreateJob(newGroup)

  const { open } = useOverlay({
    component: () => import('@/modules/group/components/drawer/NewGroupDrawer.vue'),
    events: {
      onConfirm: async (payload: NewGroupPayload) => {
        newGroup.value = payload
        errorMessage.value = undefined

        try {
          await run()
        } catch (error) {
          console.error('Error when creating group:', error)

          errorMessage.value =
            error instanceof ApiError && error.status === 409
              ? t('new-group:error-already-exists.', { name: payload.group.name })
              : t('new-group:error-message.')

          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const drawerProps = reactiveComputed(() => ({ errorMessage: errorMessage.value }))

  function createGroup() {
    errorMessage.value = undefined

    return open({ props: drawerProps })
  }

  return { createGroup }
}
