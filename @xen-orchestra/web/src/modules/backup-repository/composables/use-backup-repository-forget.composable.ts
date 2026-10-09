import { useXoBackupRepositoryForgetJob } from '@/modules/backup-repository/jobs/xo-backup-repository-forget.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { useRedirectAfterDelete } from '@core/composables/redirect-after-delete.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

export function useBackupRepositoryForget(rawBrs: MaybeRefOrGetter<FrontXoBackupRepository[]>) {
  const brs = toComputed(rawBrs)

  const { t } = useI18n()

  const selectedBrId = useRouteQuery('id')

  const route = useRoute<'/admin/backup-repository/[id]'>()

  const { redirectIfOnObjectPage } = useRedirectAfterDelete({
    isOnObjectPage: () => brs.value.some(br => br.id === route.params.id),
    redirectTo: { name: '/admin/backup-and-replication/backup-repositories' },
  })

  const {
    run,
    canRun: canForgetBackupRepositories,
    isRunning: isForgettingBackupRepositories,
    errorMessage: forgetBackupRepositoriesErrorMessage,
  } = useXoBackupRepositoryForgetJob(brs)

  async function forget() {
    try {
      const results = await run()

      const isSelectedBrForgotten = results.some(
        (result, index) => result.status === 'fulfilled' && brs.value[index]?.id === selectedBrId.value
      )

      if (isSelectedBrForgotten) {
        selectedBrId.value = ''
      }

      await redirectIfOnObjectPage(results)
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

  const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

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
      events: {
        onConfirm: forget,
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
