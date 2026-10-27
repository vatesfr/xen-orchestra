import {
  type EditBackupRepositoryPayload,
  useXoBackupRepositoryEditJob,
} from '@/modules/backup-repository/jobs/xo-backup-repository-edit.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useEditBackupRepository(rawBr: MaybeRefOrGetter<FrontXoBackupRepository>) {
  const br = toComputed(rawBr)

  const payload = ref<EditBackupRepositoryPayload>()

  const {
    run,
    canRun: canEditBackupRepository,
    isRunning: isEditingBackupRepository,
    errorMessage: editBackupRepositoryErrorMessage,
  } = useXoBackupRepositoryEditJob(br, payload)

  const { open } = useOverlay({
    component: () => import('@/modules/backup-repository/components/drawer/EditBackupRepositoryDrawer.vue'),
    events: {
      onConfirm: async (newPayload: EditBackupRepositoryPayload) => {
        payload.value = newPayload

        try {
          await run()
        } catch (error) {
          console.error('Error when editing backup repository', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    br: br.value,
  }))

  function editBackupRepository() {
    return open({ props })
  }

  return {
    editBackupRepository,
    canEditBackupRepository,
    isEditingBackupRepository,
    editBackupRepositoryErrorMessage,
  }
}
