import { useXoBackupJobDeleteJob } from '@/modules/backup-job/jobs/xo-backup-job-delete.job.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useBackupJobDelete(rawBackupJobs: MaybeRefOrGetter<FrontAnyXoBackupJob[]>) {
  const backupJobs = toComputed(rawBackupJobs)

  const { t } = useI18n()

  const selectedBackupJobId = useRouteQuery('id')

  const {
    run,
    canRun: canDeleteBackupJobs,
    isRunning: isDeletingBackupJobs,
    errorMessage: deleteBackupJobsErrorMessage,
  } = useXoBackupJobDeleteJob(backupJobs)

  function runDelete() {
    const backupJobIds = backupJobs.value.map(backupJob => backupJob.id)

    run({
      detached: true,
      onSuccess: results => {
        const isSelectedBackupJobDeleted = results.some(
          (result, index) => result.status === 'fulfilled' && backupJobIds[index] === selectedBackupJobId.value
        )

        if (isSelectedBackupJobDeleted) {
          selectedBackupJobId.value = ''
        }
      },
    })
  }

  const { open: openDeleteModal } = useOverlay({
    component: () => import('@/modules/backup-job/components/modal/BackupJobDeleteModal.vue'),
    events: {
      onConfirm: runDelete,
      onCancel: true,
    },
  })

  const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

  function deleteBackupJobs() {
    const count = backupJobs.value.length

    if (count === 1) {
      return openDeleteModal()
    }

    return openTypeToConfirmModal({
      props: {
        accent: 'danger',
        icon: 'status:danger-picto',
        title: t('modal:backup-job-delete-title', { n: count }),
        description: t('modal:backup-job-delete-message', { n: count }),
        confirmationText: t('n-jobs', { n: count }),
        confirmLabel: t('action:delete-n-jobs', { n: count }),
      },
      events: {
        onConfirm: runDelete,
      },
    })
  }

  return {
    deleteBackupJobs,
    canDeleteBackupJobs,
    isDeletingBackupJobs,
    deleteBackupJobsErrorMessage,
  }
}
