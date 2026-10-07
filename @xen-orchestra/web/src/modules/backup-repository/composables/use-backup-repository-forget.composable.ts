import { useXoBackupRepositoryForgetJob } from '@/modules/backup-repository/jobs/xo-backup-repository-forget.job.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useBackupRepositoryForget(rawBrs: MaybeRefOrGetter<FrontXoBackupRepository[]>) {
  const brs = toComputed(rawBrs)

  const { t } = useI18n()

  const selectedBrId = useRouteQuery('id')

  const { $context } = useXoBackupRepositoryCollection()

  const {
    run,
    canRun: canForgetBackupRepositories,
    isRunning: isForgettingBackupRepositories,
    errorMessage: forgetBackupRepositoriesErrorMessage,
  } = useXoBackupRepositoryForgetJob(brs)

  async function forget() {
    try {
      const results = await run()

      // Force reload while waiting for reactivity to be implemented for XO objects (XO-1013)
      $context.forceReload()

      const isSelectedBrForgotten = results.some(
        (result, index) => result.status === 'fulfilled' && brs.value[index]?.id === selectedBrId.value
      )

      if (isSelectedBrForgotten) {
        selectedBrId.value = ''
      }
    } catch (error) {
      console.error('Error when forgetting backup repository:', error)
    }
  }

  const { open: openForgetModal } = useOverlay({
    component: () => import('@/modules/backup-repository/components/modal/BackupRepositoryForgetModal.vue'),
    events: {
      onConfirm: forget,
      onCancel: true,
    },
  })

  const { open: openTypeToConfirmModal } = useOverlay({
    component: () => import('@core/components/modal/VtsTypeToConfirmModal.vue'),
    events: {
      onConfirm: forget,
      onCancel: true,
    },
  })

  function forgetBackupRepositories() {
    const count = brs.value.length

    if (count === 1) {
      return openForgetModal()
    }

    return openTypeToConfirmModal({
      props: {
        accent: 'danger',
        icon: 'status:danger-picto',
        title: t('modal:backup-repository-forget-n-title', { n: count }),
        description: t('modal:backup-repository-forget-n-message'),
        confirmationText: t('n-brs', { n: count }),
        confirmLabel: t('action:forget-n-brs', { n: count }),
      },
    })
  }

  return {
    forgetBackupRepositories,
    canForgetBackupRepositories,
    isForgettingBackupRepositories,
    forgetBackupRepositoriesErrorMessage,
  }
}
