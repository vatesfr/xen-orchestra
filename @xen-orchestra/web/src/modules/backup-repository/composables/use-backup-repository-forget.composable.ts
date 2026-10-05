import { useXoBackupRepositoryForgetJob } from '@/modules/backup-repository/jobs/xo-backup-repository-forget.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'

export function useBackupRepositoryForget(rawBrs: MaybeRefOrGetter<FrontXoBackupRepository[]>) {
  const brs = toComputed(rawBrs)

  const selectedBrId = useRouteQuery('id')

  const {
    run,
    canRun: canForgetBackupRepositories,
    isRunning: isForgettingBackupRepositories,
    errorMessage: forgetBackupRepositoriesErrorMessage,
  } = useXoBackupRepositoryForgetJob(brs)

  const { open } = useOverlay({
    component: () => import('@/modules/backup-repository/components/modal/BackupRepositoryForgetModal.vue'),
    events: {
      onConfirm: async () => {
        try {
          const results = await run()

          const isSelectedBrForgotten = results.some(
            (result, index) => result.status === 'fulfilled' && brs.value[index]?.id === selectedBrId.value
          )

          if (isSelectedBrForgotten) {
            selectedBrId.value = ''
          }
        } catch (error) {
          console.error('Error when forgetting backup repository:', error)
        }
      },
      onCancel: true,
    },
  })

  function forgetBackupRepositories() {
    return open()
  }

  return {
    forgetBackupRepositories,
    canForgetBackupRepositories,
    isForgettingBackupRepositories,
    forgetBackupRepositoriesErrorMessage,
  }
}
